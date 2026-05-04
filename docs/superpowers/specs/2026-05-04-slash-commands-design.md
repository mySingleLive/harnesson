# 斜杠命令系统设计

日期：2026-05-04

## 概述

在 Agent 聊天输入框中实现斜杠命令系统，支持命令智能补全、高亮显示和命令执行。系统从 Claude Code 实时获取可用命令列表（内置命令 + Skills），提供分组补全弹窗和命令文本高亮。

## 需求

1. **命令输入与执行** — 用户可在聊天输入框输入斜杠命令（如 `/model`、`/clear`），按 Enter 执行
2. **命令注册表** — 从 Claude Code 实时读取支持的命令列表，包括基础命令和 Skills
3. **智能补全** — 输入 `/` 时弹出分组补全候选列表，支持实时过滤
4. **命令高亮** — 输入完整的注册命令名后在输入框中高亮显示

## 执行模型：混合模式

- **基础命令（builtin）**：`/clear`、`/compact`、`/model`、`/help` — 由前端拦截，通过 `POST /api/agents/:id/command` 发给后端直接通过 SDK 执行
- **Skills**：如 `/review`、`/init` — 作为普通消息通过 `POST /api/agents/:id/message` 发送给 Claude Code 执行

## 架构

```
Frontend (React)
├── ChatInputContainer — 三层结构（overlay + textarea + popup）
│   ├── Highlight Overlay — 高亮渲染层（绝对定位，pointer-events: none）
│   ├── Textarea — 实际输入层（color: transparent, caret-color: inherit）
│   └── SlashCommandPopup — 浮动补全列表
├── SlashCommand Registry (Zustand store) — 命令注册表，缓存命令列表
└── parseSlashCommand() — 命令解析与拦截逻辑

Backend (Hono)
├── GET /api/slash-commands — 查询 Claude Code 可用命令
└── POST /api/agents/:id/command — 执行拦截的命令
    └── Claude Code Adapter (SDK)
```

## 数据模型

```typescript
type SlashCommandType = 'builtin' | 'skill';

interface SlashCommand {
  name: string;
  type: SlashCommandType;
  description: string;
}

interface SlashCommandState {
  commands: SlashCommand[];
  isLoading: boolean;
  lastFetched: number | null;
}
```

## 后端 API

### GET /api/slash-commands

查询 Claude Code SDK 获取内置命令和已安装 Skills，返回合并列表。

响应：
```json
{
  "commands": [
    { "name": "clear", "type": "builtin", "description": "清空对话历史" },
    { "name": "compact", "type": "builtin", "description": "压缩对话上下文" },
    { "name": "model", "type": "builtin", "description": "切换 AI 模型" },
    { "name": "help", "type": "builtin", "description": "显示帮助信息" },
    { "name": "review", "type": "skill", "description": "代码审查" },
    { "name": "init", "type": "skill", "description": "初始化项目配置" }
  ]
}
```

### POST /api/agents/:id/command

执行拦截的基础命令。

请求：
```json
{ "command": "clear" }
{ "command": "model", "args": "sonnet" }
```

响应：
```json
{ "success": true, "message": "对话已清空" }
{ "success": false, "error": "未知命令" }
```

## 前端组件

### ChatInputContainer — 三层结构

1. **Highlight Overlay**：绝对定位的 `<div>`，与 textarea 共享相同的 `font-size`、`line-height`、`padding`、`border`、`word-wrap` 样式。设置 `pointer-events: none`。将输入文本中的匹配命令渲染为高亮 `<span>`。
2. **Textarea**：现有输入框，设置 `color: transparent; caret-color: inherit`。用户只看到光标和 overlay 渲染的文字。滚动时 overlay 同步。
3. **SlashCommandPopup**：条件渲染的浮动补全列表。

### SlashCommandPopup

Props：
```typescript
interface SlashCommandPopupProps {
  commands: SlashCommand[];
  filter: string;
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}
```

行为：
- 输入 `/` 时弹出，显示所有命令，按 builtin / skill 分组
- 继续输入过滤候选（如 `/mod` → 只显示 `/model`）
- `↑↓` 导航，`Enter` 选择，`Esc` 关闭
- 选中后替换输入中的 `/xxx` 为完整命令名 + 空格
- 列表最多 8 项，超出滚动
- 鼠标 hover 切换选中项，点击等同于选中并确认
- 无匹配时显示 "没有匹配的命令"
- 输入空格后自动关闭

样式：每个条目为命令名 + 描述，无图标。分组标题区分内置命令和 Skills。

### 命令解析

```typescript
function parseSlashCommand(input: string, commands: SlashCommand[]) {
  const trimmed = input.trim();
  for (const cmd of commands) {
    if (trimmed.startsWith(`/${cmd.name}`)) {
      const after = trimmed.slice(cmd.name.length + 1);
      if (after === '' || after.startsWith(' ')) {
        return { command: cmd, args: after.trim() };
      }
    }
  }
  return null;
}
```

发送流程：
1. 用户按 Enter → `parseSlashCommand()` 检测
2. builtin → `POST /api/agents/:id/command`
3. skill → 作为普通消息 `POST /api/agents/:id/message`
4. 非命令 → 正常发送

仅当消息**首行首字符**为命令时才拦截发送。

### 高亮渲染

```typescript
function renderHighlightedText(text: string, commands: SlashCommand[]) {
  const pattern = commands.map(c => `/${c.name}`).join('|');
  const regex = new RegExp(`(${pattern})(?=\\s|$)`, 'g');
  const parts = text.split(regex);
  return parts.map(part => {
    if (isCommand(part, commands)) {
      return <span className="slash-cmd-highlight">{part}</span>;
    }
    return part;
  });
}
```

高亮样式：
```css
.slash-cmd-highlight {
  color: #7c6ff7;
  background: rgba(124, 111, 247, 0.1);
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 500;
}
```

## 缓存策略

- 前端缓存 5 分钟
- 刷新时机：组件首次挂载、缓存过期后下次使用、新 Agent 创建成功后

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 拦截命令执行失败 | 聊天区域显示系统错误消息 |
| 命令需参数但未提供（如 `/model` 无参数） | 弹窗不关闭，显示提示 |
| 网络 / Agent 不存在 | 复用现有错误处理 |

## 边界情况

| 场景 | 行为 |
|------|------|
| `/` 后立即 Enter | 发送 `/` 作为普通消息 |
| `/xyz`（不存在的命令） | 无高亮，作为普通消息 |
| 粘贴含 `/command` 的文本 | 粘贴后重新扫描高亮 |
| IME 输入中 | composition 期间不触发补全，结束后检测 |
| 命令在消息中间 | 高亮生效，但不拦截（作为普通消息发送） |
| 多行文本中的命令 | 每行独立高亮；仅首行首字符为命令时拦截 |
