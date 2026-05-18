# Model Switch

## 前端设计
- RichTextInput 和 AgentPanel 中的模型选择下拉框
- 从 GET /api/models 获取模型列表

## 后端设计
- GET /api/models
- 通过 Claude Code Adapter 动态获取支持的模型
- 结果缓存以提升性能
