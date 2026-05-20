# Specs Graph 多选与右键菜单 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Specs Graph 新增框选节点和右键菜单功能，支持混合选择模式（默认替换，Shift 追加）

**Architecture:** 扩展现有 React Flow v12 配置启用内置框选，新增 GraphContextMenu portal 组件处理右键菜单，Zustand store 从单选改为多选

**Tech Stack:** React, @xyflow/react v12, Zustand, Tailwind CSS, TypeScript

---

### Task 1: 扩展 graphStore 支持多选

**Files:**
- Modify: `apps/web/src/stores/graphStore.ts`

- [ ] **Step 1: 修改 GraphState 接口**

将 `selectedNodeId` 和 `selectNode` / `closeDetailPanel` 替换为多选版本。找到接口定义（约 line 55-64），将：

```typescript
selectedNodeId: string | null;
isDetailPanelOpen: boolean;
```

改为：

```typescript
selectedNodeIds: string[];
isDetailPanelOpen: boolean;
```

将：

```typescript
selectNode: (nodeId: string) => void;
closeDetailPanel: () => void;
```

改为：

```typescript
selectNodes: (nodeIds: string[]) => void;
addToSelection: (nodeIds: string[]) => void;
clearSelection: () => void;
```

- [ ] **Step 2: 修改初始 state**

找到初始 state 对象（约 line 83-84），将：

```typescript
selectedNodeId: null,
isDetailPanelOpen: false,
```

改为：

```typescript
selectedNodeIds: [],
isDetailPanelOpen: false,
```

- [ ] **Step 3: 替换 selectNode / closeDetailPanel 实现**

找到 `selectNode` 和 `closeDetailPanel` 的实现（约 line 205-207），将：

```typescript
selectNode: (nodeId) => set({ selectedNodeId: nodeId, isDetailPanelOpen: true }),

closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedNodeId: null }),
```

替换为：

```typescript
selectNodes: (nodeIds) => set({ selectedNodeIds: nodeIds, isDetailPanelOpen: nodeIds.length === 1 }),

addToSelection: (nodeIds) => {
  const current = get().selectedNodeIds;
  const merged = [...new Set([...current, ...nodeIds])];
  set({ selectedNodeIds: merged, isDetailPanelOpen: merged.length === 1 });
},

clearSelection: () => set({ selectedNodeIds: [], isDetailPanelOpen: false }),
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：只有使用旧 API 的文件报错（SpecsGraph、ArchitectGraph、DetailPanel 中的 `selectedNodeId` / `selectNode` / `closeDetailPanel`），后续任务将修复。

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/graphStore.ts
git commit -m "refactor(graphStore): replace single-select with multi-select support"
```

---

### Task 2: 创建 GraphContextMenu 右键菜单组件

**Files:**
- Create: `apps/web/src/components/graph/GraphContextMenu.tsx`

- [ ] **Step 1: 创建 GraphContextMenu 组件文件**

```typescript
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGraphStore } from '@/stores/graphStore';

interface GraphContextMenuProps {
  nodeId: string;
  x: number;
  y: number;
  onClose: () => void;
}

function getAllDescendantIds(
  nodeId: string,
  nodeMap: Record<string, { children: string[] }>,
): string[] {
  const node = nodeMap[nodeId];
  if (!node) return [];
  const children = node.children;
  return [...children, ...children.flatMap((id) => getAllDescendantIds(id, nodeMap))];
}

export function GraphContextMenu({ nodeId, x, y, onClose }: GraphContextMenuProps) {
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const selectNodes = useGraphStore((s) => s.selectNodes);
  const addToSelection = useGraphStore((s) => s.addToSelection);

  const [position, setPosition] = useState({ x, y });
  const menuRef = useRef<HTMLDivElement>(null);
  const listenerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const node = specsNodeMap?.[nodeId];
  const hasChildren = (node?.children?.length ?? 0) > 0;

  // Adjust position to stay within viewport
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const adjusted = { x, y };
    if (rect.right > window.innerWidth) adjusted.x = x - rect.width;
    if (rect.bottom > window.innerHeight) adjusted.y = y - rect.height;
    setPosition(adjusted);
  }, [x, y]);

  // Close on outside click, Escape, or window blur
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleBlur = () => onClose();
    // Delay to avoid capturing the triggering right-click
    listenerTimerRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
    }, 0);
    return () => {
      if (listenerTimerRef.current) clearTimeout(listenerTimerRef.current);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onClose]);

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (event.shiftKey) {
        addToSelection([nodeId]);
      } else {
        selectNodes([nodeId]);
      }
      onClose();
    },
    [nodeId, addToSelection, selectNodes, onClose],
  );

  const handleSelectDirectChildren = useCallback(() => {
    if (!node) return;
    selectNodes(node.children);
    onClose();
  }, [node, selectNodes, onClose]);

  const handleSelectAllChildren = useCallback(() => {
    if (!specsNodeMap) return;
    const allDescendants = getAllDescendantIds(nodeId, specsNodeMap);
    selectNodes(allDescendants);
    onClose();
  }, [nodeId, specsNodeMap, selectNodes, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#252540] border border-white/10 rounded-[10px] py-1 min-w-[180px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        onClick={handleSelect}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
      >
        选择
      </button>

      {hasChildren && (
        <>
          <div className="h-px bg-white/[0.06] mx-2 my-1" />
          <button
            onClick={handleSelectDirectChildren}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
          >
            选择下一层子节点
          </button>
          <button
            onClick={handleSelectAllChildren}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
          >
            选择所有子节点
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：只有调用方（SpecsGraph、ArchitectGraph、DetailPanel）使用旧 API 的报错。GraphContextMenu.tsx 无报错。

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/GraphContextMenu.tsx
git commit -m "feat(GraphContextMenu): add right-click context menu for graph nodes"
```

---

### Task 3: 更新 FlowGraph 启用框选和集成右键菜单

**Files:**
- Modify: `apps/web/src/components/graph/FlowGraph.tsx`

- [ ] **Step 1: 更新 imports**

在文件顶部（约 line 1-2），将：

```typescript
import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, type Node, type Edge, type NodeChange, type OnNodeClick } from '@xyflow/react';
```

改为：

```typescript
import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, type Node, type Edge, type NodeChange } from '@xyflow/react';
```

新增 store 和 GraphContextMenu 的 import：

```typescript
import { useGraphStore } from '@/stores/graphStore';
import { GraphContextMenu } from './GraphContextMenu';
```

- [ ] **Step 2: 简化 FlowGraphProps 接口**

找到 `FlowGraphProps` 接口（约 line 50-53），将：

```typescript
interface FlowGraphProps {
  graphData: GraphData;
  onNodeClick?: OnNodeClick;
}
```

改为：

```typescript
interface FlowGraphProps {
  graphData: GraphData;
}
```

- [ ] **Step 3: 更新 FlowGraph 函数签名和内部逻辑**

将函数签名（约 line 55）从：

```typescript
export function FlowGraph({ graphData, onNodeClick }: FlowGraphProps) {
```

改为：

```typescript
export function FlowGraph({ graphData }: FlowGraphProps) {
```

在 `const [nodes, setNodes] = useState<Node[]>(layouted.nodes);` 之后，新增 context menu state 和 store hooks：

```typescript
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const selectNodes = useGraphStore((s) => s.selectNodes);
  const addToSelection = useGraphStore((s) => s.addToSelection);
  const clearSelection = useGraphStore((s) => s.clearSelection);
```

- [ ] **Step 4: 新增交互回调**

在 `onNodesChange` 回调之后（约 line 66，`const defaultEdgeOptions = ...` 之前），新增：

```typescript
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      selectNodes(selectedNodes.map((n) => n.id));
    },
    [selectNodes],
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.shiftKey) {
        addToSelection([node.id]);
      } else {
        selectNodes([node.id]);
      }
    },
    [addToSelection, selectNodes],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);
```

- [ ] **Step 5: 更新 ReactFlow JSX**

将 return 的 JSX 块替换为：

```tsx
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodesChange={onNodesChange}
        onSelectionChange={onSelectionChange}
        onPaneClick={handlePaneClick}
        selectionMode="partial"
        panOnDrag={[1, 2]}
        multiSelectionKeyCode="Shift"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls
          className="!border-harness-border !bg-harness-sidebar [&>button]:!bg-harness-sidebar [&>button]:!border-harness-border [&>button]:!text-gray-400 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>
      {contextMenu && (
        <GraphContextMenu
          nodeId={contextMenu.nodeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
```

- [ ] **Step 6: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：只有 SpecsGraph、ArchitectGraph、DetailPanel 使用旧 API 的报错。FlowGraph.tsx 因移除了 `onNodeClick` prop，调用方（SpecsGraph、ArchitectGraph）会有类型错误，将在后续任务修复。

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/graph/FlowGraph.tsx
git commit -m "feat(FlowGraph): add box selection, inline click handlers, and context menu integration"
```

---

### Task 4: 简化 SpecsGraph

**Files:**
- Modify: `apps/web/src/components/graph/SpecsGraph.tsx`

- [ ] **Step 1: 移除 handleNodeClick 和 selectNode**

将整个文件内容替换为：

```typescript
import { useMemo } from 'react';
import { FlowGraph } from './FlowGraph';
import { buildGraphFromTree } from './buildGraphFromTree';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphData } from '@harnesson/shared';

export function SpecsGraph() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);

  const graphData: GraphData | null = useMemo(() => {
    if (!specsTree || !specsNodeMap) return null;
    return buildGraphFromTree(specsTree, specsNodeMap);
  }, [specsTree, specsNodeMap]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs tree data available. Run sync-specs to generate.</p>
      </div>
    );
  }

  return <FlowGraph graphData={graphData} />;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：只剩 ArchitectGraph 和 DetailPanel 的报错。

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/SpecsGraph.tsx
git commit -m "refactor(SpecsGraph): remove handleNodeClick, now handled by FlowGraph internally"
```

---

### Task 5: 简化 ArchitectGraph

**Files:**
- Modify: `apps/web/src/components/graph/ArchitectGraph.tsx`

- [ ] **Step 1: 移除 handleNodeClick 和 selectNode**

将整个文件内容替换为：

```typescript
import { FlowGraph } from './FlowGraph';
import { useGraphStore } from '@/stores/graphStore';

export function ArchitectGraph() {
  const architectData = useGraphStore((s) => s.architectData);

  if (!architectData?.graph || architectData.graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No architect graph data available</p>
      </div>
    );
  }

  return <FlowGraph graphData={architectData.graph} />;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：只剩 DetailPanel 的报错。

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/ArchitectGraph.tsx
git commit -m "refactor(ArchitectGraph): remove handleNodeClick, now handled by FlowGraph internally"
```

---

### Task 6: 适配 DetailPanel 到多选

**Files:**
- Modify: `apps/web/src/components/graph/DetailPanel.tsx`

- [ ] **Step 1: 替换 selectedNodeId 为 selectedNodeIds[0]**

找到 DetailPanel 组件函数体（约 line 27-35），将：

```typescript
export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const closeDetailPanel = useGraphStore((s) => s.closeDetailPanel);
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!selectedNodeId) return null;
```

改为：

```typescript
export function DetailPanel() {
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  const selectNodes = useGraphStore((s) => s.selectNodes);

  const selectedNodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;

  if (!selectedNodeId) return null;
```

- [ ] **Step 2: 替换 closeDetailPanel 调用**

将 X 关闭按钮的 `onClick`（约 line 61）从：

```tsx
onClick={closeDetailPanel}
```

改为：

```tsx
onClick={clearSelection}
```

- [ ] **Step 3: 替换 Children 中的 selectNode 调用**

将 Children 列表中的 `selectNode(childId)`（约 line 135）从：

```tsx
onClick={() => selectNode(childId)}
```

改为：

```tsx
onClick={() => selectNodes([childId])}
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

预期：零错误，全部类型检查通过。

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/graph/DetailPanel.tsx
git commit -m "refactor(DetailPanel): adapt to multi-select store API"
```

---

### Task 7: 构建验证

**Files:** None (验证 only)

- [ ] **Step 1: TypeScript 全量检查**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1
```

预期：零错误，零警告。

- [ ] **Step 2: 构建 web 应用**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx vite build 2>&1 | tail -10
```

预期：构建成功，无报错。

- [ ] **Step 3: Commit (if any lint fixes)**

如果有 lint 修复，提交。否则跳过。

---

### Task 8: E2E 浏览器验证

**Files:**
- Create: `docs/e2e-testing/2026-05-20-specs-graph-selection.md`

- [ ] **Step 1: 编写 E2E 测试计划**

创建测试计划文件：

```markdown
# Specs Graph 多选与右键菜单 E2E 测试

## 测试目标

1. **框选多节点**：在 Specs Graph 空白区域左键拖拽，验证多个节点高亮
2. **框选单节点**：框选仅覆盖一个节点，验证 DetailPanel 打开
3. **Shift 追加框选**：先选中一个节点，Shift+框选追加节点
4. **单击节点**：单击节点，验证高亮 + DetailPanel 打开
5. **Shift+单击追加**：Shift+单击节点，验证多选高亮
6. **点击空白取消选择**：点击画布空白区域，验证所有选中取消 + 面板关闭
7. **右键菜单-选择**：右键节点，点击"选择"，验证选中 + 面板打开
8. **右键菜单-选择下一层子节点**：右键有子节点的节点，点击"选择下一层子节点"，验证直接子节点被选中
9. **右键菜单-选择所有子节点**：右键有子节点的节点，点击"选择所有子节点"，验证所有后代节点被选中
10. **右键菜单-无子节点**：右键无子节点的节点，验证"选择下一层子节点"和"选择所有子节点"不显示
11. **右键菜单关闭**：ESC 键、外部点击、window blur 均能关闭右键菜单
12. **中键/右键拖拽平移**：中键或右键拖拽画布，验证平移正常
13. **ArchitectGraph 也支持框选**：切换到 Architect Graph 标签，验证框选功能同样生效
```

- [ ] **Step 2: 启动开发服务器**

```bash
cd /Users/dt_flys/Projects/harnesson && npm run dev 2>&1 &
```

等待服务启动后打开浏览器进行手动验证。

- [ ] **Step 3: Commit**

```bash
git add docs/e2e-testing/2026-05-20-specs-graph-selection.md
git commit -m "docs(e2e): add selection and context menu test plan"
```
