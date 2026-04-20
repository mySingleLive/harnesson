# Harnesson 平台框架设计文档

> 日期: 2026-04-20
> 状态: Draft
> 范围: 整体平台框架 — UI 布局、核心数据模型、页面功能定义

---

## 1. 项目概述

Harnesson 是一个多 Agent 协同开发管理平台，以 Harness Engineering/SDD 为核心理念。支持同时创建和管理多个 AI Agent，每个 Agent 在独立的项目分支（git worktree）上执行特定任务。

### 1.1 核心能力

- **多 Agent 并行管理**: 支持 Claude Code、GPT、Cursor 等多种 Agent 类型同时运行
- **项目规格树 (Spec Tree)**: 扫描用户项目并生成/同步全局规格树（业务节点 L3/L4/L5+、技术节点）
- **规格驱动任务生成**: 规格变更时自动 diff 生成任务
- **Git 工作流管理**: 类 JetBrains IDEA 风格的 Git 管理页面
- **任务看板**: 从 Backlog 到 Done 的完整状态流转

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 组件库 | shadcn/ui + Tailwind CSS |
| 图标 | Lucide SVG 线性图标 |
| 后端 | Node.js + Express/Fastify |
| 数据库 | SQLite (本地) |
| 通信 | REST API + WebSocket (实时 Agent 状态推送) |
| 代码编辑器 | Monaco Editor (只读 Diff 查看器) |

### 2.2 项目结构 (Monorepo)

```
harnesson/
├── apps/
│   ├── web/                # React 前端 SPA
│   │   ├── src/
│   │   │   ├── components/ # UI 组件
│   │   │   ├── pages/      # 页面
│   │   │   ├── stores/     # 状态管理
│   │   │   ├── hooks/      # 自定义 hooks
│   │   │   └── lib/        # 工具函数
│   │   └── ...
│   └── server/             # Node.js 后端
│       ├── src/
│       │   ├── routes/     # API 路由
│       │   ├── services/   # 业务逻辑
│       │   ├── models/     # 数据模型
│       │   └── ws/         # WebSocket 处理
│       └── ...
├── packages/
│   └── shared/             # 共享类型定义
└── docs/superpowers/       # 规格文档
```

---

## 3. 数据模型

### 3.1 Agent

```typescript
type AgentType = 'claude-code' | 'gpt' | 'cursor' | string;
type AgentStatus = 'running' | 'waiting' | 'completed' | 'error' | 'idle';

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  projectId: string;
  branch: string;
  worktreePath: string;
  taskId?: string;
  pid?: number;
  model?: string;        // 当前使用的模型
  createdAt: string;
  error?: string;
}
```

**Agent 状态指示器设计**:
| 状态 | 颜色 | 动画 |
|------|------|------|
| Running | 橙色 (#f97316) | 呼吸灯 (pulse-scale, 1.8s) |
| Completed | 绿色 (#22c55e) | 静态 |
| Waiting | 黄色 (#f59e0b) | 半透明 |
| Error | 红色 + 感叹号图标 | 静态 |
| Idle | 灰色 (#666) | 静态 |

### 3.2 Project

```typescript
interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 SpecNode

```typescript
type SpecNodeType = 'business' | 'tech';

interface SpecNode {
  id: string;
  projectId: string;
  parentId?: string;
  type: SpecNodeType;
  level: number;         // 业务节点: L3/L4/L5+
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 Task

```typescript
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'failed';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sourceSpecId?: string;
  sourceDiff?: string;
  assignedAgentId?: string;
  branch: string;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
  startedAt?: string;
  reviewedAt?: string;
  testedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**任务状态流转**:
```
Backlog/To Do → In Progress → Review → Testing → Done
                     ↓            ↓          ↓
                   Failed       Failed     Failed
```

---

## 4. UI 布局设计

### 4.1 整体布局: 三栏结构

采用方案 C（混合式）: 项目级 Topbar + 功能级 Sidebar + Agent 聊天面板。

```
┌─────────────────────────────────────────────────────────────┐
│ Topbar: Logo | 项目选择器 | 分支 | Agent 统计 | Settings     │
├──────────┬──────────────────┬────────────────────────────────┤
│ Sidebar  │ Agent Chat Panel │ Main Content Area              │
│ 220px    │ 440px (可折叠)    │ flex: 1                        │
│          │                  │                                │
│ ──────── │ ┌──────────────┐ │                                │
│ Nav:     │ │ Header       │ │                                │
│ Dashboard│ │ Agent A  ▪Run│ │                                │
│ Specs    │ ├──────────────┤ │                                │
│ Tasks    │ │ Messages     │ │                                │
│ Git      │ │ (Cursor 风格)│ │                                │
│          │ │              │ │                                │
│ ──────── │ │ Diff 代码块  │ │                                │
│ Agents:  │ ├──────────────┤ │                                │
│ Agent A  │ │ Input Area   │ │                                │
│ Agent B  │ │ (CC 风格)    │ │                                │
│ Agent C  │ └──────────────┘ │                                │
└──────────┴──────────────────┴────────────────────────────────┘
```

### 4.2 配色方案 (暗色主题)

| 元素 | 色值 |
|------|------|
| 页面背景 | #0d0d1a |
| 侧边栏背景 | #1e1e32 |
| 聊天面板背景 | #191930 |
| 主内容区背景 | #16162a |
| 主题色 (Accent) | #8b5cf6 |
| 边框 | #333 |
| 主文字 | #e0e0e0 |
| 次要文字 | #888 |
| 自定义滚动条 | rgba(139,92,246,0.3) |

### 4.3 侧边栏 (220px)

- **导航区**: Dashboard / Specs / Tasks / Git — Lucide SVG 线性图标
- **New Agent 按钮**: 紫色背景 (#8b5cf6)
- **Agent 列表**: 状态指示器 + Agent 名称 + 类型标签 + 项目/分支信息
- 无分区标题文字

### 4.4 Agent 聊天面板 (440px)

#### 聊天内容区 (Cursor 风格)
- **无头像**: 去掉用户/AI 头像
- **扁平分段式布局**: 每条消息占满宽度，用细分隔线区分
- **消息标签**: 左侧小图标 + "YOU" / "AGENT A" 标签
- **用户消息**: 淡紫色背景区分
- **AI 消息**: 透明背景
- **Diff 代码块**: 红色删除行 (rgba(239,68,68,0.1) + #f87171) + 绿色新增行 (rgba(34,197,94,0.1) + #4ade80) + 行号 + 文件名 + 统计

#### 输入框 (Claude Code 桌面版风格)
- **圆角胶囊式输入框** (border-radius: 16px)，Focus 时紫色边框高亮
- **上下文标签区**: `@文件引用`、`Tools` 标签，可 × 移除
- **底部工具栏** (从左到右):
  - `+` 按钮 — 弹出菜单: 添加图片 / 引用文件(@) / 斜杠命令(/) / Tools / MCP Servers
  - **Agent 选择器** — Claude 官方 logo + "Claude Code" + 下拉箭头
  - **Worktree 选择器** — Git 分支图标 + "main" + 下拉箭头
  - **模型选择器** — 紫色小圆点 + "Sonnet 4.7" + 下拉箭头
  - **发送按钮** — 紫色上箭头
- **快捷键提示**: Enter 发送 / Shift+Enter 换行 / @ 引用文件 / / 斜杠命令

---

## 5. 页面功能定义

### 5.1 Dashboard (`/`)

- 统计卡片: Running / Pending / Specs / Errors 数量
- Agent 实时状态列表
- 最近活动时间线

### 5.2 Specs (`/specs`)

- **列表视图**: 所有规格节点的扁平列表，支持搜索/筛选
- **树形视图**: 规格节点的层级树/思维导图展示
- CRUD 管理: 新增/编辑/删除规格节点
- 规格变更 → 自动 diff 生成任务

### 5.3 Tasks (`/tasks`)

- **看板视图**: 按状态分列 (Backlog / To Do / In Progress / Review / Testing / Done)
- **右侧任务详情面板**:
  - 任务标题、描述、优先级、标签
  - **Agent 类型选择**: Claude Code / Cursor / GPT 等
  - **模型选择**: Opus 4.7 / Sonnet 4.7 / GLM 5.1 等
  - **Worktree 选择**: 当前分支 / 新建分支
  - **"执行任务"按钮**: 分配到新 Agent 开始执行
- 任务完成/失败时页面消息提醒

### 5.4 Git (`/git`)

- 类 JetBrains IDEA 风格的 Git 管理页面
- Commit / Push / Pull 操作
- 提交历史查看
- Monaco Editor 只读 Diff 查看器
- 分支管理

### 5.5 Agent Detail (`/agents/:id`)

- Agent 详细信息面板
- 完整聊天历史
- 执行日志
- 资源使用情况

---

## 6. 后端核心模块

| 模块 | 职责 |
|------|------|
| ProjectManager | 项目 CRUD、项目路径管理 |
| AgentManager | Agent 生命周期管理、进程监控、状态推送 |
| SpecManager | 规格树 CRUD、diff 计算、任务生成 |
| TaskManager | 任务 CRUD、状态流转、Agent 分配 |
| GitManager | Git 操作封装、worktree 管理、diff 查看 |

---

## 7. 关键交互流程

### 7.1 创建并执行任务

1. 用户在 Tasks 页面点击新建任务
2. 右侧面板打开，填写任务详情
3. 选择 Agent 类型、模型、Worktree
4. 点击"执行任务" → 后端创建新 Agent 进程
5. Agent 在独立 worktree 上开始执行
6. WebSocket 推送实时状态更新到前端

### 7.2 规格变更 → 任务生成

1. 用户在 Specs 页面修改规格节点
2. 系统计算 diff
3. 基于变更内容自动生成建议任务
4. 用户确认后任务进入 Backlog

### 7.3 Agent 聊天交互

1. 点击侧边栏 Agent → 聊天面板展开
2. 在 Claude Code 风格输入框中输入指令
3. 支持 @文件引用、/斜杠命令、拖拽图片
4. Agent 实时流式响应，包含 Diff 代码块展示文件修改
5. 用户可切换模型、Agent 类型、Worktree
