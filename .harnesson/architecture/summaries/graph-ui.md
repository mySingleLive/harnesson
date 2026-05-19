# Module: graph-ui

## Summary
Graph and specification visualization UI. Provides multiple views for project specs: interactive graph visualization using React Flow, list view, document view, architect graph, and technical document view. Includes sync progress display and detail panel for node inspection.

## Key Files
- `apps/web/src/pages/GraphPage.tsx` — Graph page with tab bar, sync view, and detail panel
- `apps/web/src/stores/graphStore.ts` — Zustand store: graph data loading, SSE sync, node selection
- `apps/web/src/components/graph/GraphTabBar.tsx` — Tab bar for switching graph views
- `apps/web/src/components/graph/SpecsGraph.tsx` — Specs graph visualization
- `apps/web/src/components/graph/SpecsList.tsx` — Specs list view
- `apps/web/src/components/graph/SpecsDocument.tsx` — Specs document view
- `apps/web/src/components/graph/ArchitectGraph.tsx` — Architect graph visualization
- `apps/web/src/components/graph/TechnicalDocument.tsx` — Technical document view
- `apps/web/src/components/graph/DetailPanel.tsx` — Node detail side panel
- `apps/web/src/components/graph/SyncView.tsx` — Sync trigger view
- `apps/web/src/components/graph/SyncProgress.tsx` — Sync progress indicator
- `apps/web/src/components/graph/FlowGraph.tsx` — React Flow graph component
- `apps/web/src/components/graph/GraphNodes.tsx` — Custom graph node types
- `apps/web/src/components/graph/MarkdownViewer.tsx` — Markdown viewer for graph content

## Exports
- `GraphPage` — Graph page component
- `useGraphStore` — Zustand store for graph state
- All graph sub-components

## Dependencies
- `@xyflow/react` — React Flow graph library
- `@dagrejs/dagre` — Graph layout algorithm
- `react-markdown` — Markdown rendering
- `@harnesson/shared` — Graph types
- `zustand` — State management

## Source files
- apps/web/src/pages/GraphPage.tsx
- apps/web/src/stores/graphStore.ts
- apps/web/src/components/graph/GraphTabBar.tsx
- apps/web/src/components/graph/SpecsGraph.tsx
- apps/web/src/components/graph/SpecsList.tsx
- apps/web/src/components/graph/SpecsDocument.tsx
- apps/web/src/components/graph/ArchitectGraph.tsx
- apps/web/src/components/graph/TechnicalDocument.tsx
- apps/web/src/components/graph/DetailPanel.tsx
- apps/web/src/components/graph/SyncView.tsx
- apps/web/src/components/graph/SyncProgress.tsx
- apps/web/src/components/graph/FlowGraph.tsx
- apps/web/src/components/graph/GraphNodes.tsx
- apps/web/src/components/graph/MarkdownViewer.tsx
