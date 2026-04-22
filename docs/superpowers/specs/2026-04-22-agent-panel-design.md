# Agent Panel 设计文档

## 概述

将当前 ChatPanel 重构为 AgentPanel，集成 Agent Session 的上下文信息和聊天功能。点击侧边栏 Agent Session 时打开面板并全局切换项目/分支上下文。

## 架构

### 数据流

```
用户点击侧边栏 Agent Session
  → agentStore.setActiveAgent(agentId)
  → AgentPanel 从 agentStore 读取 activeAgent 展示上下文+聊天
  → projectStore.switchProject(agent.projectId, agent.branch)
  → Topbar 更新项目名/分支名
  → 主内容区 (Outlet) 切换到对应项目数据
```

### 面板状态绑定

每个 Agent Session 独立记住自己的面板显示状态：

```typescript
interface Agent {
  // ...现有字段
  panelState: {
    isOpen: boolean;
    isMaximized: boolean;
  };
}
```

- 切换 Agent Session 时，保存当前 agent 的 panelState，读取目标 agent 的 panelState
- 点击已关闭的 Agent → isOpen 设为 true，isMaximized 保持上次值
- 关闭面板（✕）→ 设置当前 agent 的 panelState.isOpen = false

### Store 变更

#### agentStore

Agent 接口扩展：

- 新增 `panelState: { isOpen: boolean; isMaximized: boolean }`
- 新增 `model` 字段（如 "Sonnet 4.7"）
- 新增 `sessionContext` 关联信息（tokenUsage、elapsedTime 由前端计算）

#### projectStore（新增）

```typescript
interface ProjectStore {
  activeProjectId: string | null;
  activeBranch: string | null;
  switchProject: (projectId: string, branch: string) => void;
}
```

#### useChatPanel

`isOpen` 和 `isMaximized` 不再是全局单例状态，改为从 `agentStore` 的 `activeAgent.panelState` 读取。hook 简化为只提供 `open`/`close`/`toggleMaximize` 的 action 方法。

## 组件设计

### AgentPanel（替代 ChatPanel）

整体结构自上而下：

1. **AgentContextHeader**（固定在顶部）
2. **消息区**（可滚动）
3. **输入区**（固定在底部）

#### 最大化模式

点击最大化按钮后：

- AgentPanel 宽度从 440px 变为 `calc(100vw - 220px)`
- 主内容区（Outlet）被隐藏
- 消息区有更大可视空间，diff 代码块更宽
- 输入区 max-width 800px 居中
- 按钮变为最小化图标，点击恢复原尺寸

### AgentContextHeader

采用固定上下文头方案（方案 A），布局从上到下：

**第一行：** Agent 名称 + 状态徽章 + 运行时间 + 最大化按钮 + 关闭按钮

**第二行（条件显示）：**
- 有关联任务时：任务标题 + 工作区路径 + 模型名 + Token 用量
- 无关联任务（纯聊天）时：工作区路径 + 模型名 + Token 用量

```
┌──────────────────────────────────────────────┐
│ Agent A  [Running]  12m 34s  [⛶] [✕]       │
├──────────────────────────────────────────────┤
│ 实现 JWT 认证                    ← 可选      │
│ 📁 worktree/agent-a                          │
│ Claude Sonnet 4.7  ·  2.4k tokens            │
└──────────────────────────────────────────────┘
```

状态徽章颜色映射：
- `running` → 橙色 `bg-orange-500/15 text-orange-500`
- `waiting` → 黄色
- `completed` → 绿色
- `error` → 红色
- `idle` → 灰色

运行时间从 `agent.createdAt` 开始，用 `useElapsedTime` hook 每秒实时更新。

### 消息区

复用现有 ChatPanel 的消息渲染逻辑：
- 用户消息（紫色背景标识 "You"）
- Agent 回复（绿色标识 agent 名称）
- DiffCodeBlock（带语法高亮的代码差异展示）

### 输入区

复用 Claude Code 风格输入框：
- 圆角文本框 + 工具栏
- 工具栏中的选择器从当前 agent 属性读取
- 快捷键提示（Enter 发送 / Shift+Enter 换行 / @ 引用 / / 斜杠命令）

## 项目/分支切换

### 切换规则

- 点击 Agent Session → 自动切换项目和分支，Topbar 立即更新
- 关闭 AgentPanel → 不回切项目，保持当前项目上下文
- 点击同一 Agent → 不重复切换（projectId 和 branch 未变时跳过）

### Topbar 变更

项目名和分支名从 projectStore 读取，替代当前硬编码的 "My Project A" / "main branch"。

## 文件结构

### 新增

- `packages/shared/src/types/agent.ts` — 扩展 Agent 接口
- `apps/web/src/components/layout/AgentPanel.tsx` — 替代 ChatPanel
- `apps/web/src/components/layout/AgentContextHeader.tsx` — 固定顶部上下文栏
- `apps/web/src/stores/projectStore.ts` — 项目/分支状态管理
- `apps/web/src/hooks/useElapsedTime.ts` — 运行时间实时计算

### 修改

- `apps/web/src/stores/agentStore.ts` — Agent 接口加 panelState
- `apps/web/src/hooks/useChatPanel.ts` — 状态改为从 agent 读取
- `apps/web/src/components/layout/MainLayout.tsx` — ChatPanel → AgentPanel，集成项目切换
- `apps/web/src/components/layout/Topbar.tsx` — 从 projectStore 读取项目信息
- `apps/web/src/components/layout/Sidebar.tsx` — onAgentClick 增加项目切换

### 删除

- `apps/web/src/components/layout/ChatPanel.tsx` — 被 AgentPanel 替代

### 不涉及

- 路由结构不变
- 页面组件暂不改动
