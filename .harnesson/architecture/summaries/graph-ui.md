# Module: Graph UI

> Source files: apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx, apps/web/src/components/graph/SpecsDocument.tsx, apps/web/src/components/graph/SpecsList.tsx, apps/web/src/components/graph/SyncView.tsx, apps/web/src/components/graph/SyncProgress.tsx, apps/web/src/components/graph/DetailPanel.tsx, apps/web/src/components/graph/ArchitectGraph.tsx, apps/web/src/components/graph/GraphTabBar.tsx, apps/web/src/components/graph/MarkdownViewer.tsx, apps/web/src/components/graph/TechnicalDocument.tsx
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Spec graph visualization module using ReactFlow. Provides interactive graph views for spec nodes (SpecsGraph), architect data (ArchitectGraph), document rendering (MarkdownViewer, TechnicalDocument, SpecsDocument), list views (SpecsList), and sync progress UI (SyncView, SyncProgress).

## Key Files

### SpecsGraph.tsx
ReactFlow-based spec graph visualization with custom node types and layout.

### FlowGraph.tsx
Base ReactFlow graph component with shared configuration.

### SyncView.tsx
Sync trigger and progress UI for initiating graph data synchronization.

### DetailPanel.tsx
Side panel showing details of a selected graph node.

## Exports

- SpecsGraph (component)
- FlowGraph (component)
- GraphNodes (component)
- SpecsDocument (component)
- SpecsList (component)
- SyncView (component)
- SyncProgress (component)
- DetailPanel (component)
- ArchitectGraph (component)
- GraphTabBar (component)
- MarkdownViewer (component)
- TechnicalDocument (component)

## Dependencies

- → graphStore (graph data state)
- → shared-types (graph data types)
