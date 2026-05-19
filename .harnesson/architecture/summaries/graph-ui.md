# Module: graph-ui

> Source files: apps/web/src/components/graph/**/*.tsx
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Graph visualization components for displaying specs and architecture knowledge graphs. Uses React Flow with Dagre layout for interactive node-edge diagrams, plus tabbed views for graph, list, document, and sync workflows.

## Key Files

### FlowGraph.tsx
Core React Flow graph rendering component with Dagre top-to-bottom layout and custom node types.

### GraphNodes.tsx
Custom React Flow node components for three hierarchy levels: ProjectNode, DomainNode, FeatureNode.

### SpecsGraph.tsx
Renders the specs knowledge graph by reading specsData from the graph store and delegating to FlowGraph.

### ArchitectGraph.tsx
Renders the architecture knowledge graph by reading architectData from the graph store.

### SpecsList.tsx
Collapsible tree-list view of spec items, organized hierarchically from flat SpecsListItem data.

### SpecsDocument.tsx / TechnicalDocument.tsx
Markdown document viewers for specs and architecture documents using MarkdownViewer.

### SyncView.tsx
Landing view for initiating sync with storage location selection.

### SyncProgress.tsx
Progress UI with animated spinner, progress bar, phase timeline, log output, and cancel button.

### DetailPanel.tsx
Side panel showing selected graph node details (id, level, children, content).

### GraphTabBar.tsx
Tab navigation for five views: Specs Graph, Specs List, Specs Document, Architect Graph, Technical Document.

## Exports

- FlowGraph, SpecsGraph, ArchitectGraph (components)
- SpecsList, SpecsDocument, TechnicalDocument (components)
- SyncView, SyncProgress (components)
- DetailPanel, GraphTabBar (components)
- MarkdownViewer (component)
- ProjectNode, DomainNode, FeatureNode, nodeTypes (components/map)

## Dependencies

- → @xyflow/react (React Flow library)
- → @dagrejs/dagre (graph layout)
- → stores (graphStore)
- → @harnesson/shared (GraphData, SpecsListItem, GraphTab, GraphNode types)
- → web-lib (utils)
