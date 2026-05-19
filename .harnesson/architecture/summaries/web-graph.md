# Module: web-graph

> Source files: apps/web/src/components/graph/**/*.tsx
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

项目规格图谱可视化组件。提供多种视图展示项目架构和规格数据，包括图谱视图（SpecsGraph）、列表视图（SpecsList）、文档视图（SpecsDocument）、流程图（FlowGraph）等。支持同步进度展示和节点详情面板。

## Key Files

### apps/web/src/components/graph/SpecsGraph.tsx
规格树图谱可视化。使用 D3/React 力导向图展示节点和关系。

### apps/web/src/components/graph/SpecsList.tsx
规格列表视图。以树形列表展示所有规格节点。

### apps/web/src/components/graph/SpecsDocument.tsx
规格文档视图。展示选中节点的详细文档。

### apps/web/src/components/graph/FlowGraph.tsx
流程图视图。展示项目架构的流程图。

### apps/web/src/components/graph/ArchitectGraph.tsx
架构图视图。展示代码架构的组件和模块关系。

### apps/web/src/components/graph/GraphTabBar.tsx
图谱页签切换栏。切换 specs-graph、specs-list、specs-document、architect-graph、flow-graph 等视图。

### apps/web/src/components/graph/DetailPanel.tsx
节点详情面板。展示选中节点的属性、描述、验收标准等信息。

### apps/web/src/components/graph/SyncProgress.tsx
同步进度组件。显示同步的阶段、进度条和日志。

### apps/web/src/components/graph/SyncView.tsx
同步触发视图。提供同步按钮和自动同步检测。

### apps/web/src/components/graph/MarkdownViewer.tsx
Markdown 渲染组件。渲染设计文档内容。

### apps/web/src/components/graph/TechnicalDocument.tsx
技术文档视图。展示架构设计文档。

## Exports

- SpecsGraph (component) — 规格图谱
- SpecsList (component) — 规格列表
- SpecsDocument (component) — 规格文档
- FlowGraph (component) — 流程图
- ArchitectGraph (component) — 架构图
- GraphTabBar (component) — 页签栏
- DetailPanel (component) — 详情面板
- SyncProgress (component) — 同步进度
- SyncView (component) — 同步视图
- GraphNodes (component) — 图谱节点
- MarkdownViewer (component) — Markdown 渲染
- TechnicalDocument (component) — 技术文档

## Dependencies

- → shared-types (SpecsData, ArchitectData, Manifest, SpecNode, GraphTab 等类型)
- → web-stores (graphStore)
- → web-lib (serverApi)
