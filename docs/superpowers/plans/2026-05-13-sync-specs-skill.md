# sync-specs Skill 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换现有 `.claude/skills/sync-specs/` skill，实现设计文档中定义的统一 JSON 规格树同步流程。

**Architecture:** Skill 由 SKILL.md（主文件，定义完整流程和规则）和 references/node-schema.md（按需加载的节点 Schema 详细说明）组成。纯 Agent 驱动，不含脚本。

**Tech Stack:** Markdown skill 文件，JSON 输出格式

---

## File Structure

```
.claude/skills/sync-specs/
├── SKILL.md                        # REPLACE: 完整重写，新流程+新规则
└── references/
    └── node-schema.md              # CREATE: 节点 JSON Schema 详细说明
```

- 删除旧 SKILL.md 中的 Java/Maven 特定逻辑、business-nodes/tech-nodes 双树结构、global-spec.md 单文件迁移机制
- 新增统一 JSON 树结构、draft 草稿审核机制、自动校验循环、`.harnesson/specs/` 存储路径

---

### Task 1: 创建 references 目录和 node-schema.md

**Files:**
- Create: `.claude/skills/sync-specs/references/node-schema.md`

- [ ] **Step 1: 创建 references 目录**

```bash
mkdir -p .claude/skills/sync-specs/references
```

- [ ] **Step 2: 编写 node-schema.md**

创建 `.claude/skills/sync-specs/references/node-schema.md`，内容如下：

```markdown
# 节点 JSON Schema 详细说明

本文件定义规格树中所有节点的 JSON 结构。仅在生成或校验节点时加载。

## 通用节点结构

每个节点是一个 JSON 对象，包含以下字段：

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 节点唯一标识，kebab-case 格式（如 `agent-chat-panel`）。同层级内唯一。 |
| name | string | 节点显示名称（如 `Agent Chat Panel`）。同层级内唯一。 |
| level | integer | 层级深度。根节点 = 1，子节点递增。 |
| parent | string \| null | 父节点 id。根节点为 null。 |
| children | string[] | 子节点 id 列表。叶子节点为空数组 `[]`。 |
| isLeaf | boolean | 是否叶子节点。无子节点时为 true。 |
| summary | string | 功能简述/摘要。1-3 句话。 |
| status | string | 节点状态：`published`（已发布）或 `draft`（草稿）。 |
| syncMeta | object | 同步元信息，结构见下方。 |

### 按需填充字段

| 字段 | 类型 | 说明 |
|------|------|------|
| goals | string[] | 功能目标列表。每个目标一句话。 |
| design | object \| null | 设计方案。包含 `overview`（string，方案概述）和可选的 `flow`（string，流程设计）。仅在有明确设计模式时生成。 |
| acceptanceCriteria | array[object] | 验收标准列表。每个对象包含 `given`、`when`、`then` 三个 string 字段。每个功能至少 1 条。 |
| testCases | array[object] | 测试用例列表。每个对象结构见下方。 |

### syncMeta 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| lastSyncAt | string | ISO 8601 时间戳，最后一次同步时间。 |
| baseCommit | string | 同步基准的 git commit hash（短格式，如 `e270401`）。 |
| baseCommitMessage | string | 基准 commit 的消息。 |
| branch | string | 同步时的 git 分支名。 |
| sourceFiles | string[] | 该节点关联的源文件/目录路径列表。 |

### testCase 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| level | string | 优先级：`p0`（验收标准级）、`p1`（分支覆盖）、`p2`（边界条件）、`p3`（兼容性/环境）。 |
| type | string | 测试类型：`unit`、`integration`、`e2e`。 |
| given | string | Given/When/Then 格式的前置条件。 |
| when | string | Given/When/Then 格式的操作/触发条件。 |
| then | string | Given/When/Then 格式的预期结果。 |

## 根节点（project.json）额外字段

| 字段 | 类型 | 说明 |
|------|------|------|
| treeDepth | integer | 当前规格树的最大深度。 |
| treeScenario | string | 树的场景类型，取值：`single`（一层，仅项目描述）、`flat`（二层，项目+功能列表）、`multi-functional`（多层-功能细化）、`multi-domain`（多层-多领域）。 |

根节点的 `id` 固定为 `"project"`，`level` 固定为 `1`，`parent` 固定为 `null`。

## 测试用例级别详解

| 级别 | 含义 | 生成来源 |
|------|------|----------|
| p0 | 验收标准级，最高优先级 | 从 acceptanceCriteria 直接转换，每个验收标准至少 1 个 p0 用例 |
| p1 | 分支覆盖 | 分析代码中的条件分支逻辑（if/else、switch、try/catch） |
| p2 | 边界条件 | 识别输入边界、空值、极端值、并发等边界场景 |
| p3 | 兼容性/环境 | 跨浏览器、不同运行环境、不同配置的兼容性测试 |

## 示例

### 中间节点（有子节点）

\`\`\`json
{
  "id": "agent-management",
  "name": "Agent 管理",
  "level": 2,
  "parent": "project",
  "children": ["agent-session", "agent-context-menu"],
  "isLeaf": false,
  "summary": "Agent 的生命周期管理和交互功能，包括会话管理、上下文菜单和状态同步。",
  "goals": [
    "支持创建、切换和管理 Agent 会话",
    "提供 Agent 操作的快捷菜单"
  ],
  "design": {
    "overview": "采用 React + Hono 前后端分离架构，WebSocket 实现实时状态同步。",
    "flow": "用户操作 → API 请求 → 服务端处理 → WebSocket 推送 → 前端状态更新"
  },
  "acceptanceCriteria": [
    {
      "given": "用户在侧边栏查看 Agent 列表",
      "when": "右键点击某个 Agent",
      "then": "显示包含重命名、删除等操作的上下文菜单"
    }
  ],
  "testCases": [
    {
      "level": "p0",
      "type": "e2e",
      "given": "侧边栏已加载 Agent 列表",
      "when": "右键点击 Agent 卡片",
      "then": "出现上下文菜单，包含所有预期操作项"
    }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": [
      "apps/web/src/components/AgentPanel/",
      "apps/server/src/routes/agents.ts"
    ]
  }
}
\`\`\`

### 叶子节点

\`\`\`json
{
  "id": "chat-input",
  "name": "聊天输入框",
  "level": 3,
  "parent": "agent-chat-panel",
  "children": [],
  "isLeaf": true,
  "summary": "用户输入消息的文本框组件，支持多行输入、快捷键发送和文件拖拽。",
  "goals": [
    "支持多行文本输入和自动调整高度",
    "支持 Enter 发送、Shift+Enter 换行"
  ],
  "acceptanceCriteria": [
    {
      "given": "聊天面板已打开且输入框可见",
      "when": "输入文本并按 Enter",
      "then": "消息发送到 Agent，输入框清空"
    },
    {
      "given": "输入框中有文本",
      "when": "按 Shift+Enter",
      "then": "插入换行符，不发送消息"
    }
  ],
  "testCases": [
    {
      "level": "p0",
      "type": "e2e",
      "given": "聊天面板已打开",
      "when": "输入 'hello' 并按 Enter",
      "then": "消息发送成功，输入框清空"
    },
    {
      "level": "p1",
      "type": "unit",
      "given": "输入框组件已挂载",
      "when": "输入为空时按 Enter",
      "then": "不触发发送操作"
    },
    {
      "level": "p2",
      "type": "unit",
      "given": "输入框有大量文本（10000+ 字符）",
      "when": "按 Enter 发送",
      "then": "正常发送，不截断"
    }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": [
      "apps/web/src/components/chat/ChatInput.tsx"
    ]
  }
}
\`\`\`

### 根节点

\`\`\`json
{
  "id": "project",
  "name": "Harnesson",
  "level": 1,
  "parent": null,
  "treeDepth": 3,
  "treeScenario": "multi-domain",
  "children": ["agent-management", "agent-chat-panel", "code-sync"],
  "isLeaf": false,
  "summary": "Visual AI Coding Management Platform - 基于 AI Agent 的可视化编码管理平台。",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": []
  }
}
\`\`\`
```

- [ ] **Step 3: 验证文件已创建**

Run: `cat .claude/skills/sync-specs/references/node-schema.md | head -5`
Expected: 看到文件头部内容

- [ ] **Step 4: 提交**

```bash
git add .claude/skills/sync-specs/references/node-schema.md
git commit -m "feat(sync-specs): add node-schema reference document"
```

---

### Task 2: 重写 SKILL.md

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（完全重写）

- [ ] **Step 1: 重写 SKILL.md**

将 `.claude/skills/sync-specs/SKILL.md` 完整替换为以下内容：

```markdown
---
name: sync-specs
description: 扫描项目代码，同步生成标准化的 JSON 规格树。支持增量同步（默认）和全量同步（--full）。当用户输入 /sync-specs、/sync-specs --full，或要求同步项目规格、生成功能规格、更新规格树时触发。
---

# Sync Specs

将项目代码分析结果同步为标准化的 JSON 规格树。

## 触发

- `/sync-specs` → 自动判断模式：有 `project.json` 走增量，无则走全量
- `/sync-specs --full` → 强制全量

## 模式判断

1. 检测 `.harnesson/specs/project.json` 是否存在
   - 不存在 → **全量模式**
   - 存在 → 继续
2. 检查用户参数
   - 用户传入 `--full` → **全量模式**
   - 无参数 → **增量模式**

## 流程

严格按以下步骤顺序执行。

### Step 1：扫描项目

**所有模式下都执行。**

1. 读取 `package.json`、`tsconfig.json`（或等效配置）理解项目结构
2. 读取现有规格树（如 `.harnesson/specs/project.json` 存在）
3. 增量模式：执行 `git diff --name-only <baseCommit>..HEAD` 识别变更文件
4. 全量模式：扫描全部源文件目录

**禁止**：此步骤不修改任何文件。

### Step 2：生成同步计划

1. 对比现有规格树与代码变更（增量）或全量分析结果
2. 列出需要 新增/更新/删除/不变 的节点，每个节点注明原因和关联文件
3. 写入 Markdown 同步计划到 `.harnesson/plans/{YYYY-MM-DD}-{mode}-sync-plan.md`

计划格式：

```markdown
# 同步计划 - {日期}

## 模式
{增量同步/全量同步}

## 基准版本
- Commit: {hash}
- Message: {消息}
- Branch: {分支名}

## 变更概览

| 节点 | 操作 | 原因 |
|------|------|------|
| {node-id} | {新增/更新/删除/不变} | {原因} |

## 详细变更

### {node-id} ({操作})
- 关联文件: {文件路径}
- 变更原因: {描述}
- 预计影响: {需要更新的字段}

## 新增节点
{列表，或"无"}

## 删除节点
{列表，或"无"}
```

**禁止**：不跳过此步骤直接生成草稿。

### Step 3：生成草稿

1. 按同步计划逐节点生成或更新
2. 分析代码提取每个节点的 summary、goals、design、acceptanceCriteria、testCases
3. 所有输出写入 `.harnesson/specs/draft/` 目录（结构与正式目录一致）

**节点内容生成规则：**
- `summary`：从代码注释、README、组件名/模块名提取，1-3 句话
- `goals`：从功能行为和代码实现推断，每个目标一句话
- `design`：仅在有明确设计模式或架构决策时生成 `overview`，有明确流程时生成 `flow`。没有则设为 null
- `acceptanceCriteria`：每个功能至少 1 条 Given/When/Then
- `testCases`：p0 从验收标准直接转换；p1 从代码分支逻辑补充；p2 从边界条件补充；p3 从兼容性场景补充

**语言规则：** 检测项目主要语言（代码注释、README、现有文档），规格内容跟随项目语言。

**禁止**：不写入 `.harnesson/specs/` 正式目录（除 draft/ 外）。

### Step 4：自动校验（循环直到通过）

对 `.harnesson/specs/draft/` 中的所有草稿文件执行以下 5 项校验。发现问题则修改草稿并重新校验，循环直到全部通过。

**校验项：**

1. **格式校验**
   - 所有 JSON 文件可正确解析
   - 必填字段存在且类型正确：id, name, level, parent, children, isLeaf, summary, status, syncMeta
   - id 为 kebab-case 格式
   - children 为数组，叶子节点的 children 为空数组
   - syncMeta 包含 lastSyncAt, baseCommit, baseCommitMessage, branch, sourceFiles

2. **版本校验**
   - syncMeta.baseCommit 与当前 git HEAD 或增量基线一致
   - 根节点的 syncMeta.branch 与当前 git 分支一致

3. **内容校验**
   - 节点的 summary 和 goals 与其关联的源文件（syncMeta.sourceFiles）的实际实现一致
   - 不存在代码中已删除但规格中仍标记为"已实现"的功能

4. **结构校验**
   - 父子关系一致：子节点的 parent 字段正确指向父节点 id，父节点的 children 包含所有子节点 id
   - 领域/模块划分合理：同一领域的功能归在同一父节点下
   - 不存在功能重叠：两个不同节点不应描述完全相同的功能

5. **唯一性校验**
   - 同一层级（同一 parent 下）不存在重复的 name
   - 同一层级不存在语义重复的 summary
   - 跨层级允许相似描述（不同抽象层次），但需标记为合理

**循环规则：** 发现任一问题 → 修改草稿文件 → 从第 1 项重新校验 → 直到 5 项全部通过。

**禁止**：不带问题进入用户审核阶段。

### Step 5：用户审核

1. 展示同步计划摘要（来自 Step 2）
2. 展示校验结果摘要（来自 Step 4）
3. 对每个变更节点，展示草稿与现有文件的 diff（新增节点展示完整内容）
4. 等待用户确认

用户可能：
- **确认通过** → 进入 Step 6
- **要求修改** → 修改草稿，回到 Step 4 重新校验
- **拒绝** → 终止流程，保留草稿供参考

**禁止**：不自动转正。

### Step 6：转正发布

1. 将 `.harnesson/specs/draft/` 中的所有文件移动到 `.harnesson/specs/` 对应位置
2. 清理 `.harnesson/specs/draft/` 目录
3. 更新根节点的 syncMeta（lastSyncAt 设为当前时间）

**禁止**：不删除用户在正式文件中手动编辑的内容。增量模式下，未变更的节点文件保持不变。

---

## 存储结构

### 文件布局

```
.harnesson/
├── specs/
│   ├── project.json                          # L1 根节点
│   ├── nodes/                                # 所有非根节点
│   │   ├── {kebab-case-name}.json           # L2 域/功能节点（无子节点时为单文件）
│   │   ├── {kebab-case-name}/               # 有子节点时用目录组织
│   │   │   ├── index.json                   # 自身节点
│   │   │   ├── {child-name}.json           # 直接子节点（叶子）
│   │   │   └── {child-name}/               # 子节点还有子节点时递归
│   │   └── ...
│   └── draft/                                # 草稿目录（审核中，结构同上）
└── plans/                                    # 同步计划
    └── {YYYY-MM-DD}-{mode}-sync-plan.md
```

### 节点文件路径规则

- L2 无子节点：`nodes/{id}.json`
- L2 有子节点：`nodes/{id}/index.json`，子节点为 `nodes/{id}/{child-id}.json` 或 `nodes/{id}/{child-id}/index.json`
- 每深入一层，在父节点目录下继续展开

### 节点 Schema

所有节点共享统一 JSON 结构。详细字段说明和示例见 `references/node-schema.md`（按需加载）。

核心字段速览：

```json
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "level": 2,
  "parent": "parent-id",
  "children": ["child-1", "child-2"],
  "isLeaf": false,
  "summary": "简述",
  "goals": ["目标1", "目标2"],
  "design": { "overview": "...", "flow": "..." },
  "acceptanceCriteria": [
    { "given": "...", "when": "...", "then": "..." }
  ],
  "testCases": [
    { "level": "p0", "type": "e2e", "given": "...", "when": "...", "then": "..." }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "ISO-8601",
    "baseCommit": "hash",
    "baseCommitMessage": "...",
    "branch": "branch-name",
    "sourceFiles": ["path/"]
  }
}
```

根节点额外字段：`treeDepth`（整数）、`treeScenario`（single/flat/multi-functional/multi-domain）

---

## 增量模式补充说明

增量模式在 Step 1 中通过 `git diff` 识别变更文件后：

1. 将变更文件匹配到节点（通过 `syncMeta.sourceFiles`）
2. 仅对受影响的节点执行分析和草稿生成
3. 未受影响的节点不读取、不修改
4. 同步计划中明确标记"不变"节点
5. 草稿只包含变更部分

---

## Agent 行为规则

| 阶段 | 必须做 | 不能做 |
|------|--------|--------|
| 扫描 | 读取 package.json/tsconfig 理解项目结构 | 不修改任何文件 |
| 计划 | 生成 Markdown 同步计划到 .harnesson/plans/ | 不跳过用户确认 |
| 草稿 | 所有输出写到 .harnesson/specs/draft/ | 不写入正式目录 |
| 校验 | 逐项检查格式/版本/内容/结构/唯一性，发现问题立即修复并重新校验 | 不带问题进入用户审核 |
| 审核 | 展示同步计划摘要、校验结果和完整 diff | 不自动转正 |
| 转正 | 移动草稿到正式目录，清理 draft/ | 不删除用户手动编辑的内容 |
```

- [ ] **Step 2: 验证 SKILL.md frontmatter 格式正确**

Run: `head -5 .claude/skills/sync-specs/SKILL.md`
Expected: 看到 `---`、`name: sync-specs`、`description:` 三行

- [ ] **Step 3: 提交**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): rewrite SKILL.md with unified JSON spec tree"
```

---

### Task 3: 端到端验证

**Files:**
- 无新文件，验证已有文件

- [ ] **Step 1: 验证 Skill 文件结构完整**

Run: `find .claude/skills/sync-specs -type f`
Expected:
```
.claude/skills/sync-specs/SKILL.md
.claude/skills/sync-specs/references/node-schema.md
```

- [ ] **Step 2: 验证 SKILL.md 不包含旧内容关键词**

Run: `grep -c "global-spec\|global-spec.md\|business-nodes\|tech-nodes\|mvn test\|src/main/java\|src/test/java" .claude/skills/sync-specs/SKILL.md`
Expected: 0（不应包含旧版 Java/Maven 特定逻辑和双树结构）

- [ ] **Step 3: 验证 SKILL.md 包含新设计的关键元素**

Run: `grep -c "harnesson/specs\|draft/\|自动校验\|syncMeta\|treeScenario\|增量模式\|全量模式" .claude/skills/sync-specs/SKILL.md`
Expected: 大于 0（包含新设计的所有关键概念）

- [ ] **Step 4: 验证 node-schema.md 包含所有必填字段定义**

Run: `grep -c "id.*kebab-case\|syncMeta\|acceptanceCriteria\|testCases\|baseCommit" .claude/skills/sync-specs/references/node-schema.md`
Expected: 大于 0

- [ ] **Step 5: 最终提交（如有格式调整）**

如果前几步验证中发现格式问题并做了修复：
```bash
git add .claude/skills/sync-specs/
git commit -m "fix(sync-specs): address validation issues found in e2e check"
```

如果验证全部通过，无需额外提交。
