# 节点 JSON Schema 详细说明

本文件定义规格树中所有节点的 JSON 结构。仅在生成或校验节点时加载。

## 通用节点结构

每个节点是一个 JSON 对象，包含以下字段：

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 节点唯一标识，kebab-case 格式（如 `agent-chat-panel`）。同层级内唯一。 |
| name | string | 节点显示名称（如 `Agent Chat Panel`）。同层级内唯一。 |
| level | integer | 层级深度。根节点 = 1，子节点递增。 |
| parent | string \| null | 父节点 id。根节点为 null。 |
| children | string[] | 子节点 id 列表。叶子节点为空数组 `[]`。 |
| isLeaf | boolean | 是否叶子节点。无子节点时为 true。 |
| summary | string | 功能简述/摘要。1-3 句话。 |
| status | string | 节点状态：`published`（已发布）或 `draft`（草稿）。 |
| syncMeta | object | 同步元信息，结构见下方。 |

### 按需填充字段

| 字段 | 类型 | 说明 |
|------|------|------|
| goals | string[] | 功能目标列表。每个目标一句话。 |
| design | object \| null | 设计方案。包含 `overview`（string，方案概述）和可选的 `flow`（string，流程设计）。仅在有明确设计模式时生成。 |
| acceptanceCriteria | array[object] | 验收标准列表。每个对象包含 `given`、`when`、`then` 三个 string 字段。每个功能至少 1 条。 |
| testCases | array[object] | 测试用例列表。每个对象结构见下方。 |

### syncMeta 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| lastSyncAt | string | ISO 8601 时间戳，最后一次同步时间。 |
| baseCommit | string | 同步基准的 git commit hash（短格式，如 `e270401`）。 |
| baseCommitMessage | string | 基准 commit 的消息。 |
| branch | string | 同步时的 git 分支名。 |
| sourceFiles | string[] | 该节点关联的源文件/目录路径列表。 |

### testCase 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| level | string | 优先级：`p0`（验收标准级）、`p1`（分支覆盖）、`p2`（边界条件）、`p3`（兼容性/环境）。 |
| type | string | 测试类型：`unit`、`integration`、`e2e`。 |
| given | string | Given/When/Then 格式的前置条件。 |
| when | string | Given/When/Then 格式的操作/触发条件。 |
| then | string | Given/When/Then 格式的预期结果。 |

## 根节点（project.json）额外字段

| 字段 | 类型 | 说明 |
|------|------|------|
| treeDepth | integer | 当前规格树的最大深度。 |
| treeScenario | string | 树的场景类型，取值：`single`（一层，仅项目描述）、`flat`（二层，项目+功能列表）、`multi-functional`（多层-功能细化）、`multi-domain`（多层-多领域）。 |

根节点的 `id` 固定为 `"project"`，`level` 固定为 `1`，`parent` 固定为 `null`。

## 测试用例级别详解

| 级别 | 含义 | 生成来源 |
|------|------|----------|
| p0 | 验收标准级，最高优先级 | 从 acceptanceCriteria 直接转换，每个验收标准至少 1 个 p0 用例 |
| p1 | 分支覆盖 | 分析代码中的条件分支逻辑（if/else、switch、try/catch） |
| p2 | 边界条件 | 识别输入边界、空值、极端值、并发等边界场景 |
| p3 | 兼容性/环境 | 跨浏览器、不同运行环境、不同配置的兼容性测试 |

## 示例

### 中间节点（有子节点）

```json
{
  "id": "agent-management",
  "name": "Agent 管理",
  "level": 2,
  "parent": "project",
  "children": ["agent-session", "agent-context-menu"],
  "isLeaf": false,
  "summary": "Agent 的生命周期管理和交互功能，包括会话管理、上下文菜单和状态同步。",
  "goals": [
    "支持创建、切换和管理 Agent 会话",
    "提供 Agent 操作的快捷菜单"
  ],
  "design": {
    "overview": "采用 React + Hono 前后端分离架构，WebSocket 实现实时状态同步。",
    "flow": "用户操作 → API 请求 → 服务端处理 → WebSocket 推送 → 前端状态更新"
  },
  "acceptanceCriteria": [
    {
      "given": "用户在侧边栏查看 Agent 列表",
      "when": "右键点击某个 Agent",
      "then": "显示包含重命名、删除等操作的上下文菜单"
    }
  ],
  "testCases": [
    {
      "level": "p0",
      "type": "e2e",
      "given": "侧边栏已加载 Agent 列表",
      "when": "右键点击 Agent 卡片",
      "then": "出现上下文菜单，包含所有预期操作项"
    }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": [
      "apps/web/src/components/AgentPanel/",
      "apps/server/src/routes/agents.ts"
    ]
  }
}
```

### 叶子节点

```json
{
  "id": "chat-input",
  "name": "聊天输入框",
  "level": 3,
  "parent": "agent-chat-panel",
  "children": [],
  "isLeaf": true,
  "summary": "用户输入消息的文本框组件，支持多行输入、快捷键发送和文件拖拽。",
  "goals": [
    "支持多行文本输入和自动调整高度",
    "支持 Enter 发送、Shift+Enter 换行"
  ],
  "acceptanceCriteria": [
    {
      "given": "聊天面板已打开且输入框可见",
      "when": "输入文本并按 Enter",
      "then": "消息发送到 Agent，输入框清空"
    },
    {
      "given": "输入框中有文本",
      "when": "按 Shift+Enter",
      "then": "插入换行符，不发送消息"
    }
  ],
  "testCases": [
    {
      "level": "p0",
      "type": "e2e",
      "given": "聊天面板已打开",
      "when": "输入 'hello' 并按 Enter",
      "then": "消息发送成功，输入框清空"
    },
    {
      "level": "p1",
      "type": "unit",
      "given": "输入框组件已挂载",
      "when": "输入为空时按 Enter",
      "then": "不触发发送操作"
    },
    {
      "level": "p2",
      "type": "unit",
      "given": "输入框有大量文本（10000+ 字符）",
      "when": "按 Enter 发送",
      "then": "正常发送，不截断"
    }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": [
      "apps/web/src/components/chat/ChatInput.tsx"
    ]
  }
}
```

### 根节点

```json
{
  "id": "project",
  "name": "Harnesson",
  "level": 1,
  "parent": null,
  "treeDepth": 3,
  "treeScenario": "multi-domain",
  "children": ["agent-management", "agent-chat-panel", "code-sync"],
  "isLeaf": false,
  "summary": "Visual AI Coding Management Platform - 基于 AI Agent 的可视化编码管理平台。",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": []
  }
}
```
