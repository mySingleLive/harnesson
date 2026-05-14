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
| isLeaf | boolean | 是否叶子节点。判定依据见 SKILL.md 节点识别原则中的叶子判定核心规则。无子节点时为 true。 |
| summary | string | 功能简述/摘要。1-3 句话。 |
| status | string | 节点状态，固定枚举值，见下方状态定义。 |
| syncMeta | object | 同步元信息，结构见下方。 |

### 按需填充字段

| 字段 | 类型 | 说明 |
|------|------|------|
| goals | string[] | 功能目标列表。每个目标一句话。 |
| design | string \| null | 设计文档的相对路径（相对于 specs/ 目录），如 `"design/ai-chat.md"`。仅在有明确设计内容时生成。 |
| acceptanceCriteria | array[object] | 验收标准列表。每个对象包含 `given`、`when`、`then` 三个 string 字段。每个功能至少 1 条。 |
| testCases | object | 测试用例分组对象。结构见下方。 |
| specDetail | object | 规格详细信息。包含 `description`（Markdown 描述）和 `parameters`（string[]，可测试可量化的参数列表）。叶子节点优先填充。 |
| constraints | string[] | 约束条件列表。描述功能的边界条件、适用/不适用场景、错误条件、前置/后置条件等。每条为自由文本。叶子节点优先填充。 |

### specDetail 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | Markdown 格式的功能详细描述。 |
| parameters | string[] | 可测试、可量化的参数/规格列表。每条描述一个可观测的特性：UI 布局、字号、颜色、最大/最小值、时间阈值等。至少 1 条。 |

### syncMeta 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| lastSyncAt | string | ISO 8601 时间戳，最后一次同步时间。 |
| baseCommit | string | 同步基准的 git commit hash（短格式，如 `e270401`）。 |
| baseCommitMessage | string | 基准 commit 的消息。 |
| branch | string | 同步时的 git 分支名。 |
| sourceFiles | string[] | 该节点关联的源文件/目录路径列表。 |

### status 状态定义

节点 status 为固定枚举，共 8 个值：

| 状态 | 含义 | 设置方式 |
|------|------|----------|
| `draft` | 规格节点未通过用户审核 | Skill 流程自动设置 |
| `backlog` | 已提议，未计划做 | Agent 自动检测 |
| `todo` | 计划要做，未开始 | 用户手动 |
| `in-progress` | 正在实施中 | Agent 自动检测 |
| `review` | 审核阶段 | 用户手动 |
| `testing` | 测试阶段（非 unit test，而是 script/e2e 等） | Agent 自动检测 |
| `dev-done` | 开发完成 | 用户手动 |
| `released` | 已发布 | Agent 自动检测 |

#### Agent 自动检测规则

用户审核通过后（Step 5 确认通过时），Agent 按以下优先级从高到低匹配，命中第一条即停止：

1. 代码在 main/master 分支 + 所有测试通过 → `released`
2. 测试脚本存在但未全部通过 → `testing`
3. 代码部分实现 或 仅在功能分支上（非 main） → `in-progress`
4. 代码中存在 TODO/FIXME 注解标记该功能 → `backlog`

#### 流转规则

- `draft` → 任意非 draft 状态（用户审核通过时，Agent 按规则自动赋值）
- 其余状态间允许回退（如 `testing` → `in-progress`）
- `todo`、`review`、`dev-done` 由用户手动设置，Agent 不自动赋值这三个状态

### testCases 结构

testCases 为一个对象，包含三个固定分组键，每个分组值为用例数组：

| 字段 | 类型 | 说明 |
|------|------|------|
| unit-test | array[object] | 单元测试用例。可为空数组。 |
| end-to-end | array[object] | 端到端测试用例。可为空数组。 |
| script-test | array[object] | 脚本测试用例。可为空数组。 |

每个分组键必须始终存在，即使为空数组。

用例对象结构（在各分组内）：

| 字段 | 类型 | 说明 |
|------|------|------|
| level | string | 优先级：`p0`（验收标准级）、`p1`（分支覆盖）、`p2`（边界条件）、`p3`（兼容性/环境）。 |
| given | string | Given/When/Then 格式的前置条件。 |
| when | string | Given/When/Then 格式的操作/触发条件。 |
| then | string | Given/When/Then 格式的预期结果。 |

用例不再包含 `type` 字段（由分组键隐含）。

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
  "design": "design/agent-management.md",
  "acceptanceCriteria": [
    {
      "given": "用户在侧边栏查看 Agent 列表",
      "when": "右键点击某个 Agent",
      "then": "显示包含重命名、删除等操作的上下文菜单"
    }
  ],
  "testCases": {
    "unit-test": [],
    "end-to-end": [
      {
        "level": "p0",
        "given": "侧边栏已加载 Agent 列表",
        "when": "右键点击 Agent 卡片",
        "then": "出现上下文菜单，包含所有预期操作项"
      }
    ],
    "script-test": []
  },
  "status": "released",
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
  "testCases": {
    "unit-test": [
      {
        "level": "p1",
        "given": "输入框组件已挂载",
        "when": "输入为空时按 Enter",
        "then": "不触发发送操作"
      },
      {
        "level": "p2",
        "given": "输入框有大量文本（10000+ 字符）",
        "when": "按 Enter 发送",
        "then": "正常发送，不截断"
      }
    ],
    "end-to-end": [
      {
        "level": "p0",
        "given": "聊天面板已打开",
        "when": "输入 'hello' 并按 Enter",
        "then": "消息发送成功，输入框清空"
      }
    ],
    "script-test": []
  },
  "specDetail": {
    "description": "多行文本输入组件，支持自动高度调整、快捷键发送和文件拖拽。输入框使用 textarea 实现，最小高度 40px，最大高度 200px 后出现滚动条。",
    "parameters": [
      "输入框最小行高 40px，最大可扩展到 200px",
      "Enter 发送消息，Shift+Enter 插入换行",
      "发送按钮图标为 PaperPlaneIcon，尺寸 20x20px，颜色 #6B7280",
      "最大输入字符数为 10000，超出后截断"
    ]
  },
  "constraints": [
    "输入为空时按 Enter → 不触发发送",
    "网络断开时发送 → 显示'发送失败'提示，消息保留在输入框",
    "仅支持纯文本和 Markdown 语法，不支持富文本粘贴",
    "组件未挂载时无法输入"
  ],
  "status": "released",
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
