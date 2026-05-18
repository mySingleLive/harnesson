# Graph Sync

## 前端设计
- GraphPage 同步按钮和进度展示
- SSE 接收进度事件
- 进度条和日志输出
- 取消按钮

## 后端设计
- POST /api/graph/sync: spawn CLI 进程，SSE 推送进度
- POST /api/graph/sync/cancel: 终止活跃进程
- SyncEngine: 进程管理和事件解析
- GraphStorage: 结果存储和历史快照管理
