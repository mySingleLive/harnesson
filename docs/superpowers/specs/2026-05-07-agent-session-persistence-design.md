# Agent Session 上下文持久化设计

日期: 2026-05-07

## 概述

将 Agent Session 的上下文信息持久化到磁盘。服务重启或页面刷新后，点击左侧导航栏中的任意 Agent Session 可恢复完整的聊天记录、上下文和最新状态。切换 Agent Session 时，顶部标题栏显示对应的项目名和分支名。

## 需求

1. 每个 Agent Session 的上下文信息持久化到 SQLite 数据库
2. 服务重启、页面刷新后，点击 Agent Session 可看到完整聊天记录、上下文和最新消息
3. 切换 Agent Session 时，顶部标题栏立刻显示该项目和分支
4. Agent Session 可恢复 — 恢复后 Agent 能记住之前的对话继续工作
5. 先做单用户，未来支持多用户隔离
6. 历史数据永久保留，不做自动清理

## 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 存储方案 | 扩展现有 SQLite + Prisma | 与现有基础设施统一，单用户够用，多用户时可升级 PostgreSQL |
| Session 恢复 | Adapter 层抽象 | 每种 Agent（Claude/Cursor/Open Code）自己实现恢复逻辑，解耦存储与 Agent 实现 |
| 消息存储 | JSON 字段存 events | 避免拆表带来的查询复杂度，单条消息的 events 数量有限 |
| 清理策略 | 永久保留 | 用户手动删除，不做自动清理 |
| 标题栏切换 | 仅显示 | 不实际切换 Git 工作区，只更新显示信息 |
| 多用户预留 | API 层无鉴权，表结构预留 | 先单用户，未来加 userId 列 + JWT 中间件 |

## 架构

### 数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Web)                              │
│                                                                  │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐               │
│  │ Sidebar    │   │ AgentStore │   │ TitleBar   │               │
│  │ (sessions) │◄─►│ (Zustand)  │◄─►│ (display)  │               │
│  └────────────┘   └─────┬──────┘   └────────────┘               │
│                         │                                        │
│              ┌──────────┼──────────┐                             │
│              │          │          │                              │
│         GET /agents  GET /agents/:id  SSE /agents/:id/stream    │
│              │     /messages         │                           │
└──────────────┼──────────────────────┼───────────────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Server (Hono.js)                           │
│                                                                  │
│  ┌──────────────┐   ┌────────────────┐   ┌─────────────────┐    │
│  │ AgentService │   │ AgentAdapter   │   │ Prisma/SQLite   │    │
│  │              │   │ (interface)    │   │                 │    │
│  │ - runtimeState   │               │   │ AgentSession    │    │
│  │   (in-memory)│   │ ClaudeCode     │   │ Message         │    │
│  │              │   │ Cursor (future)│   │ TodoItem        │    │
│  │ - db queries │   │ OpenCode(future│   │                 │    │
│  └──────────────┘   └────────────────┘   └─────────────────┘    │
│                                                                  │
│  启动流程: AgentService.restoreAll() → 从 DB 加载 → adapter      │
│  .restoreSession() → 重建 runtimeState                           │
└──────────────────────────────────────────────────────────────────┘
```

### 状态分离

运行时状态（不可序列化）和持久化状态严格分离：

- **持久化状态** (SQLite)：session 元信息、消息、events、todo、adapter sessionData
- **运行时状态** (内存)：adapter 实例、SSE 连接、event buffer — 重启后从持久化状态重建

## 数据库 Schema

### AgentSession 表

```prisma
model AgentSession {
  id              String    @id @default(uuid())
  name            String
  type            String    // "claude-code" | "cursor" | "open-code" 等
  status          String    // "idle" | "thinking" | "streaming" | "waiting_input" | "error" | "destroyed"
  projectId       String
  branch          String
  worktreePath    String?
  taskId          String?
  model           String?
  permissionMode  String    @default("default")
  config          Json      @default("{}")       // Adapter 特定配置
  sessionData     Json?     // Claude SDK sessionData (conversationId 等)
  lastMessageAt   DateTime? // 最后消息时间，排序用
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  project         Project   @relation(fields: [projectId], references: [id])
  messages        Message[]
  todos           TodoItem[]

  @@index([projectId])
  @@index([status])
  @@index([updatedAt])
}
```

### Message 表

```prisma
model Message {
  id           String   @id @default(uuid())
  agentId      String
  role         String   // "user" | "agent" | "system"
  content      String   // 消息正文
  events       Json?    // AgentStreamEvent[]
  todoSnapshot Json?    // 该消息时刻的 Todo 快照
  createdAt    DateTime @default(now())

  agent        AgentSession @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId, createdAt])
}
```

### TodoItem 表

```prisma
model TodoItem {
  id          String    @id @default(uuid())
  agentId     String
  subject     String
  description String?
  status      String    // "pending" | "in_progress" | "completed"
  activeForm  String?
  taskId      String?
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  agent       AgentSession @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId])
}
```

### Project 表变更

```prisma
model Project {
  // ... 现有字段不变
  sessions    AgentSession[]  // 新增反向关联
}
```

## Adapter 层抽象

### 接口定义

```typescript
interface AgentAdapter {
  // 现有方法
  createSession(config: AgentConfig): Promise<AdapterSession>;
  sendMessage(sessionId: string, message: string): AsyncIterable<AgentStreamEvent>;
  abort(sessionId: string): Promise<void>;
  destroySession(sessionId: string): Promise<void>;

  // 持久化相关（新增）
  getSessionData(sessionId: string): Promise<AdapterSessionData>;
  restoreSession(sessionData: AdapterSessionData): Promise<AdapterSession>;
  getType(): string; // "claude-code" | "cursor" | "open-code"
}

interface AdapterSessionData {
  [key: string]: unknown; // 各 adapter 自定义
}
```

### ClaudeCodeAdapter 恢复实现

- `getSessionData()` 返回 `{ conversationId, sessionId, model, ... }`
- `restoreSession()` 使用 conversationId 恢复 Claude SDK session
- 如果恢复失败（session 过期等），返回错误让 AgentService 标记 status 为 `error`

### 未来 Adapter 扩展

- Cursor Adapter：实现自己的 `restoreSession()` 逻辑
- Open Code Adapter：同理
- 存储层完全不感知具体 Agent 类型，只存 JSON

## AgentService 改造

### 核心改造

```typescript
class AgentService {
  private db: PrismaClient;

  // 运行时状态（内存，重启后从 DB 重建）
  private runtimeState: Map<string, {
    adapter: AgentAdapter;
    session: AdapterSession;
    sseClients: Set<SSEClient>;
    eventBuffer: AgentStreamEvent[];
  }>;

  // 启动时调用
  async restoreAll(): Promise<void>;

  // 创建 session — 同时写 DB
  async create(config: CreateAgentConfig): Promise<AgentSession>;

  // 发消息 — 流结束后持久化
  async sendMessage(agentId: string, message: string): Promise<void>;

  // 查询
  async getSession(id: string): Promise<AgentSession | null>;
  async listSessions(projectId?: string): Promise<AgentSession[]>;
  async getMessages(agentId: string, limit?: number, before?: string): Promise<Message[]>;
  async getTodos(agentId: string): Promise<TodoItem[]>;

  // 软删除
  async destroySession(id: string): Promise<void>;
}
```

### 恢复流程

1. 服务启动 → `restoreAll()` → DB 查询所有 `status != 'destroyed'` 的 sessions
2. 对每个 session → 根据 `type` 找到对应 Adapter → `restoreSession(sessionData)`
3. 恢复成功 → status 设为 `idle`，加入 runtimeState
4. 恢复失败 → status 设为 `error`，记录原因
5. 之前正在 streaming 的 → status 设为 `idle`，标记 "可能被中断"

### 持久化时机

- **创建 session** → 立即写 DB
- **每条消息流结束** → 保存用户消息 + agent 回复（含 events）+ 更新 sessionData + 更新 lastMessageAt
- **todo 变化** → 同步写入 DB（upsert）
- **status 变化** → 同步更新 DB

## 前端改造

### AgentStore 改造

```typescript
interface AgentStore {
  initialized: boolean;

  // 启动时从服务端加载所有 sessions
  initialize(): Promise<void>;

  // 切换 agent 时从服务端加载消息（懒加载）
  activateAgent(id: string): Promise<void>;

  // 现有方法保持不变
  createAgent(config): Promise<Agent>;
}
```

### 恢复流程

1. 页面加载 → `store.initialize()` → GET `/api/agents`
2. 点击 session → `store.activateAgent(id)` → GET `/api/agents/:id/messages`
3. 建立 SSE → GET `/api/agents/:id/stream`
4. SSE 事件实时更新 store（和现在一样）

### 标题栏切换

- `activeAgentId` 变化时，查找对应 agent 的 `project.name` + `branch`
- 更新顶部标题栏显示
- 不实际切换 Git 工作区

## API 变更

| 端点 | 方法 | 变更 |
|------|------|------|
| `/api/agents` | GET | 返回持久化的 sessions（含 status, lastMessageAt） |
| `/api/agents` | POST | 创建 session（内部增加 DB 写入） |
| `/api/agents/:id` | GET | 返回 session 详情 |
| `/api/agents/:id` | DELETE | 软删除（status → 'destroyed'） |
| `/api/agents/:id/messages` | GET | **新增** — 返回消息历史，支持游标分页 |
| `/api/agents/:id/todos` | GET | **新增** — 返回 Todo 列表 |
| `/api/agents/:id/message` | POST | 发消息（内部增加持久化逻辑） |
| `/api/agents/:id/stream` | GET | SSE 流（不变） |
| `/api/agents/:id/abort` | POST | 中断（不变） |
| `/api/agents/:id/tool-result` | POST | 回答问题（不变） |

## 错误处理

| 场景 | 处理 |
|------|------|
| Session 恢复失败 | status 标记 `error`，前端显示错误原因，用户可重试或删除 |
| Streaming 中服务重启 | 恢复后 status 设为 `idle`，前端提示 "上一次对话可能被中断" |
| DB 写入失败 | 事件缓冲在内存保留，定时重试持久化 |
| Session 数据损坏 | 跳过该 session，标记 error，不影响其他 session 恢复 |

## 多用户预留

- 当前不做鉴权，API 层无 userId 过滤
- 所有表未来可加 `userId` 字段
- 未来实现：添加 `userId` 列 + JWT 鉴权中间件 + `where: { userId }` 查询过滤
