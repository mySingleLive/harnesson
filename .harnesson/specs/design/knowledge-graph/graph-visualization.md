# 图谱可视化 — 前端设计

图谱可视化以交互式 DAG 图展示项目结构，使用 React Flow + Dagre 布局引擎。同时提供树形列表作为替代浏览方式，以及可滑出的节点详情面板。

## 布局

```mermaid
graph TD
    GraphPage --> GraphTabBar
    GraphTabBar --> |specs-graph| SpecsGraph
    GraphTabBar --> |specs-list| SpecsList
    GraphTabBar --> |architect-graph| ArchitectGraph
    GraphTabBar --> |specs-document| SpecsDocument
    GraphTabBar --> |technical-document| TechnicalDocument
    SpecsGraph --> FlowGraph
    ArchitectGraph --> FlowGraph
    FlowGraph --> ReactFlow[React Flow @xyflow/react]
    FlowGraph --> Dagre[@dagrejs/dagre 布局]
    ReactFlow --> GraphNodes
    GraphNodes --> ProjectNode[ProjectNode 紫色]
    GraphNodes --> DomainNode[DomainNode 蓝色]
    GraphNodes --> FeatureNode[FeatureNode 绿色]
    FlowGraph --> |onNodeClick| DetailPanel
```

## 组件树

- **FlowGraph**：核心图渲染组件。接收 `graphData` 和 `onNodeClick` 回调，内部使用 Dagre 计算 TB（自上而下）布局（nodesep=50, ranksep=60），将 GraphNode 映射为 React Flow 节点。每种节点类型指定不同高度（project: 48px, domain: 40px, feature: 36px），统一宽度 200px。启用了 `fitView`（padding=0.2）、缩放范围 0.3x-1.5x、Background 网格和 Controls 控制面板。
- **GraphNodes**：定义三种自定义节点组件（project / domain / feature）。ProjectNode 使用紫色边框和背景（harness-accent），DomainNode 使用蓝色，FeatureNode 使用绿色。每个节点包含顶部 target Handle 和底部 source Handle 以支持边连接。
- **SpecsGraph / ArchitectGraph**：分别读取 `specs.graph` 和 `architect.graph` 数据并传递给 FlowGraph。
- **SpecsList**：树形嵌套列表视图，以可展开/折叠的层次结构展示节点树。
- **DetailPanel**：从右侧滑入的详情面板（宽度 320px），显示选中节点的类型、ID、层级和内容。
- **GraphTabBar**：标签页切换组件，5 个标签页（specs-graph / specs-list / specs-document / architect-graph / technical-document），切换不重新加载数据。

## 状态管理

graphStore 管理 `graphFullData`（包含 manifest、specs、architect）和 `selectedNodeId`。所有视图组件共享同一份数据，通过标签页 key 切换显示内容。

## Specification Details

### Parameters

- Dagre 布局方向：TB（自上而下），节点间距 ranksep=120，同层间距 nodesep=80
- 三种节点颜色：ProjectNode 紫色(#8b5cf6)、DomainNode 蓝色(#3b82f6)、FeatureNode 绿色(#22c55e)
- 缩放范围：0.1x 到 2x，默认适应视图
- 详情面板宽度 320px，从右侧滑入动画
- 标签页切换无数据重新加载（同一 GraphFullData 在多个视图间共享）

## Constraints

- 图谱仅在同步完成后才显示（SyncView 占位直到数据就绪）
- 图谱节点数量超过 500 时可能影响布局性能
- 树形列表的展开/折叠状态不持久化（页面刷新后重置）
- 架构图谱使用与规格图谱相同的渲染引擎但数据源不同
- 详情面板同时只能显示一个节点的信息
