# Graph Visualization

## 架构概览
项目代码结构的可视化功能。后端通过外部 CLI 进程分析代码生成图谱数据，前端以多种视图展示。

## 前端设计

### 状态管理
- `graphStore` (Zustand): 图谱数据、同步状态、活跃标签页

### 组件
- `GraphPage`: 主页面，含标签导航和同步控制
- `SpecsGraph`: 规格图谱视图
- `SpecsList`: 规格列表视图
- `SpecsDocument`: 规格文档视图
- `ArchitectGraph`: 架构图视图
- `TechnicalDocument`: 技术文档视图

## 后端设计

### API 端点
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | /api/graph/status | 检查同步状态 |
| GET | /api/graph/data | 获取图谱数据 |
| POST | /api/graph/sync | 启动同步(SSE) |
| POST | /api/graph/sync/cancel | 取消同步 |
| GET | /api/graph/history | 历史快照 |

### 同步引擎
- spawn 外部 CLI 进程分析代码
- SSE 推送进度事件
- GraphStorage 管理文件存储
