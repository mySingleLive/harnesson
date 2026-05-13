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

**叶子节点判定：**

每个业务功能节点都需判断是叶子还是中间节点。判断标准：

一个节点是**叶子节点**，当且仅当它描述的功能满足以下全部条件：
1. 它是一个完整的、用户可独立使用的最小功能单位
2. 继续拆分后，子项将不再是完整的功能（即拆开后用户无法独立使用其中任何一个子项）
3. 节点的 summary 和 goals 中不包含 2+ 个独立用户操作（动词枚举检查）
   - 扫描 summary/goals，提取描述用户操作的动词/动宾短语
   - 若发现"创建、管理、切换"、"新增、编辑、删除"等 2+ 个可独立触发的操作 → 该节点不是叶子，需按操作拆分
4. 代码交叉验证确认无独立实现
   - 检查 sourceFiles 中是否存在独立 API 路由（如 `POST /agents` vs `DELETE /agents/:id`）
   - 检查是否存在独立 UI 组件（如 `CreateSessionModal` vs `SessionSwitcher`）
   - 检查是否存在独立 store action（如 `createSession` vs `deleteSession`）
   - 若代码中存在独立实现 → 该节点不是叶子，需为每个独立实现创建子节点

**原则方向：** 从树根到叶子节点：高层次 → 低层次，抽象 → 具体，模糊 → 明确，大范围 → 小范围。

**动词枚举检查示例：**

| 节点 | summary 中的操作枚举 | 判定 | 拆分结果 |
|------|---------------------|------|----------|
| Agent Session | 创建、管理、切换会话 | 3 个独立操作 → 非叶子 | 创建会话 / 切换会话 / 删除会话 |
| Message Input | 富文本输入、图片上传、键盘快捷键 | 3 个独立操作 → 非叶子 | 文本输入 / 图片上传 / 快捷键操作 |
| 发送消息 | 输入文本并发送给 Agent | 1 个完整操作 → 叶子 | 不拆分 |
| Tool Execution Display | Bash/Read/Write/Edit/Glob/Grep 卡片 | 多个独立工具 → 非叶子 | 每个工具类型一个子节点 |

**未实现节点处理：**
- 代码中有对应实现 → 子节点正常创建，status 由后续步骤自动检测
- 代码中无对应实现 → 仍创建子节点，status 设为 `draft`，summary 中标注"功能待实现"

**叶子节点示例：**
- 打开项目 — 完整的最小功能，拆为"选择文件夹"+"确认"没有独立用户价值
- Bash 命令卡片 — 展示命令执行和结果，用户独立感知的最小单位
- 发送消息 — 用户输入文本并发送给 Agent 的完整操作

**非叶子节点示例（需继续拆分）：**
- 项目管理 → 项目创建、打开项目、克隆项目、删除项目
- 智能工具 → Bash 命令卡片、文件读取卡片、文件编辑卡片、...
- 快捷操作 → 快捷按钮、斜杠命令

**操作级拆分示例（功能→操作层级）：**
- Agent Session → 创建会话、切换会话、删除会话（L4 操作级）
- Tool Execution Display → Bash 卡片、文件读取卡片、文件编辑卡片、文件搜索卡片、代码搜索卡片、...（L4）
- Message Display → 文本消息渲染、思考指示器、用户问答面板（L4）
- Message Input → 文本输入、图片上传、快捷键操作（L4）

### Step 1：扫描项目

**所有模式下都执行。**

1. 读取 `package.json`、`tsconfig.json`（或等效配置）理解项目结构
2. 读取现有规格树（如 `.harnesson/specs/project.json` 存在）
3. 增量模式：执行 `git diff --name-only <baseCommit>..HEAD` 识别变更文件
4. 全量模式：扫描全部源文件目录
5. **递归发现业务节点**：
   a. 从代码结构中识别业务域（按上述节点识别原则）
   b. 对每个业务域，识别其包含的业务功能
   c. 对每个业务功能，检查其是否足够复杂以至于需要子节点来完整描述
   d. 递归重复 c，直到所有叶子节点都是原子级业务功能
   e. 输出完整的节点树结构（id/name/level/parent/children），供 Step 2 使用

   **递归终止条件**：
   按「节点识别原则」中的叶子节点判定标准确定。不设层数上限，层数完全由业务逻辑的自然拆分决定。

**禁止**：此步骤不修改任何文件。

#### 完整性检测（增量模式）

增量模式下，在扫描完成后对每个已有节点执行完整性审计。检测结果汇入 Step 2 同步计划。

**5 项审计：**

| # | 检测项 | 检测内容 | 缺失时的操作 |
|---|--------|---------|-------------|
| 1 | 字段完整性 | 节点 JSON 是否缺少 `specDetail`、`constraints`、`goals`、`acceptanceCriteria` 等字段 | 标记"补全"，Step 3 分析代码生成缺失字段 |
| 2 | 引用完整性 | `design` 指向的文件是否存在；`sourceFiles` 路径是否有效 | design 缺失标记待全量同步修复；路径无效则从 sourceFiles 移除 |
| 3 | 内容新鲜度 | `sourceFiles` 的 git 变更时间是否晚于 `syncMeta.lastSyncAt` | 标记"更新"，Step 3 重新分析变更文件 |
| 4 | 子节点一致性 | 文件系统中存在子节点文件但父节点 `children` 未列出；或 `children` 中有 id 但文件不存在 | 修正 `children` 数组；文件缺失的子节点标记"已废弃" |
| 5 | Design 内容完整性 | `design` 非 null 时，design 文档是否包含 "Specification Details" 和 "Constraints" 章节 | 标记"补全"，Step 3 补充缺失章节 |

### Step 2：生成同步计划

1. 对比现有规格树与代码变更（增量）或全量分析结果
2. 列出需要 新增/更新/删除/补全/不变 的节点，每个节点注明原因和关联文件
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

{节点名} (L{层级}, {操作}){ - 简述}
├── {子节点名} (L{层级}, {操作}){ - 简述}
│   └── ...
└── ...

操作标记：新增、更新、删除、补全、不变。简述可选。

- 补全（gap-fill）：节点已存在，但缺少 specDetail、constraints 等字段或 design 文档不完整。Step 3 仅生成缺失部分，不重写整个节点。

## 详细变更

### {node-id} ({操作})
- 关联文件: {文件路径}
- 变更原因: {描述}
- 预计影响: {需要更新的字段}
```

补全操作在"预计影响"中列出缺失的字段名（如 specDetail、constraints），不列出关联文件变更。

**禁止**：不跳过此步骤直接生成草稿。

### Step 2.5：同步计划 Review（循环直到通过）

对 Step 2 生成的同步计划执行以下 3 项检查。发现问题则修改计划并重新检查，循环直到全部通过。

**检查项：**

1. **代码一致性检查**
   - 计划中每个节点是否与代码实际存在对应
   - 不存在代码中已删除但计划仍标记为「更新/不变」的节点
   - 不存在代码中新增但计划遗漏的节点

2. **叶子节点子节点检测（递归）**
   - 对计划中每个叶子节点，按「节点识别原则」中的叶子节点判定标准检查其是否应为中间节点
   - 判断标准：该节点的功能包含多个用户可独立使用的子功能 → 需要继续拆分为子节点
   - 若需要子节点且计划中未列出 → 添加新子节点到计划中，说明添加原因
   - 对新添加的子节点递归执行同样检查

3. **结构合理性检查**
   - 父子关系是否符合业务域 → 业务功能的层次
   - 不存在技术模块被误判为业务功能（按节点识别原则判断）
   - 同层级节点间无功能重叠

**循环规则：** 发现任何问题 → 修改计划文档 → 从第 1 项重新检查 → 直到 3 项全部通过。

**通过后：** 计划文档标记为已 Review，继续进入 Step 3 生成草稿。

**禁止：** 不带问题进入草稿生成阶段。

### Step 3：生成草稿

1. 按同步计划逐节点生成或更新
2. 分析代码提取每个节点的 summary、goals、design、acceptanceCriteria、testCases、specDetail、constraints
3. 所有输出写入 `.harnesson/specs/draft/` 目录（结构与正式目录一致）

**节点内容生成规则：**
- `summary`：从用户/PM 视角描述该业务功能能做什么，1-3 句话。禁止使用技术术语描述实现方式（如「通过 SSE 推送消息」应改为「实时显示 Agent 回复」）
- `goals`：从用户使用场景推断，描述用户能完成什么目标，每个目标一句话。禁止描述技术实现目标
- `design`：为每个节点生成设计文档（Markdown 格式）并引用其相对路径，详见下方子步骤 3a-3c。无关联源文件时设为 null。
- `acceptanceCriteria`：每个功能至少 1 条 Given/When/Then
- `testCases`：对象格式，包含 `unit-test`、`end-to-end`、`script-test` 三个固定分组键，不可自定义。p0 从验收标准直接转换；p1 从代码分支逻辑补充；p2 从边界条件补充；p3 从兼容性场景补充。用例不再包含 `type` 字段
- `specDetail`：从代码中提取可测试、可量化的规格参数。
  - `description`：用 Markdown 描述功能的详细工作方式。1-3 段。从用户视角说明功能如何运作、涉及哪些 UI 元素或逻辑流程。
  - `parameters`：string 数组，每条一个可量化的规格。优先提取：UI 布局尺寸、字号、颜色代码、间距、最大/最小值、超时时间、字符限制、文件大小限制等。若无明确的规格参数（如纯业务逻辑节点），至少描述 1 个可观测的行为特征。
  - 叶子节点（`isLeaf: true` + 有 `sourceFiles`）必须生成。中间节点可选。
- `constraints`：string 数组，描述功能的边界条件和约束。
  - 覆盖：前置条件（什么情况下功能可用）、后置条件（功能完成后系统状态）、不变条件（始终成立）、适用场景、不适用场景、错误条件（什么输入/状态下会报错）
  - 每条一句话。叶子节点至少 1 条。中间节点可选。

**语言规则：** 检测项目主要语言（代码注释、README、现有文档），规格内容跟随项目语言。

3a. 按以下子步骤为每个节点生成设计文档：

   a. **检测节点类型**：如果节点的 `syncMeta.sourceFiles` 为空且节点不是根节点（level > 1），跳过设计文档生成，`design` 设为 null。根节点（level=1）始终生成 project 类型的设计文档。否则，根据 `references/design-doc-templates.md` 中的规则，分析 `sourceFiles` 自动判断节点类型（project/frontend/backend/fullstack）

   b. **生成设计文档**：按节点类型选择对应模板，从代码中提取事实填充各章节。文件写入 `.harnesson/specs/draft/design/{node-path}.md`
     - 根节点 → `draft/design/project.md`
     - L2 节点 → `draft/design/{id}.md`
     - L3+ 节点 → `draft/design/{ancestor-path}/{id}.md`（从 L2 起逐级拼接父节点 id，路径结构与 nodes/ 目录对应。例：L4 节点 `ai-chat/message-input/text-input-send.md`）

   c. **设置 design 字段**：节点 JSON 中 `design` 字段设为相对路径字符串，如根节点为 `"design/project.md"`，L3 节点为 `"design/ai-chat/message-input.md"`

   d. **渲染 specDetail 和 constraints 到设计文档**：节点有 `specDetail` 或 `constraints` 时，在设计文档末尾追加对应章节。

      **Specification Details 章节：**
      
      ```markdown
      ## Specification Details
      
      {specDetail.description}
      
      ### Parameters
      
      - {parameter 1}
      - {parameter 2}
      ```
      
      若 `specDetail` 为 null 或空对象 → 跳过此章节。
      
      **Constraints 章节：**
      
      ```markdown
      ## Constraints
      
      - {constraint 1}
      - {constraint 2}
      ```
      
      若 `constraints` 为 null 或空数组 → 跳过此章节。

   e. **补全操作（仅增量）**：同步计划中标记为"补全"的节点，只生成缺失字段并合并到现有 JSON 和 design 文档，不重写整个文件。
      - JSON：读取现有文件，处理缺失字段——若字段完全不存在则新增，若已存在则保留不变。数组字段（如 `parameters`、`constraints`）按条目比对：新条目追加到现有数组末尾，已有条目不变
      - Design：若缺失 "Specification Details" 或 "Constraints" 章节，追加到文档末尾；已存在的章节不重写

**禁止**：不写入 `.harnesson/specs/` 正式目录（除 draft/ 外）。

### Step 4：自动校验（循环直到通过）

对 `.harnesson/specs/draft/` 中的所有草稿文件执行以下 6 项校验。发现问题则修改草稿并重新校验，循环直到全部通过。

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
   - 业务域划分合理：同一业务域的功能归在同一父节点下（按节点识别原则判断）
   - 不存在技术模块被误分为独立节点：所有节点必须通过「用户是否直接感知」判断（按节点识别原则）
   - 不存在功能重叠：两个不同节点不应描述完全相同的功能

5. **唯一性校验**
   - 同一层级（同一 parent 下）不存在重复的 name
   - 同一层级不存在语义重复的 summary
   - 跨层级允许相似描述（不同抽象层次），但需标记为合理

6. **设计文档校验**
   - 节点的 `design` 非 null 时，引用的文件在 `draft/design/` 中必须存在
   - 设计文档文件不能为空
   - 文件命名与节点路径结构一致（如 `ai-chat/message-input.md` 对应 `nodes/ai-chat/message-input/index.json`）

**循环规则：** 发现任一问题 → 修改草稿文件 → 从第 1 项重新校验 → 直到 6 项全部通过。

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
   - 按「节点识别原则」中的叶子节点判定标准，检查每个叶子节点是否应继续拆分
   - 同时检查关联的源文件（`syncMeta.sourceFiles`），识别是否有独立的业务功能实现缺少对应的规格节点
   - 判断标准：该节点包含多个用户可独立使用的子功能，但当前节点树中没有对应的子节点来描述它们
   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿

**循环规则：** 发现任一问题 → 修改草稿或添加新节点 → 回到 Step 4 重新校验 → 再回到本步重新检查 → 直到 3 项全部通过。

#### 5.1 用户确认

通过覆盖度检查后：

1. 展示同步计划摘要（来自 Step 2）
2. 展示校验结果摘要（来自 Step 4）
3. 展示覆盖度检查结果摘要（来自 5.0）
4. 对每个变更节点，展示草稿与现有文件的 diff（新增节点展示完整内容）
5. 对每个 `design` 非 null 的变更节点，展示其设计文档的完整内容（新增）或 diff（更新）
6. 等待用户确认

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

1a. 将 `.harnesson/specs/draft/` 中的所有文件移动到 `.harnesson/specs/` 对应位置
1b. 将 `.harnesson/specs/draft/design/` 中的所有设计文档移动到 `.harnesson/specs/design/` 对应位置
2. 清理 `.harnesson/specs/draft/` 目录
3. 更新根节点的 syncMeta（lastSyncAt 设为当前时间）

**禁止**：不删除用户在正式文件中手动编辑的内容。增量模式下，未变更的节点文件保持不变。同样禁止删除用户在正式 `design/` 目录中手动编辑的内容，增量模式下未变更节点的设计文档保持不变。

---

## 存储结构

### 文件布局

```
.harnesson/
├── specs/
│   ├── project.json                          # 根节点（level 1）
│   ├── nodes/                                # 所有非根节点
│   │   ├── {kebab-case-name}.json           # 无子节点的叶子节点
│   │   ├── {kebab-case-name}/               # 有子节点时用目录组织
│   │   │   ├── index.json                   # 自身节点
│   │   │   ├── {child-name}.json           # 直接子节点
│   │   │   └── {child-name}/               # 子节点还有子节点时递归
│   │   └── ...
│   ├── design/                               # 设计文档
│   │   ├── project.md                        # 根节点设计文档
│   │   └── {node-path}.md                    # 与 nodes/ 路径结构对应
│   ├── draft/                                # 草稿目录（审核中，结构同上）
│   │   ├── ...
│   │   └── design/                           # 草稿设计文档（结构同上）
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
  "design": "design/path/to/doc.md",
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
6. 设计文档随节点同步：节点无变更时设计文档不重新生成，节点有变更时重新生成设计文档覆盖旧文件

---

## Agent 行为规则

| 阶段 | 必须做 | 不能做 |
|------|--------|--------|
| 扫描 | 读取 package.json/tsconfig 理解项目结构 | 不修改任何文件 |
| 计划 | 生成 Markdown 同步计划（树形变更概览）到 .harnesson/specs/sync-plans/ | 不跳过用户确认 |
| 计划 Review | 自检测计划与代码一致性、按叶子判定标准递归检查节点拆分、检查结构合理性 | 不带问题进入草稿生成阶段 |
| 草稿 | 所有输出写到 .harnesson/specs/draft/（含设计文档到 draft/design/） | 不写入正式目录 |
| 校验 | 逐项检查格式/版本/内容/结构/唯一性/设计文档，发现问题立即修复并重新校验 | 不带问题进入覆盖度审查 |
| 覆盖度审查 | 检查验收标准覆盖 goals、测试用例覆盖分支/边界、检测缺失子节点 | 不带覆盖度问题进入用户审核 |
| 审核 | 展示同步计划摘要、校验结果、覆盖度检查结果和完整 diff | 不自动转正 |
| 转正 | 移动草稿到正式目录（含 design/），清理 draft/ | 不删除用户手动编辑的内容 |
