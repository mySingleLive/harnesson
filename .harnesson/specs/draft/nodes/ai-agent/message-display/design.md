# Message Display

## 前端设计

### 组件结构
- `MessageRenderer`: 主渲染入口
  - `UserMessage`: 用户消息气泡（右对齐），含图片网格
  - `AgentMessageBubble`: Agent 消息气泡（左对齐），含工具卡片

### 消息类型
- 文本消息: GFM Markdown 渲染，含代码块语法高亮
- 流式消息: SSE 增量渲染
- 工具卡片: Bash, Edit, Read, Write, Grep, Glob, LSP, Question, Todo
- 图片消息: 网格展示，支持点击预览
