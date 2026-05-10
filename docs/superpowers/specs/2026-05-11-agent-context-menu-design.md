# Agent 卡片右键菜单

## 概述

为左侧 Sidebar 中的 Agent 导航卡片添加鼠标右键菜单，支持打开/关闭、复制用户消息（子菜单）、删除三项操作。

## 组件架构

涉及文件：

```
apps/web/src/components/layout/
├── Sidebar.tsx              ← 修改：agent 卡片绑定 onContextMenu
├── AgentContextMenu.tsx     ← 新建：右键菜单主组件（Portal）
├── ConfirmDialog.tsx        ← 新建：删除确认弹窗（Portal）
```

### Sidebar 修改

在 agent 卡片 `<button>` 上添加 `onContextMenu` 事件处理器：

- 调用 `e.preventDefault()` 阻止浏览器默认菜单
- 记录鼠标坐标 `{ x: e.clientX, y: e.clientY }` 和目标 agent
- 将状态传给 AgentContextMenu

### AgentContextMenu

Props:

```typescript
interface AgentContextMenuProps {
  agent: Agent;
  x: number;
  y: number;
  onClose: () => void;
}
```

职责：
- 通过 React Portal 渲染到 `document.body`
- 读取 agentStore 中的 messages 和 panelState
- 管理子菜单 hover 状态
- 处理视口边界检测，调整菜单位置
- 点击菜单外、按 Escape 时关闭

### ConfirmDialog

Props:

```typescript
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

职责：
- Portal 到 body 的居中模态框
- 背景遮罩点击关闭（等同于取消）
- Enter 确认，Escape 取消
- 打开时自动聚焦取消按钮

## 数据流

### 打开/关闭

菜单文本根据 `agent.panelState.isOpen` 动态变化：

- 已打开 → 显示"关闭"，点击后 `updatePanelState(id, { isOpen: false })`
- 已关闭 → 显示"打开"，点击后 `updatePanelState(id, { isOpen: true })`

如果关闭的是当前 active agent，额外调用 `setActiveAgent(null)`。

### 复制用户消息（子菜单）

1. 从 `useAgentStore(s => s.messages[agent.id])` 获取消息列表
2. 过滤 `role === 'user'` 的消息
3. 子菜单 hover 展开，显示每条用户消息的截断文本和时间戳
4. 点击某条消息后：`navigator.clipboard.writeText(msg.content)`，关闭菜单
5. 子菜单 hover 离开延迟 150ms 关闭，防止移动到子菜单时意外消失

### 删除

1. 关闭右键菜单
2. 打开 ConfirmDialog
3. 确认后调用 `destroyAgent(agent.id)`

## 视觉效果

- 菜单样式复用 slash-popup 设计语言：
  - 背景 `#252540`，边框 `rgba(255,255,255,0.1)`，圆角 10px
  - 菜单项 padding 6px 10px，hover 背景 `rgba(139,92,246,0.1)`，字号 13px
  - 删除项文字颜色 `#f87171`，hover 背景 `rgba(248,113,113,0.1)`
- 子菜单宽度 280px，显示标题行（"用户消息 (N)"）和消息列表
- 消息文本单行显示，CSS `text-overflow: ellipsis` 自然截断，title 属性显示完整内容
- 分隔线 `rgba(255,255,255,0.06)`

## 定位算法

1. 默认菜单左上角定位于鼠标坐标 (x, y)
2. 右侧超出视口 → 向左偏移（x - menuWidth）
3. 底部超出视口 → 向上偏移（y - menuHeight）
4. 子菜单在父菜单右侧；右侧超出则显示在左侧

## 边界情况

| 场景 | 处理 |
|------|------|
| 菜单打开时滚动侧边栏 | 关闭菜单 |
| 菜单打开时窗口失焦 | 关闭菜单 |
| 消息列表无用户消息 | "复制用户消息"禁用（灰色，不可点击） |
| clipboard API 不可用 | 静默失败，不报错 |
| 同一 agent 再次右键 | 关闭旧菜单，打开新菜单 |
| 菜单外左键点击 | 关闭菜单 |

## 测试计划

- **Sidebar**: 右键触发菜单、菜单项点击执行正确操作
- **AgentContextMenu**: 菜单定位、子菜单展开/关闭、Escape 关闭、视口边界检测
- **ConfirmDialog**: 确认/取消回调、遮罩点击、Enter/Escape 键盘操作
- **E2E**: 右键 → 展开子菜单 → 复制消息 → 验证剪贴板
