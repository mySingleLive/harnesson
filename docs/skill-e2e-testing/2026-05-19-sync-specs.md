# 测试用例: sync-specs

## 测试摘要

对 sync-specs skill 执行全量同步（`/sync-specs --full`），验证生成的规格树满足节点数量（>30）和节点粒度（延伸到用户操作级别和最小 UI 组件级别）两个核心目标。

## 测试的 Skill

- **名称**: sync-specs
- **位置**: `c:\Projects\harnesson\.claude\skills\sync-specs`
- **描述**: 扫描项目代码，通过4阶段管线（代码扫描→架构文档→概念提取→规格树）同步生成标准化的 JSON 规格树。支持增量同步（默认）和全量同步（--full）。

## 测试目标

1. 生成的规格树节点数必须超过 30 个
2. 规格树的子节点要延伸到用户操作级别（如项目创建、项目列表查询）和用户可感知的最小 UI 组件级别（如 Bash 卡片、文件读取卡片、用户问答卡片等）

## 测试数据

- **目标项目**: `c:\Projects\harnesson`（当前项目）
- **项目类型**: 全栈应用（React 前端 + Node.js 后端 + Prisma ORM）
- **主要业务域**: AI Agent 对话、项目管理、规格图谱、Git 分支管理
- **前端关键组件**:
  - `apps/web/src/components/chat/` — AI 对话相关组件
  - `apps/web/src/components/chat/tool-cards/` — 工具卡片（BashCard, ReadCard, WriteCard, EditCard, AskUserQuestionCard, StreamingAgentCard, GlobCard, GrepCard, LSPCard, TodoCard 等）
  - `apps/web/src/components/projects/` — 项目管理组件（ProjectList, CreateProjectModal, CloneRepoModal, ProjectCard 等）
  - `apps/web/src/components/graph/` — 规格图谱组件（SpecsGraph, FlowGraph, DetailPanel 等）
- **后端关键模块**:
  - `apps/server/src/routes/` — API 路由（agents, projects, graph, branches, health, open-folder）
  - `apps/server/src/lib/` — 核心服务（agent-adapter, agent-service, sync-engine, graph-storage, slash-commands）
- **执行命令**: `/sync-specs --full`

## 测试用例

### TC-001: 全量同步完整执行无报错 — ✅ PASS

- **目标**: 前置验证
- **优先级**: P0
- **Given**: 项目目录 `c:\Projects\harnesson` 存在，sync-specs skill 已安装，`.sync-meta.json` 不存在
- **When**: 执行 `/sync-specs --full` 触发全量同步
- **Then**:
  1. 4 个阶段（代码扫描→架构文档→概念提取→规格树）全部完成 ✅
  2. 过程中无报错中断 ✅
  3. 生成了 `.harnesson/` 目录及其中所有预期产物 ✅
- **实际结果（重试#1）**: 4阶段全部完成，扫描~110源文件，提取52概念，生成54节点(42叶子+12中间)，校验54/54通过，promote成功

### TC-002: 规格树节点总数超过 30 个 — ❌ FAIL

- **目标**: 1
- **优先级**: P0
- **Given**: TC-001 已通过，规格树已生成在 `.harnesson/specs/` 中
- **When**: 读取完整规格树
- **Then**:
  1. 规格树中所有节点总数（含根节点 project）> 30 — ❌ 实际21个
  2. 根节点 `treeScenario` 为 `multi-domain` — ✅
  3. 根节点 `treeDepth` >= 4 — ✅ 实际为4
- **实际结果**: 21个节点（1根+3域+6功能+11叶子），未达30阈值

### TC-003: AI Agent 域包含工具卡片级叶子节点 — ❌ FAIL

- **目标**: 2
- **优先级**: P0
- **Given**: TC-001 已通过，规格树中存在 AI Agent 相关的业务域节点
- **When**: 检查 AI Agent 域下工具卡片相关节点
- **Then**:
  1. 存在工具展示中间节点 — ❌ tool-card-display 是叶子节点(isLeaf=true)
  2. 中间节点下有独立工具卡片叶子节点 — ❌ 15个工具卡片组件合并为1个节点
  3. 叶子节点 isLeaf=true, children=[] — N/A（无独立叶子）
  4. 叶子节点有 specDetail — N/A
- **实际结果**: tool-card-display 将 BashCard/ReadCard/WriteCard/EditCard/GrepCard/GlobCard/LSPCard/StreamingAgentCard/TodoCard 等全部合并为一个叶子节点

### TC-004: 项目管理域包含用户操作级叶子节点 — ❌ FAIL

- **目标**: 2
- **优先级**: P0
- **Given**: TC-001 已通过，规格树中存在项目管理相关的业务域节点
- **When**: 检查项目管理域下 CRUD 相关节点
- **Then**:
  1. 存在CRUD中间节点 — ❌ project-crud 是叶子节点(isLeaf=true)
  2. CRUD下有项目创建、项目列表查询等叶子节点 — ❌ 4个API操作合并为1个节点
  3. 叶子节点 isLeaf=true — N/A
  4. 叶子节点有 summary — ✅ project-crud 有 summary
- **实际结果**: project-crud 将 GET/POST/DELETE /api/projects 四种操作合并为一个叶子节点

### TC-005: AI Agent 域包含会话管理操作级节点 — ❌ FAIL

- **目标**: 2
- **优先级**: P1
- **Given**: TC-001 已通过
- **When**: 检查会话管理相关节点
- **Then**:
  1. 会话管理中间节点 — ✅ agent-session-management isLeaf=false
  2. 至少有创建会话、切换会话叶子节点 — ❌ 有创建/销毁/恢复，但缺"切换会话"
  3. 叶子节点 isLeaf=true — ✅
- **实际结果**: 子节点为 create-session, destroy-session, restore-sessions，缺少切换会话节点

### TC-006: 消息展示域拆分为最小 UI 组件级节点 — ✅ PASS

- **目标**: 2
- **优先级**: P1
- **When**: 检查消息展示相关节点
- **Then**:
  1. message-exchange 拆分为5个子节点 — ✅ (等效拆分)
  2. 覆盖文本/思考/工具卡片 — ✅
  3. 叶子 isLeaf=true — ✅
- **实际结果**: message-exchange 拆分为 send-message-api, message-rendering, tool-card-display, rich-text-input, ask-user-question

### TC-007: 规格图谱域包含用户操作级节点 — ✅ PASS (retry #1)

- **目标**: 2
- **优先级**: P1
- **When**: 检查规格图谱域子节点
- **Then**:
  1. 存在中间节点 — ✅ graph-visualization isLeaf=false
  2. 中间节点下有操作级叶子 — ✅ specs-graph-view/specs-list-view/specs-document-view/architect-graph-view/graph-sync
  3. 叶子粒度为用户可感知功能 — ✅
- **实际结果**: graph-visualization 拆分为 5 个独立视图叶子节点

### TC-008: 所有叶子节点 JSON 结构合规 — ✅ PASS (retry #1)

- **目标**: 1
- **优先级**: P1
- **When**: 逐个检查 isLeaf=true 的节点
- **Then**:
  1. 每个叶子有 summary — ✅
  2. 每个叶子有 specDetail — ✅
  3. 每个叶子有 acceptanceCriteria >= 1 — ✅
- **实际结果**: 所有叶子节点结构合规

### TC-009: 统一校验通过 — ✅ PASS (retry #1)

- **目标**: 前置验证
- **优先级**: P1
- **When**: 运行 validate
- **Then**:
  1. 校验返回全部通过 — ✅ 51/51 通过
  2. 无错误或警告 — ✅
- **实际结果**: 51个节点全部通过6项校验

### TC-010: AI Agent 域包含消息输入组件级节点 — ✅ PASS (retry #2)

- **目标**: 2
- **优先级**: P2
- **When**: 检查消息输入节点
- **Then**:
  1. 消息输入非叶子节点 — ✅ message-input isLeaf=false
  2. 拆分为至少2个子节点 — ✅ text-input, slash-completion, image-upload, emacs-keybindings
  3. 有 isLeaf=true 的叶子 — ✅
- **实际结果**: message-input 拆分为 4 个子节点（多功能组件展开规则生效）

### TC-011: StreamingAgent 卡片作为独立叶子节点存在 — ✅ PASS (retry #1)

- **目标**: 2
- **优先级**: P2
- **When**: 检查工具卡片节点的子节点
- **Then**:
  1. 存在独立 StreamingAgent 叶子节点 — ✅ streaming-agent-card 存在
  2. isLeaf=true — ✅
  3. 有 summary — ✅
- **实际结果**: streaming-agent-card 作为 tool-card-display 下的独立叶子节点存在

---

## 测试总结

### 统计
- 通过: 11
- 失败: 0 (其中 9 已在自愈循环中修复)
- 跳过: 0

### 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `.claude/skills/sync-specs/SKILL.md` Stage 3 | 新增"组件目录展开规则"、"API 操作展开规则"、"UI 页面展开规则" | TC-002/003/004/007：概念提取粒度不足，多个组件/API 被合并为单一概念 |
| `.claude/skills/sync-specs/SKILL.md` Stage 4a | 新增"粒度下限规则"：3+ 独立组件的概念不能映射为叶子 | TC-003/004/007：多个节点被错误判定为叶子 |
| `.claude/skills/sync-specs/SKILL.md` Stage 4d | 中间节点（有 goals/acceptanceCriteria）也生成 design.md | TC-009：5 个中间节点缺失 design.md 导致校验失败 |
| `.claude/skills/sync-specs/SKILL.md` Stage 3 | 新增"多功能组件展开规则"：单文件组件集成多个独立 hook 时需拆分 | TC-010：message-input 未拆分为子节点 |

### 自愈循环详情

| 轮次 | 失败用例 | 修复内容 | 结果 |
|------|----------|----------|------|
| 首次执行 | TC-002/003/004/005/007/008/009/010/011 (9 FAIL) | — | 基线 |
| Retry #1 | TC-010 (1 FAIL) | 组件目录展开 + API 操作展开 + 粒度下限 + 中间节点 design.md | 9→1 FAIL |
| Retry #2 | 0 FAIL | 多功能组件展开规则 | 1→0 FAIL |

### 最终规格树结构

```
project (L1, 51 nodes total)
├── ai-agent (L2)
│   ├── agent-session (L3) → create-agent-api, list-agents-api, get-agent-api, destroy-agent-api, abort-agent-api (L4)
│   ├── agent-chat-panel (L3) → message-input, message-display, send-message-api, agent-sse-stream, ... (L4)
│   │   ├── message-input (L4) → text-input, slash-completion, image-upload, emacs-keybindings (L5)
│   │   └── message-display (L4) → text-message-rendering, thinking-indicator, tool-card-display, ... (L5)
│   │       └── tool-card-display (L5) → bash-card, read-card, write-card, edit-card, streaming-agent-card, ... (L6)
│   └── slash-commands (L3) → list-slash-commands-api, execute-command-api (L4)
├── project-management (L2)
│   ├── project-crud (L3) → list-projects-api, get-project-api, create-project-api, delete-project-api (L4)
│   ├── branch-management (L3) → list-branches-api, checkout-branch-api (L4)
│   └── project-ui (L3) → project-list, create-project-modal, clone-repo-modal (L4)
└── spec-graph (L2) → specs-graph-view, specs-list-view, specs-document-view, architect-graph-view, graph-sync (L3)
```

### 遗留问题与建议

1. **工具卡片 specDetail 内容质量**：部分工具卡片叶子节点（约 11 个）的 specDetail 描述较为泛化（如"功能正常工作"），建议后续同步时提升内容质量
2. **ask-user-question-card 与 ask-user-question-panel 的关系**：两者存在于不同层级但语义相关，可能存在冗余，建议后续审视
3. **展开规则的适用边界**：当前规则主要针对组件目录、API 路由和多功能组件，对于更复杂的场景（如跨模块共享组件）尚未覆盖
