# Branch Management

## 前端设计
- RichTextInput 中的分支选择器下拉框
- 展示本地和远程分支
- 当前分支高亮

## 后端设计
- GET /api/projects/:id/branches: 列出本地和远程分支
- POST /api/projects/:id/checkout: 切换分支
- 远程分支自动创建本地跟踪分支
