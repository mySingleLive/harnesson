# Module: web-projects

> Source files: apps/web/src/components/projects/**/*.tsx
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

项目管理界面组件。提供项目列表（卡片/列表视图）、创建项目弹窗（支持本地创建、Git 克隆）、项目详情弹窗、操作卡片等功能。支持本地导入和 Git 仓库克隆两种项目创建方式。

## Key Files

### apps/web/src/components/projects/ProjectList.tsx
项目列表容器组件。管理视图模式切换（卡片/列表）、搜索过滤、空状态展示。

### apps/web/src/components/projects/ProjectCard.tsx
项目卡片组件。以卡片形式展示项目名称、路径、来源等信息。

### apps/web/src/components/projects/ProjectRow.tsx
项目列表行组件。以表格行形式展示项目信息。

### apps/web/src/components/projects/CreateProjectModal.tsx
创建项目弹窗。提供多步骤表单：选择创建方式（本地/克隆）、输入名称路径、配置 Git 初始化。

### apps/web/src/components/projects/CloneRepoModal.tsx
Git 克隆弹窗。输入仓库 URL 和本地路径进行克隆。

### apps/web/src/components/projects/ProjectDetailModal.tsx
项目详情弹窗。展示项目完整信息和操作选项。

### apps/web/src/components/projects/ActionCard.tsx
操作卡片组件。用于首页快速操作入口。

### apps/web/src/components/projects/EmptyState.tsx
空状态展示组件。无项目时的引导页面。

## Exports

- ProjectList (component) — 项目列表
- ProjectCard (component) — 项目卡片
- ProjectRow (component) — 项目行
- CreateProjectModal (component) — 创建项目弹窗
- CloneRepoModal (component) — 克隆仓库弹窗
- ProjectDetailModal (component) — 项目详情弹窗
- ActionCard (component) — 操作卡片
- EmptyState (component) — 空状态

## Dependencies

- → shared-types (Project 类型)
- → web-stores (projectStore)
- → web-lib (serverApi)
- → web-hooks (useProjectActions)
