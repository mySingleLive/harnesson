# Specs Graph 多选与右键菜单设计

## 概述

为 Specs Graph 新增两个交互能力：

1. **鼠标框选节点**：左键拖拽空白区域绘制选择矩形，框内节点被选中
2. **节点右键菜单**：右键节点弹出菜单，支持选择/选择子节点/选择所有子节点

## 选择模式

混合模式：默认替换当前选择，按住 Shift 追加到当前选择。

## 选中与面板联动

| 选中节点数 | DetailPanel |
|-----------|-------------|
| 0 | 关闭 |
| 1 | 打开，显示该节点详情 |
| ≥2 | 关闭（仅高亮） |

---

## 一、Store 层改动 (`graphStore.ts`)

### 现状

```typescript
selectedNodeId: string | null;
isDetailPanelOpen: boolean;
selectNode: (nodeId: string) => void;
closeDetailPanel: () => void;
```

### 目标

```typescript
selectedNodeIds: string[];
isDetailPanelOpen: boolean;  // 保留，由 selectNodes/addToSelection/clearSelection 自动管理

selectNodes: (nodeIds: string[]) => void;
addToSelection: (nodeIds: string[]) => void;
clearSelection: () => void;
```

### 方法行为

- **selectNodes**：替换 `selectedNodeIds`，`isDetailPanelOpen = nodeIds.length === 1`
- **addToSelection**：去重合并 `selectedNodeIds`，`isDetailPanelOpen = merged.length === 1`
- **clearSelection**：`selectedNodeIds = []`，`isDetailPanelOpen = false`

---

## 二、FlowGraph 改动 (`FlowGraph.tsx`)

### ReactFlow props 新增

```tsx
<ReactFlow
  selectionMode="partial"           // 左键拖拽空白 = 框选
  panOnDrag={[1, 2]}                // 中键/右键拖拽 = 平移
  multiSelectionKeyCode="Shift"     // Shift = 追加模式
  onSelectionChange={handleSelectionChange}
  onNodeClick={handleNodeClick}
  onNodeContextMenu={handleNodeContextMenu}
  onPaneClick={handlePaneClick}
/>
```

### 内联回调（直接调 store，不再通过 props 传入）

- **handleSelectionChange**：从 `{ nodes }` 提取 ids 调用 `selectNodes`
- **handleNodeClick**：取 `event.shiftKey`，调 `selectNodes` 或 `addToSelection`
- **handleNodeContextMenu**：`event.preventDefault()`，设置右键菜单位置 state
- **handlePaneClick**：调用 `clearSelection()`

### FlowGraph 接口简化

```typescript
interface FlowGraphProps {
  graphData: GraphData;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void;  // 可选，供外部扩展
}
```

移除 `onNodeClick` prop（内化到组件内部）。

---

## 三、GraphContextMenu 组件（新增）

沿袭 `AgentContextMenu` 的 portal 模式。

### Props

```typescript
interface GraphContextMenuProps {
  nodeId: string;
  x: number;
  y: number;
  onClose: () => void;
}
```

### 菜单项

| 菜单项 | 显示条件 | 行为 |
|--------|---------|------|
| 选择 | 始终显示 | 如果 Shift 按住则 `addToSelection`，否则 `selectNodes` |
| 选择下一层子节点 | `specsNodeMap[nodeId].children.length > 0` | `selectNodes(children)` |
| 选择所有子节点 | `specsNodeMap[nodeId].children.length > 0` | `selectNodes(allDescendants)` |

### 子节点获取

通过 `specsNodeMap` 获取：
- **下一层子节点**：`node.children` 直接取
- **所有子节点**：递归遍历 `children` 收集所有后代

### 通用模式（沿用 AgentContextMenu）

- `createPortal` 到 `document.body`
- `z-index: 100`，`position: fixed`
- 超出 viewport 边界时翻转坐标（右边界翻左，下边界翻上）
- `setTimeout(0)` 延迟绑定 `mousedown` 监听，避免捕获触发的右键事件
- `ESC` 键关闭
- `window.blur` 关闭
- 样式与 `AgentContextMenu` 一致：`bg-[#252540]`，`border-white/10`，圆角 10px

---

## 四、DetailPanel 改动

入口判断从 `selectedNodeId` 改为 `selectedNodeIds[0]`（取第一个也是唯一一个节点）。

```typescript
const nodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
```

其余逻辑不变（单节点详情展示完全保持）。

---

## 五、SpecsGraph / ArchitectGraph 简化

- 移除 `handleNodeClick` 回调（FlowGraph 内部处理）
- Props 传递从 `onNodeClick={handleNodeClick}` 简化为无此 prop

---

## 六、完整交互表

| 操作 | 行为 | 面板 |
|------|------|------|
| 单击节点 | `selectNodes([id])` | 打开单节点详情 |
| Shift+单击节点 | `addToSelection([id])` | 总数=1 开，否则关 |
| 右键 → 选择 | `selectNodes([id])` 或 `addToSelection([id])`（按 Shift） | 同上 |
| 右键 → 选择下一层子节点 | `selectNodes(children)` | 总数=1 开，否则关 |
| 右键 → 选择所有子节点 | `selectNodes(allDescendants)` | 总数=1 开，否则关 |
| 左键拖拽空白 | 框选 → `selectNodes(ids)` | 总数=1 开，否则关 |
| Shift+左键拖拽空白 | 框选 → `addToSelection(ids)` | 总数=1 开，否则关 |
| 点击空白 | `clearSelection()` | 关闭 |
| 左键拖拽节点 | 移动节点 | 不变 |

---

## 七、涉及文件

| 文件 | 改动 | 约 |
|------|------|-----|
| `graphStore.ts` | 修改：替换单选为多选 | 20 行 |
| `FlowGraph.tsx` | 修改：新增 props + 内联回调 | 30 行 |
| `GraphContextMenu.tsx` | **新增** | 140 行 |
| `SpecsGraph.tsx` | 修改：移除 handleNodeClick | 5 行 |
| `ArchitectGraph.tsx` | 修改：移除 handleNodeClick | 5 行 |
| `DetailPanel.tsx` | 修改：适配 selectedNodeIds[0] | 5 行 |

总改动约 205 行，1 个新增文件，5 个修改文件。GraphNodes.tsx 无需改动（已有 `selected` prop 响应多选高亮）。

## 八、测试要点

- 单击节点 → 选中高亮 + 面板打开
- Shift+单击 → 多选高亮 + 面板关闭
- 框选多节点 → 全部高亮 + 面板关闭
- 框选单节点 → 高亮 + 面板打开
- 右键菜单出现/消失、ESC 关闭、外部点击关闭
- 右键 → 选择下一层子节点 / 所有子节点（有子节点时显示，无子节点时隐藏）
- 点击空白清除选择 + 关闭面板
- 中键/右键拖拽平移正常
- 框选 + Shift 追加模式
- ArchitectGraph 同样获得上述能力
