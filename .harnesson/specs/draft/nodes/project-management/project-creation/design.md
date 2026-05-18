# Project Creation

## 前端设计
- CreateProjectModal 对话框
- 表单字段: name, path, description, gitInit
- 路径冲突时显示错误

## 后端设计
- POST /api/projects: 创建项目
- 路径唯一约束: 冲突时返回已有项目
- 可选 git init 初始化
