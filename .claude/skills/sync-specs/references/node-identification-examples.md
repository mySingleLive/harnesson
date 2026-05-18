# 节点识别示例

本文件提供节点识别原则的详细示例。按需加载，不常驻上下文。

## 正面示例（应成为节点）

| 节点 | 类型 | 说明 |
|------|------|------|
| AI 对话 | 业务域 | 用户直接使用对话功能，包含前端输入、消息渲染、后端 Agent 调度 |
| 项目管理 | 业务域 | 用户创建/管理项目，涉及 CRUD API、数据库、前端表单 |
| 商品搜索 | 业务功能 | 用户执行搜索操作，涉及搜索引擎、API、搜索栏组件 |
| 规格图谱 | 业务域 | 用户可视化浏览项目规格，涉及 ReactFlow、图谱数据、同步引擎 |

## 反面示例（不应成为独立节点）

| 节点 | 问题 | 正确归属 |
|------|------|---------|
| agent-adapter | 纯技术接口定义，用户不感知 | 属于「AI 对话」域内部实现 |
| agent-streaming | SSE 通信机制，是 AI 对话的实现细节 | 属于「AI 对话」域内部实现 |
| graph-storage | 数据库存储层，是规格管理的实现细节 | 属于「规格图谱」域内部实现 |

**例外：** 当技术模块足够复杂且被多个业务功能复用时，可作为「共享基础设施」域下的功能节点，但仍以功能名命名。

## 叶子节点判定详解

每个业务功能节点都需判断是叶子还是中间节点，判定依据为下方「叶子判定核心规则」。

## 叶子判定核心规则

**前端（UI）叶子** — 满足任一即为叶子：
1. 一次对后端或外部接口的调用（如提交表单触发 POST、调用搜索 API）→ 同时产生前端叶子（触发动作）和后端叶子（API 处理），共享父节点
2. 一次用户事件所触发的功能，且该功能内部不含有对外部接口的调用（如展开/收起面板、本地过滤、拖拽排序）
3. 一个不包含条件 1 和 2 的组件（如纯渲染组件、静态展示卡片）

**后端叶子** — 满足任一即为叶子：
1. 由 API 触发的一个业务功能
2. 可被外部触发的功能（定时任务、Hooks、AI Function Call、Skills 等）

**跨前后端功能**：前端条件 1（对外接口调用）命中时，自动产生前端叶子 + 后端叶子，共享同一父节点。

**无法确定时**：假定为非叶子，继续拆解子节点；若无法再拆解，则判定为叶子。

## 前后端叶子判定对比示例

| 功能 | 前端/后端 | 判定分析 | 结果 |
|------|----------|---------|------|
| 切换模型 | 前端 | 用户点击触发模型切换 → 调用后端切换模型 API → 满足前端条件1 | 叶子（前端+后端） |
| 文本消息渲染 | 前端 | 纯渲染组件，不调用外部接口 → 满足前端条件3 | 叶子 |
| 展开/收起面板 | 前端 | 用户事件触发的 UI 变化，无外部接口调用 → 满足前端条件2 | 叶子 |
| 本地搜索过滤 | 前端 | 用户输入触发本地数据过滤，无外部接口调用 → 满足前端条件2 | 叶子 |
| Message Display | 前端 | 含文本渲染、工具卡片、思考指示器等 → 不满足任一条件（包含多种不同类型功能） | 非叶子 → 拆分 |
| 创建会话 API | 后端 | 单个 API 触发的业务功能 → 满足后端条件1 | 叶子 |
| 定时同步规格 | 后端 | 外部定时任务触发 → 满足后端条件2 | 叶子 |
| Agent 调度 | 后端 | 涉及多个 API（创建会话、发送消息、流式响应）→ 不满足任一条件 | 非叶子 → 拆分 |
| 提交表单 | 跨前后端 | 前端按钮点击触发 POST API → 满足前端条件1 → 前端叶子 + 后端叶子 | 拆为两个叶子 |

## 误判为叶子的典型案例

| 节点 | 涵盖的独立功能 | 判定分析（前后端标准） | 正确判定 |
|------|--------------|----------------------|---------|
| Message Display | 文本渲染、工具卡片(Bash/Edit/Write/Read等)、思考指示器、Todo进度条、用户问答面板 | 不满足前端任一叶子条件（包含多种不同类型功能，非单次接口调用/非单一用户事件/非简单组件） | 非叶子 → 拆为5个子节点 |
| Message Input | 文本输入编辑器、图片上传、斜杠命令自动补全 | 不满足前端任一叶子条件（3个不同类型操作，图片上传涉及外部接口但其他不涉及，整体不可合并为单一条件） | 非叶子 → 拆为3个子节点 |

## 判定流程示例

| 节点 | 枚举的功能 | 前后端归属 | 判定 | 拆分结果 |
|------|-----------|----------|------|---------|
| Agent Session | 创建会话、切换会话、删除会话 | 后端（API 触发） | 3 个独立 API → 非叶子 | 创建会话 / 切换会话 / 删除会话（各为后端叶子） |
| Message Input | 文本输入、图片上传、斜杠命令补全 | 前端（UI 操作） | 3 个不同操作 → 非叶子 | 文本输入(条件2) / 图片上传(条件1+后端) / 斜杠命令补全(条件2) |
| 发送消息（前端） | 输入文本并发送到后端 | 前端 | 调用后端发送消息 API → 前端条件1 | 叶子（前端+后端） |
| Bash 命令卡片 | 展示单条命令执行结果 | 前端 | 纯渲染组件，无外部接口调用 → 前端条件3 | 叶子 |
| 展开/收起树节点 | 点击切换展开状态 | 前端 | 用户事件触发，无外部接口调用 → 前端条件2 | 叶子 |
| 规格同步 | API 触发的全量同步 + 定时增量同步 | 后端 | 2 种触发方式 → 非叶子 | 全量同步 / 增量同步（各为后端叶子） |

## 叶子/非叶子节点示例

**叶子节点：**
- 打开项目 — 调用后端打开项目 API → 前端条件1
- Bash 命令卡片 — 纯渲染组件，不包含接口调用或用户事件 → 前端条件3
- 发送消息 — 调用后端发送消息 API → 前端条件1
- 展开/收起树节点 — 用户点击触发，无外部接口调用 → 前端条件2
- 本地搜索过滤 — 用户输入触发，无外部接口调用 → 前端条件2

**非叶子节点：**
- 项目管理 → 项目创建、打开项目、克隆项目、删除项目
- 智能工具 → Bash 命令卡片、文件读取卡片、文件编辑卡片、...
- 快捷操作 → 快捷按钮、斜杠命令

## 操作级拆分示例

- Agent Session → 创建会话、切换会话、删除会话（L4 操作级）
- Tool Execution Display → Bash 卡片、文件读取卡片、文件编辑卡片、...（L4）
- Message Display → 文本消息渲染、思考指示器、用户问答面板（L4）
- Message Input → 文本输入、图片上传、快捷键操作（L4）

## 概念到节点的映射示例

以下示例展示 Stage 3 提取的概念如何映射到 Stage 4 的规格树节点。

### 映射规则

| 概念 Type | 节点 Level | isLeaf | 说明 |
|-----------|-----------|--------|------|
| domain | 2 | false | 顶层业务域 |
| feature | 3+ | 视子概念而定 | 用户可见功能 |
| entity | 3+ | 视子概念而定 | 业务实体 |
| component | 最终层 | true | UI/技术组件 |
| operation | 最终层 | true | 用户操作/API |
| interface | 最终层 | true | 接口/契约 |

### 完整映射示例

**概念列表（All-Concepts.md 片段）：**

- CONC-001: AI Agent (domain, module: ai-agent)
- CONC-002: Message Exchange (feature, module: ai-agent, refs: [CONC-001])
- CONC-003: Message Input (component, module: ai-agent, refs: [CONC-002])
- CONC-004: Send Message (operation, module: ai-agent, refs: [CONC-002, CONC-003])
- CONC-005: Response Display (component, module: ai-agent, refs: [CONC-002])
- CONC-006: Session Management (feature, module: ai-agent, refs: [CONC-001])
- CONC-007: Create Session (operation, module: ai-agent, refs: [CONC-006])
- CONC-008: Delete Session (operation, module: ai-agent, refs: [CONC-006])

**映射后的规格树：**

```
project (level 1)
└── ai-agent (level 2, ← CONC-001 domain)
    ├── message-exchange (level 3, ← CONC-002 feature)
    │   ├── message-input (level 4, ← CONC-003 component, isLeaf: true)
    │   ├── send-message (level 4, ← CONC-004 operation, isLeaf: true)
    │   └── response-display (level 4, ← CONC-005 component, isLeaf: true)
    └── session-management (level 3, ← CONC-006 feature)
        ├── create-session (level 4, ← CONC-007 operation, isLeaf: true)
        └── delete-session (level 4, ← CONC-008 operation, isLeaf: true)
```

### 跨前后端映射示例

**概念：**
- CONC-010: Submit Form (operation, refs: [CONC-011 Form UI])
- CONC-011: Form UI (component, refs: [CONC-010])

**映射：** operation 命中前端叶子条件1（API 调用），拆为前端叶子 + 后端叶子：

```
form-management (level 3)
├── form-ui (level 4, ← CONC-011, 前端叶子)
└── form-submit-api (level 4, ← CONC-010, 后端叶子)
```

### 实体映射示例

**概念：**
- CONC-020: Project Settings (entity, refs: [CONC-001])
- CONC-021: Settings Name Field (component, refs: [CONC-020])
- CONC-022: Save Settings (operation, refs: [CONC-020])

**映射：** entity 作为中层节点，其子操作和组件作为叶子：

```
ai-agent (level 2)
└── project-settings (level 3, ← CONC-020 entity)
    ├── settings-name-field (level 4, ← CONC-021 component, isLeaf: true)
    └── save-settings (level 4, ← CONC-022 operation, isLeaf: true)
```
