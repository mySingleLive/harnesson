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

### 节点识别原则

规格树的节点按**业务域/业务功能**组织，而非技术模块。判断标准：问「谁用、为什么用」而非「怎么实现」。

**三类识别对象：**

| 类型 | 判断问题 | 说明 |
|------|---------|------|
| 业务域节点 | *用户是否直接感知并使用这个功能？* | 对应用户/PM 能理解的功能分区。识别时必须明确说明该域能做什么 |
| 业务功能节点 | *用户能否独立描述这个功能，且它是否跨越多个技术模块？* | 对应一个完整的用户操作或产品能力。识别时必须明确说明该功能具体能做什么 |
| 技术模块（不应成为节点） | *用户是否完全不感知这个模块的存在？* | 内部实现层拆分，归入对应的业务功能节点描述 |

**正面示例（应成为节点）：**

| 节点 | 类型 | 说明 |
|------|------|------|
| AI 对话 | 业务域 | 用户直接使用对话功能，包含前端输入、消息渲染、后端 Agent 调度 |
| 项目管理 | 业务域 | 用户创建/管理项目，涉及 CRUD API、数据库、前端表单 |
| 商品搜索 | 业务功能 | 用户执行搜索操作，涉及搜索引擎、API、搜索栏组件 |
| 规格图谱 | 业务域 | 用户可视化浏览项目规格，涉及 ReactFlow、图谱数据、同步引擎 |

**反面示例（不应成为独立节点）：**

| 节点 | 问题 | 正确归属 |
|------|------|---------|
| agent-adapter | 纯技术接口定义，用户不感知 | 属于「AI 对话」域内部实现 |
| agent-streaming | SSE 通信机制，是 AI 对话的实现细节 | 属于「AI 对话」域内部实现 |
| graph-storage | 数据库存储层，是规格管理的实现细节 | 属于「规格图谱」域内部实现 |

**例外：** 当技术模块足够复杂且被多个业务功能复用时，可作为「共享基础设施」域下的功能节点，但仍以功能名命名（如「Agent 会话管理」而非 `agent-service`）。

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
3. 写入 Markdown 同步计划到 `.harnesson/specs/sync-plans/{YYYY-MM-DD}-{mode}-sync-plan.md`

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
- `testCases`：对象格式，包含 `unit-test`、`end-to-end`、`script-test` 三个固定分组键，不可自定义。p0 从验收标准直接转换；p1 从代码分支逻辑补充；p2 从边界条件补充；p3 从兼容性场景补充。用例不再包含 `type` 字段

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
   - testCases 为对象，包含 `unit-test`、`end-to-end`、`script-test` 三个固定键，每个值为数组；用例不含 `type` 字段
   - status 为以下枚举值之一：draft, backlog, todo, in-progress, review, testing, dev-done, released

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

#### 5.0 覆盖度自动审查（循环直到通过）

在展示给用户之前，先对每个草稿节点执行以下 3 项覆盖度检查。发现问题则修改草稿并重新校验（回到 Step 4），循环直到全部通过。

**覆盖度检查项：**

1. **验收标准覆盖度**
   - 验收标准必须覆盖该节点 `goals` 中每个目标的所有可能性
   - 判断标准：如果所有 acceptanceCriteria 的 `then` 都成立，该功能应能正常运行
   - 若某个 goal 的关键场景没有对应的验收标准 → 补充验收标准

2. **测试用例覆盖度**
   - testCases 必须覆盖所有 acceptanceCriteria（每个验收标准至少有 1 个对应 p0 用例）
   - 此外还需覆盖代码中所有可能的分支路径（p1）和边界条件（p2）
   - 若验收标准无对应测试用例，或代码分支/边界未被覆盖 → 补充测试用例

3. **子节点完整性检测**
   - 检查该节点关联的源文件（`syncMeta.sourceFiles`），识别是否有独立且足够复杂的功能模块缺少对应的规格节点
   - 判断标准：存在独立的实现代码（独立组件、独立路由、独立服务类等）但当前节点树中没有对应的子节点来描述它
   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿

**循环规则：** 发现任一问题 → 修改草稿或添加新节点 → 回到 Step 4 重新校验 → 再回到本步重新检查 → 直到 3 项全部通过。

#### 5.1 用户确认

通过覆盖度检查后：

1. 展示同步计划摘要（来自 Step 2）
2. 展示校验结果摘要（来自 Step 4）
3. 展示覆盖度检查结果摘要（来自 5.0）
4. 对每个变更节点，展示草稿与现有文件的 diff（新增节点展示完整内容）
5. 等待用户确认

用户可能：
- **确认通过** → 按以下规则设置每个节点的 status，然后进入 Step 6
  - 代码在 main/master 分支 + 所有测试通过 → `released`
  - 测试脚本存在但未全部通过 → `testing`
  - 代码部分实现 或 仅在功能分支上（非 main） → `in-progress`
  - 代码中存在 TODO/FIXME 注解标记该功能 → `backlog`
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
│   ├── draft/                                # 草稿目录（审核中，结构同上）
│   └── sync-plans/                           # 同步计划
│       └── {YYYY-MM-DD}-{mode}-sync-plan.md
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
  "testCases": {
    "unit-test": [],
    "end-to-end": [
      { "level": "p0", "given": "...", "when": "...", "then": "..." }
    ],
    "script-test": []
  },
  "status": "released",
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
| 计划 | 生成 Markdown 同步计划到 .harnesson/specs/sync-plans/ | 不跳过用户确认 |
| 草稿 | 所有输出写到 .harnesson/specs/draft/ | 不写入正式目录 |
| 校验 | 逐项检查格式/版本/内容/结构/唯一性，发现问题立即修复并重新校验 | 不带问题进入覆盖度审查 |
| 覆盖度审查 | 检查验收标准覆盖 goals、测试用例覆盖分支/边界、检测缺失子节点 | 不带覆盖度问题进入用户审核 |
| 审核 | 展示同步计划摘要、校验结果、覆盖度检查结果和完整 diff | 不自动转正 |
| 转正 | 移动草稿到正式目录，清理 draft/ | 不删除用户手动编辑的内容 |
