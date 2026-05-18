# Repository Cloning

## 前端设计
- CloneRepoModal 对话框
- 表单: 仓库 URL, 本地路径
- 前端执行 git clone，然后通过 POST /api/projects 注册

## 后端设计
- 通过 POST /api/projects 注册克隆后的目录
- source 字段标记为 clone
