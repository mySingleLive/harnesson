# Module: web-pages

> Source files: apps/web/src/pages/*.tsx
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

应用页面组件。每个页面对应一个路由，包括 AI 对话首页、项目管理、图谱浏览、任务管理、文件浏览、Git 操作和 404 页面。通过 React Router 在 MainLayout 的 Outlet 中渲染。

## Key Files

### apps/web/src/pages/NewSessionPage.tsx
AI 新会话页面（首页）。展示快速操作卡片、Agent 创建流程入口。

### apps/web/src/pages/ProjectsPage.tsx
项目管理页面。渲染 ProjectList 组件。

### apps/web/src/pages/GraphPage.tsx
图谱浏览页面。渲染 SpecsGraph、GraphTabBar、DetailPanel、SyncView 等图谱相关组件。

### apps/web/src/pages/TasksPage.tsx
任务管理页面。展示当前项目的待办任务。

### apps/web/src/pages/FilesPage.tsx
文件浏览页面。展示项目文件树。

### apps/web/src/pages/GitPage.tsx
Git 操作页面。展示分支信息和 Git 相关功能。

### apps/web/src/pages/NotFoundPage.tsx
404 错误页面。路由未匹配时的回退页面。

## Exports

- NewSessionPage (component) — 首页
- ProjectsPage (component) — 项目页
- GraphPage (component) — 图谱页
- TasksPage (component) — 任务页
- FilesPage (component) — 文件页
- GitPage (component) — Git 页
- NotFoundPage (component) — 404 页

## Dependencies

- → web-projects (ProjectList, ProjectCard, CreateProjectModal)
- → web-graph (SpecsGraph, SpecsList, GraphTabBar, DetailPanel, SyncView)
- → web-stores (projectStore, agentStore, graphStore)
- → web-lib (serverApi)
