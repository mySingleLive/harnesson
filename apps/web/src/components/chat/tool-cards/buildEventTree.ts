import type { AgentStreamEvent } from '@harnesson/shared';
import type { PairedToolEvent } from './pairEvents';

export type TreeSegment =
  | { type: 'text'; content: string }
  | { type: 'tool'; event: PairedToolEvent; toolUseId?: string; children?: TreeSegment[] }
  | { type: 'qa-result'; question: string; answer: string };

interface SubEventShape {
  tool: string;
  input?: Record<string, unknown>;
  output?: string;
  textOutput?: string;
  isError?: boolean;
  duration?: number;
  subEvents?: SubEventShape[];
  subTexts?: string[];
}

/** 检测并展开旧格式嵌套 JSON（历史数据兼容） */
function expandLegacyNested(events: AgentStreamEvent[]): AgentStreamEvent[] {
  const result: AgentStreamEvent[] = [];

  for (const event of events) {
    result.push(event);

    if (
      event.type === 'agent.tool_result' &&
      event.tool === 'Agent' &&
      event.output
    ) {
      let parsed: SubEventShape | undefined;
      try {
        parsed = JSON.parse(event.output);
      } catch {
        continue;
      }

      if (!parsed.subEvents && !parsed.subTexts) continue;

      // 获取对应 tool_use 的 id 作为 parentToolUseId
      const agentToolUseId = event.tool_use_id;

      // 替换 output 为实际文本
      result[result.length - 1] = {
        ...event,
        output: parsed.textOutput ?? event.output,
      };

      // 展开子文本
      for (const text of parsed.subTexts ?? []) {
        result.push({
          type: 'agent.text',
          text,
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
      }

      // 展开子工具事件
      for (const sub of parsed.subEvents ?? []) {
        result.push({
          type: 'agent.tool_use',
          tool: sub.tool,
          input: sub.input ?? {},
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
        result.push({
          type: 'agent.tool_result',
          tool: sub.tool,
          output: sub.output,
          isError: sub.isError,
          duration: sub.duration,
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
      }
    }
  }

  return result;
}

/** 按 parentToolUseId 分组事件 */
function partitionByParent(events: AgentStreamEvent[]): Map<string | null, AgentStreamEvent[]> {
  const groups = new Map<string | null, AgentStreamEvent[]>();
  groups.set(null, []);

  for (const event of events) {
    const key = event.parentToolUseId ?? null;
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(event);
  }

  return groups;
}

/** 对一组扁平事件执行配对和分段 */
function segmentGroup(events: AgentStreamEvent[]): TreeSegment[] {
  const segments: TreeSegment[] = [];
  let textBuffer = '';
  const pendingTools: Array<{ tool: string; input: Record<string, unknown>; tool_use_id?: string }> = [];

  function flushText() {
    if (textBuffer) {
      segments.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  }

  for (const event of events) {
    if (event.type === 'agent.text') {
      if (event.text) textBuffer += event.text;
    } else if (event.type === 'agent.tool_use') {
      if (event.tool === 'TodoWrite') continue;
      flushText();
      pendingTools.push({ tool: event.tool ?? 'unknown', input: event.input ?? {}, tool_use_id: event.tool_use_id });
    } else if (event.type === 'agent.tool_result') {
      flushText();

      if (event.tool === 'AskUserQuestion') {
        const paired = pendingTools.find(p => p.tool === 'AskUserQuestion');
        const questions = paired?.input?.questions as Array<Record<string, unknown>> | undefined;
        const question = String(questions?.[0]?.question ?? '');
        const idx = pendingTools.findIndex(p => p.tool === 'AskUserQuestion');
        if (idx >= 0) pendingTools.splice(idx, 1);
        segments.push({ type: 'qa-result', question, answer: String(event.output ?? '') });
        continue;
      }

      if (event.tool === 'TodoWrite') continue;

      const toolName = event.tool;
      if (pendingTools.length > 0) {
        const { tool, input, tool_use_id } = pendingTools.shift()!;
        segments.push({
          type: 'tool',
          toolUseId: tool_use_id,
          event: {
            tool: toolName && toolName !== 'unknown' ? toolName : tool,
            input,
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      } else {
        segments.push({
          type: 'tool',
          event: {
            tool: toolName ?? 'unknown',
            input: {},
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      }
    }
  }

  flushText();
  for (const { tool, input } of pendingTools) {
    segments.push({ type: 'tool', event: { tool, input } });
  }

  return segments;
}

/** 将扁平事件列表构建为树形结构 */
export function buildEventTree(events: AgentStreamEvent[]): TreeSegment[] {
  const expanded = expandLegacyNested(events);
  const groups = partitionByParent(expanded);

  // 构建根层 segments
  const rootEvents = groups.get(null) ?? [];
  const rootSegments = segmentGroup(rootEvents);

  // 为每个 Agent ToolSegment 填充 children
  function fillChildren(segments: TreeSegment[]): TreeSegment[] {
    return segments.map(seg => {
      if (seg.type === 'tool' && seg.event.tool === 'Agent' && seg.event.input) {
        // 从配对的 tool_use 事件中获取 tool_use_id
        // 需要找到对应的原始 tool_use 事件来获取 tool_use_id
        const childGroup = findChildGroup(seg, groups);
        if (childGroup && childGroup.length > 0) {
          return { ...seg, children: fillChildren(segmentGroup(childGroup)) };
        }
      }
      return seg;
    });
  }

  return fillChildren(rootSegments);
}

function findChildGroup(
  seg: TreeSegment,
  groups: Map<string | null, AgentStreamEvent[]>
): AgentStreamEvent[] | undefined {
  if (seg.toolUseId) {
    return groups.get(seg.toolUseId);
  }
  return undefined;
}
