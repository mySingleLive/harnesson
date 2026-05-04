---
title: Agent 聊天消息气泡布局重构
date: 2026-05-04
status: approved
---

# Agent 聊天消息气泡布局重构

## 目标

移除聊天面板中的 "You" 和 "AGENT A" 等标签，改用背景色和布局差异来区分用户消息与 Agent 消息。

## 改动范围

仅修改 `apps/web/src/components/chat/MessageRenderer.tsx`，涉及两个子组件：

- `UserMessage`
- `AgentMessageBubble`

## 设计

### 用户消息

- 移除 "You" 标签
- 添加气泡容器：背景色 `#454560`，带 `border: 1px solid rgba(255,255,255,0.1)`
- 圆角：`border-radius: 12px 12px 12px 4px`（左下角小圆角）
- 最大宽度 `85%`，左对齐
- 外层 padding: `16px 20px`，用 flex 左对齐
- 内容样式不变：`text-[13px] leading-relaxed text-gray-300`

### Agent 消息

- 移除 `{agentName}` 标签行
- 保持平铺布局，无特殊背景色
- 外层 padding: `14px 20px`
- ThinkingIndicator 保留但移到内容区域顶部（不再与标签行绑定）
- 工具卡片、Markdown 内容、错误提示样式不变

### 分隔线

保留现有的 `border-b border-white/[0.04]` 分隔线。

## 不变的部分

- 消息数据流和 store 逻辑
- 工具卡片（ToolEventCard、BashCard、AgentCard 等）
- AgentPanel 整体布局
- 输入区域样式
