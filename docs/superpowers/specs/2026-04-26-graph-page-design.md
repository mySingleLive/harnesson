# Graph Page Design

## Overview

Graph 页面是项目的知识图谱中心，以多种视角（脑图、列表、文档）展示项目的规格定义和技术架构。数据来源于 AI Agent 扫描项目源代码生成，支持全量同步和基于 git commit 的自动增量刷新。

## Tabs

页面包含 5 个 Tab：

| Tab | 类型 | 说明 |
|-----|------|------|
| **Specs Graph** | React Flow 树形图 | 项目全局规格的树形脑图，节点可点击在右侧面板查看详情 |
| **Specs List** | 分层列表 | 项目(根) → 业务域 → 功能节点的列表视图，点击查看详情 |
| **Specs Document** | Markdown 渲染 | 以文档形式呈现全局规格 |
| **Architect Graph** | React Flow 树形图 | 技术架构视角的树形图，展示项目技术设计方案 |
| **Technical Document** | Markdown 渲染 | 技术文档 |

## Data Storage

数据存放在用户选择的位置：

- 项目目录：`{projectPath}/.harnesson/`
- 用户目录：`~/.harnesson/{projectName}/`

### 目录结构

```
.harnesson/
├── manifest.json                  # 同步元数据
├── specs/
│   ├── graph.json                 # Specs Graph 节点+边数据
│   ├── graph-summary.md           # Specs Graph 摘要
│   ├── list.json                  # Specs List 扁平化列表数据
│   └── document.md                # Specs Document 全文
├── specs-history/
│   └── 2026-04-26T10-00-00/       # 按同步时间戳归档
│       ├── graph.json
│       ├── list.json
│       └── document.md
├── architect/
│   ├── graph.json                 # Architect Graph 节点+边数据
│   ├── graph-summary.md           # Architect Graph 摘要
│   └── document.md                # Technical Document 全文
├── architect-history/
│   └── 2026-04-26T10-00-00/
│       ├── graph.json
│       └── document.md
└── sync-log.json                  # 同步历史日志（时间戳、类型、耗时、状态）
```

### manifest.json

```json
{
  "projectName": "harnesson",
  "projectPath": "/Users/x/Projects/harnesson",
  "storageLocation": "project",
  "lastSyncCommit": "abc1234",
  "lastSyncTime": "2026-04-26T10:00:00Z",
  "syncStatus": "completed",
  "version": 1
}
```

### graph.json 节点结构

```json
{
  "nodes": [
    { "id": "root", "type": "project", "level": 0, "title": "项目名", "children": ["domain-1"] },
    { "id": "domain-1", "type": "domain", "level": 1, "title": "用户域", "content": "...", "children": ["feature-1"] },
    { "id": "feature-1", "type": "feature", "level": 2, "title": "用户注册", "content": "..." }
  ],
  "edges": [
    { "source": "root", "target": "domain-1" },
    { "source": "domain-1", "target": "feature-1" }
  ]
}
```

## Page Layout

复用现有 `MainLayout`，Graph 页面占据主内容区：

```
┌──────────────────────────────────────────────────┐
│ Topbar (项目名 + ProjectDropdown)                 │
├────────┬─────────────────────────────────────────┤
│        │  Tab Bar: Specs Graph | Specs List | ... │
│ Sidebar│─────────────────────────────────────────│
│        │                                 │ Detail │
│        │     Main Content Area          │ Panel  │
│        │   (React Flow / List / MD)     │(slide) │
│        │                                 │        │
├────────┴─────────────────────────────────────────┤
```

### Components

| 组件 | 职责 |
|------|------|
| `GraphPage` | 页面容器，管理 Tab 切换和数据加载 |
| `GraphTabBar` | 5 个 Tab 的切换栏 |
| `SpecsGraph` | React Flow 树形图 + 节点点击交互 |
| `SpecsList` | 分层列表（项目→域→功能） |
| `SpecsDocument` | Markdown 渲染 |
| `ArchitectGraph` | React Flow 架构树形图 + 节点点击交互 |
| `TechnicalDocument` | Markdown 渲染 |
| `DetailPanel` | 右侧滑出详情面板（~400px） |
| `SyncView` | 空数据时的同步引导页 + 同步进度展示 |
| `SyncProgress` | 实时进度条 + Agent 输出日志流 |

## Sync Workflow

### 空数据状态

页面加载时检测到 `.harnesson/` 不存在或无数据，显示 `SyncView`：

1. 展示提示文案"此项目尚未同步项目图谱"
2. 让用户选择数据存放位置（项目目录 / 用户目录）
3. 用户点击"同步项目图谱"按钮
4. 进入同步进度页，展示实时进度和 Agent 输出日志
5. 同步完成后自动加载图谱数据

### 增量同步（自动触发）

1. 页面加载时读取 `manifest.json`，获取 `lastSyncCommit`
2. 比对当前 git HEAD commit
3. 如果不一致，后台自动触发增量同步
4. 增量同步只分析 `lastSyncCommit..HEAD` 之间的变更文件
5. 同步完成后归档旧数据、更新 manifest、刷新页面数据

### 同步阶段

```
0-10%   初始化 — 检查项目结构、准备扫描环境
10-40%  扫描 — 遍历源代码文件
40-70%  分析 — AI 分析代码，生成规格/架构节点
70-90%  生成 — 写入 JSON/MD 数据文件
90-100% 完成 — 归档历史版本、更新 manifest
```

### 自动同步触发时机

- 页面首次加载时检查 git commit 差异
- 用户手动点击刷新按钮
- 用户切换项目时

## Backend API

### Endpoints

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/graph/status` | GET | 检查图谱同步状态 |
| `/api/graph/manifest` | GET | 获取 manifest.json |
| `/api/graph/data` | GET | 获取完整图谱数据 |
| `/api/graph/sync` | POST | 发起同步，返回 SSE 流 |
| `/api/graph/sync/cancel` | POST | 取消同步 |
| `/api/graph/history` | GET | 获取历史版本列表 |
| `/api/graph/history/:timestamp` | GET | 获取指定历史版本数据 |

### Sync Request

`POST /api/graph/sync`

```json
{
  "projectPath": "/Users/x/Projects/harnesson",
  "storageLocation": "project",
  "syncType": "full"
}
```

### SSE Events

```
event: progress
data: {"phase": "scanning", "progress": 30, "message": "扫描 src/ 目录结构..."}

event: node-generated
data: {"tab": "specs", "node": {"id": "domain-1", "title": "用户域", ...}}

event: complete
data: {"commit": "def5678", "timestamp": "2026-04-26T11:00:00Z", "filesGenerated": 7}

event: error
data: {"message": "CLI process failed", "code": 1}
```

### CLI Subprocess Flow

```
Server (Hono)
  └─ POST /api/graph/sync
       ├─ Archive current data to history (if exists)
       ├─ Spawn Claude CLI subprocess with skill
       ├─ Pipe stdout → parse progress → SSE events
       ├─ On exit (success) → write files → update manifest
       └─ On exit (failure) → restore from history → SSE error event
```

## Frontend State

Zustand store `graphStore`:

```typescript
interface GraphState {
  manifest: Manifest | null;
  specsData: SpecsData | null;
  architectData: ArchitectData | null;

  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
  syncProgress: number;
  syncPhase: string;
  syncLogs: string[];

  activeTab: GraphTab;
  selectedNodeId: string | null;
  isDetailPanelOpen: boolean;

  loadGraph(): Promise<void>;
  startSync(options: SyncOptions): Promise<void>;
  cancelSync(): Promise<void>;
  selectNode(nodeId: string): void;
  closeDetailPanel(): void;
  setActiveTab(tab: GraphTab): void;
  checkAutoSync(): Promise<void>;
}
```

### Data Flow

```
GraphPage mount
  ├─ loadGraph() → GET /api/graph/data → fill specsData / architectData
  └─ checkAutoSync() → GET /api/graph/status → check commit diff
       ├─ No diff → idle
       └─ Has diff → startSync({ syncType: 'incremental' })
```

## Error Handling

### Sync Errors

| 场景 | 处理方式 |
|------|---------|
| CLI 子进程启动失败 | SSE 推送 error 事件，前端显示错误 + 重试按钮 |
| 同步中途 CLI 崩溃 | 检测退出码非 0，恢复 history 最近版本，提示用户 |
| 用户取消同步 | 终止子进程，保留已有数据不覆盖 |
| SSE 连接断开 | 前端自动重连（最多 3 次），重连后获取当前同步状态 |
| 磁盘空间不足 | 后端写入文件时捕获错误，通过 SSE 通知前端 |

### Edge Cases

| 场景 | 处理方式 |
|------|---------|
| 项目无 git 仓库 | 每次全量同步，manifest 不记录 commit |
| `.harnesson/` 数据损坏 | 提示"数据异常，建议重新全量同步" |
| 同时多个项目 | 每个项目独立图谱数据，store 跟随活跃项目切换 |
| 增量同步后结构变化大 | 仍然归档旧版本，用户可从 history 查看 |
| 项目目录被移动/删除 | 检测路径不一致，提示重新配置 |

## Key Decisions

| 决策 | 选择 |
|------|------|
| 数据格式 | JSON（图结构）+ Markdown（文档）混合 |
| 可视化库 | React Flow |
| 实时进度 | SSE 流式推送 |
| Agent 架构 | CLI 子进程 |
| 同步策略 | 全量同步 + 后台自动增量刷新 |
| 详情展示 | 右侧滑出面板（~400px） |
| 历史版本 | 按时间戳归档到 `*-history/` 目录 |
