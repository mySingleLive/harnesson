# Project Management

## 架构概览
项目管理的全栈功能，前端使用 Zustand store 和 React 组件，后端使用 Express 路由和 Prisma ORM。

## 前端设计

### 状态管理
- `projectStore` (Zustand): 项目列表、活跃项目、分支信息

### 页面和组件
- `ProjectsPage`: 项目列表页面（卡片/列表视图）
- `CreateProjectModal`: 创建项目对话框
- `CloneRepoModal`: 克隆仓库对话框
- `ProjectDetailModal`: 项目详情和删除

## 后端设计

### API 端点
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | /api/projects | 获取项目列表 |
| GET | /api/projects/:id | 获取项目详情 |
| POST | /api/projects | 创建项目 |
| DELETE | /api/projects/:id | 删除项目 |
| GET | /api/projects/:id/branches | 获取分支列表 |
| POST | /api/projects/:id/checkout | 切换分支 |
| POST | /api/open-folder | 打开文件夹对话框 |

### 数据库模型
- **Project**: id, name, path, description, source, agentCount, timestamps
