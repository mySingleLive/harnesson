# Subagent 实时树形展示设计

## 概述

将 Subagent 调用从"完成后一次性展示"改为"实时流式树形展示"，用户可以看到子代理执行过程中的工具调用和文本输出，视觉风格为连接线缩进树 + 半透明状态底色卡片。

## 背景

当前 `claude-code-adapter.ts` 中，遇到 Agent tool_use 时会缓冲所有子事件到 `subEventBuffers`，子代理完成后才将内容打包为嵌套 JSON 塞进单个 `agent.tool_result`。客户端在子代理运行期间看不到任何内部进展。

## 设计

### 1. 服务端 Adapter 层改动

**文件：** `apps/server/src/lib/claude-code-adapter.ts`

**移除：**
- `subEventBuffers` 缓冲逻辑
- `pairSubEvents` 函数
- 完成时打包嵌套 JSON 的逻辑

**改为：**
- 遇到 Agent tool_use 时立即 yield `agent.tool_use`，附上 `tool_use_id`
- 子代理内部的 `agent.text` 事件立即 yield，附加 `parentToolUseId` 和 `depth`
- 子代理内部的 `agent.tool_use` 事件立即 yield，附加 `parentToolUseId` 和 `depth`
- 子代理内部的 `agent.tool_result` 事件立即 yield，附加 `parentToolUseId` 和 `depth`
- 子代理完成时 yield `agent.tool_result`，output 为最终文本摘要（非嵌套 JSON）
- `agentStack` 仅用于跟踪当前 depth 和 parentToolUseId，不再缓冲

### 2. 客户端事件处理

**新函数：** `buildEventTree(events: AgentStreamEvent[]): TreeSegment[]`

```typescript
interface TreeSegment {
  type: 'text' | 'tool' | 'qa-result'
  content?: string
  event?: PairedToolEvent
  question?: string
  answer?: string
  children?: TreeSegment[]  // 仅 Agent 工具有值
}
```

**处理逻辑：**
1. 按 `parentToolUseId` 分组：`null/undefined` 归根层，其他归属对应 Agent tool_use
2. 根层和子代理层都复用现有配对逻辑（tool_use + tool_result 配对）
3. 流式场景下，无 output 的 ToolSegment 表示运行中

**历史兼容：** 检测旧格式 `agent.tool_result` output（嵌套 JSON `{ textOutput, subEvents, subTexts }`），拆包为等效扁平事件再建树，无需数据迁移。

### 3. UI 渲染层

**组件结构：**

```
AgentMessageBubble
  └─ 递归渲染 TreeSegment[]
       ├─ TextSegment → Markdown 文本块
       ├─ QAResultSegment → QA 卡片
       └─ ToolSegment
            ├─ 非 Agent → 现有 SingleToolEventCard
            └─ Agent → StreamingAgentCard
                 └─ AgentTreeChildren（递归）
```

**卡片状态样式（半透明底色 + 连接线）：**

| 状态 | 底色 | 边框 | 右侧标签 |
|------|------|------|----------|
| 运行中 | `rgba(168,85,247,0.08)` | `rgba(168,85,247,0.2)` | 紫色圆点 + `running...` |
| 完成 | `rgba(74,222,128,0.06)` | `rgba(74,222,128,0.15)` | 绿色 `✓ + 时长` |
| 错误 | `rgba(239,68,68,0.08)` | `rgba(239,68,68,0.2)` | 红色 `✗ + 时长` |
| 等待 | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.06)` | 灰色 `pending` |

**连接线：** 子树容器 `margin-left: 20px; border-left: 1.5px solid #3a3a5c; padding-left: 14px`

**折叠行为：**
- 运行中：自动展开，显示实时子事件
- 完成后：自动折叠为单行摘要（CSS transition 动画）
- 用户手动展开过的卡片不受影响

### 4. 流式状态与兼容性

**agentStore：** 无需特殊改动，事件照常追加到 `message.events[]`，`buildEventTree` 是纯函数按需计算。

**迁移策略：**
- `segmentEvents` 函数保留，`buildEventTree` 内部复用其配对逻辑
- `AgentMessageBubble` 调用从 `segmentEvents` 切换为 `buildEventTree`
- 现有 `AgentCard` + `AgentEventTree` 合并为新的 `StreamingAgentCard`
- 非子代理工具卡片样式不变

## 影响范围

| 文件 | 改动类型 |
|------|----------|
| `claude-code-adapter.ts` | 重构：移除缓冲，流式发出子事件 |
| `segmentEvents.ts` | 新增 `buildEventTree` 函数 |
| `AgentCard.tsx` | 重写为 `StreamingAgentCard` |
| `AgentEventTree.tsx` | 合并入 `StreamingAgentCard` |
| `MessageRenderer.tsx` | 切换为 `buildEventTree`，适配 TreeSegment |
| `pairEvents.ts` | 无改动 |
