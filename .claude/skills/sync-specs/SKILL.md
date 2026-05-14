---
name: sync-specs
description: 扫描项目代码，同步生成标准化的 JSON 规格树。支持增量同步（默认）和全量同步（--full）。当用户输入 /sync-specs、/sync-specs --full，或要求同步项目规格、生成功能规格、更新规格树时触发。
---

# Sync Specs

将项目代码分析结果同步为标准化的 JSON 规格树。

## 触发

- `/sync-specs` → 自动判断模式
- `/sync-specs --full` → 强制全量

## 模式判断

1. `.harnesson/specs/project.json` 不存在 → **全量模式**
2. 用户传入 `--full` → **全量模式**
3. 否则 → **增量模式**

## 流程

严格按以下步骤顺序执行。

### 节点识别原则

规格树节点按**业务域/业务功能**组织。判断标准：问「谁用、为什么用」而非「怎么实现」。

| 类型 | 判断问题 |
|------|---------|
| 业务域节点 | 用户是否直接感知并使用这个功能？ |
| 业务功能节点 | 用户能否独立描述这个功能，且它跨越多个技术模块？ |
| 技术模块（不可独立） | 用户是否完全不感知这个模块的存在？ → 归入对应业务功能 |

**叶子节点判定**（优先使用前后端标准，无法确定时默认非叶子并继续拆解）：

**前端（UI）叶子** — 满足任一即为叶子：
1. 用户触发的一次操作（点击按钮、展开/收起树、键盘输入等）所执行的单一功能
2. 足够简单、无复杂功能的组件
3. 多个相同类型的子组件或子功能可合并为一个（如表单中多个输入框的输入和校验合并为一个）

**后端叶子** — 满足任一即为叶子：
1. 由 API 触发的一个业务功能
2. 可被外部触发的功能（定时任务、Hooks、AI Function Call、Skills 等）

**跨前后端功能**：按子项目拆为前端节点和后端节点，共享同一父节点。

**无法确定时**：假定为非叶子，继续拆解子节点；若无法再拆解，则判定为叶子。

**Fallback**（前后端标准均无法判定时）：参考独立性三条件 — 全部不满足才为叶子：
1. 用户能否只使用其中一个，而不关心另一个？
2. 它们是否出现在不同的 UI 区域或不同的使用场景？
3. 去掉其中一个后，另一个是否仍然是完整可用的？

**未实现节点**：代码中有对应 → 正常创建；代码中无对应 → status 设为 `draft`，summary 标注"功能待实现"。

详细示例见 `references/node-identification-examples.md`。

### Step 1：扫描与变更分析

**所有模式下都执行。此步骤不修改任何文件。**

1. 读取 `package.json`、`tsconfig.json`（或等效配置）理解项目结构
2. 读取现有规格树（如 `.harnesson/specs/project.json` 存在）

**增量模式：**
3. 执行 `git diff --name-only <baseCommit>..HEAD` 识别变更文件
4. 将变更文件匹配到节点（通过 `syncMeta.sourceFiles`）
5. 对每个受影响节点执行 5 项完整性审计：
   - 字段完整性：是否缺少 specDetail、constraints、goals、acceptanceCriteria
   - 引用完整性：design 文件是否存在；sourceFiles 路径是否有效
   - 内容新鲜度：sourceFiles git 变更时间 > lastSyncAt → 标记更新
   - 子节点一致性：children 数组与文件系统是否一致
   - Design 内容完整性：design 文档是否含 "Specification Details" 和 "Constraints" 章节
6. 输出变更清单（新增/更新/删除/补全/不变），写入 `draft/README.md`

**全量模式：**
3. 扫描全部源文件目录
4. **递归识别业务节点**（按节点识别原则），对每层节点执行以下子步骤：
   a) 识别当前层级的业务域/业务功能节点
   b) 枚举该节点的所有 sourceFiles，**逐文件读取源码**，识别其中实现的用户可感知功能：
      - 页面/视图组件（*Page.tsx、*View.tsx）→ 分析其包含的独立功能区域
      - 模态框/对话框（*Modal.tsx、*Dialog.tsx、*Drawer.tsx）→ 通常对应一个独立操作
      - 表单组件（*Form.tsx）→ 通常对应一个独立操作
      - API 路由文件 → 分析每个 handler 是否对应独立功能
      - 复杂组件（文件较大或渲染多个子区域）→ 分析其内部的独立子功能/子组件
      - Store/Hook/工具/类型文件 → 非独立功能，归入父节点
   c) 对步骤 b 中发现的每个功能，按前后端叶子判定标准判断是否应成为独立子节点
   d) 为通过独立性判断的功能创建子节点，从父节点的 sourceFiles 中分配对应文件
   e) 对新子节点递归执行 a-e，直到所有节点无法再拆分
5. **叶子审计**（强制，对每个候选叶子节点执行）：
   - 读取该节点的每个 sourceFile，**从源码中枚举**所有用户可感知的功能/操作/子组件
   - 对枚举出的功能列表按前后端叶子判定标准分析。无法确定时假定为非叶子并继续拆解；若无法再拆解，则判定为叶子
   - 在 `draft/README.md` 中记录审计表格：节点 | 源码中发现的独立功能列表 | 判定分析（引用前后端标准） | 判定
   - 发现非叶子 → 立即补充子节点 → 对新子节点递归执行步骤 4
   - 所有节点通过审计后才继续
6. 输出完整节点树结构，写入 `draft/README.md`

**自检（思维中完成）：**
- 每个节点是否与代码实际对应（无孤儿、无遗漏）
- 叶子节点是否通过前后端叶子判定标准审查
- 父子关系是否符合业务域→业务功能层次
- 发现问题立即修正变更清单，不进入 Step 2

### Step 2：生成草稿

所有输出写入 `.harnesson/specs/draft/`。禁止写入正式目录。

#### 2a — 生成节点 JSON

对变更清单中每个节点：

1. 分析 `syncMeta.sourceFiles` 提取事实

2. **生成描述性字段**（基于源代码分析）：
   - `summary`：用户视角，1-3 句，禁止技术术语
   - `goals`：用户目标列表，每个一句话，禁止技术实现描述
   - `specDetail`（叶子节点 + 有 sourceFiles 时）：`description`（Markdown，1-3 段用户视角）+ `parameters`（string[]，≥1 条，覆盖 UI/数据/行为维度）
   - `constraints`（叶子节点 + 有 sourceFiles 时）：string[]，≥3 条（适用场景/不适用场景/错误条件各 1）

3. **基于已生成的 goals + specDetail + constraints，生成验收标准**：
   - `acceptanceCriteria`：至少 1 条 Given/When/Then
   - 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件

4. 设置 `design`：设计文档相对路径（见 2b）

5. 写入 `draft/nodes/{path}.json`

**补全操作（仅增量）：** 从正式目录读现有 JSON → 仅填充缺失字段 → 已有字段不变。数组字段按条目比对，新条目追加到末尾。

#### 2b — 生成设计文档

对每个 `sourceFiles` 非空或 level=1 的节点：

1. 根据 sourceFiles 判定类型（project/frontend/backend/fullstack，规则见 `references/design-doc-templates.md`）
2. 按类型从代码提取事实填充模板章节，无内容的章节省略
3. 若有 `specDetail` → 末尾追加 "## Specification Details" 和 "### Parameters" 章节
4. 若有 `constraints` → 末尾追加 "## Constraints" 章节
5. 写入 `draft/design/{path}.md`，路径结构与 `draft/nodes/` 对应
6. 节点 JSON 中 `design` 设为相对路径（如 `"design/ai-chat/message-input.md"`）

sourceFiles 为空且 level>1 的节点 → `design` 设为 null，跳过设计文档生成。

### Step 3：统一校验

对 `draft/` 中所有文件逐节点检查。发现问题 → 修复当前节点 → 继续下一个。全部完成后仅复查修复过的项。不再回退到 Step 2。

**6 项校验：**

**1. 格式校验**
- JSON 可正确解析
- 必填字段存在且类型正确：id, name, level, parent, children, isLeaf, summary, status, syncMeta
- id 为 kebab-case，children 为数组，叶子节点 children 为空
- status 为枚举值：draft/backlog/todo/in-progress/review/testing/dev-done/released

**2. 版本校验**
- syncMeta.baseCommit 与当前 HEAD 一致
- 根节点 syncMeta.branch 正确

**3. 内容校验**（含 specDetail/constraints 完整性）
- summary/goals 与 sourceFiles 实际实现一致，无代码已删除但标记为已实现的功能
- 叶子节点（isLeaf: true + sourceFiles 非空）：specDetail 非 null，description 非空，parameters ≥ 1 条可量化规格（不全是模糊描述）；constraints 非 null/空，每条非空
- parameters 覆盖 UI/数据/行为至少 3 个维度（如功能涉及），不适用维度在 description 中说明
- constraints 覆盖适用场景/不适用场景/错误条件

**4. 唯一性校验**
- 同 parent 下无重复 name 和语义重复 summary
- 跨层级允许相似描述（不同抽象层次）

**5. 设计文档校验**（含 JSON↔MD 一致性）
- design 非 null → 文件在 draft/design/ 中存在且非空
- 文件命名与节点路径一致
- specDetail.description 与设计文档 "Specification Details" 段落一致
- constraints 各条目与设计文档 "Constraints" 列表一致
- 若设计文档缺少对应章节 → 补充渲染

**6. 覆盖度与叶子复核**
- 验收标准覆盖所有 goals 的关键场景（所有 acceptanceCriteria 的 then 成立时功能正常运行）
- acceptanceCriteria 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件
- **叶子复核**：对每个叶子节点，读取其 sourceFiles 源码，枚举其中实现的用户可感知功能。如果发现多个功能 → 按前后端叶子判定标准判断是否需拆分，回到 Step 2 补充子节点
- 叶子节点再次检查前后端判定标准。无法确定时假定为非叶子并继续拆解；若无法再拆解，则判定为叶子

### Step 4：用户审核

1. 展示变更摘要（来自 `draft/README.md`）和校验结果（通过项数/总项数）
2. 对每个变更节点展示新旧 diff（新增节点展示完整内容，含设计文档）
3. 等待用户确认

用户可确认通过、要求修改（修改草稿 → 回 Step 3）、或拒绝（保留 draft/ 供参考）。

确认通过后，按以下规则设置每个节点 status：
- 代码在 main/master + 测试通过 → `released`
- 测试脚本存在但未全部通过 → `testing`
- 代码部分实现或在功能分支 → `in-progress`
- 代码中有 TODO/FIXME → `backlog`

### Step 5：转正

1. 将 `draft/` 所有文件移动到 `specs/` 对应位置（含 `draft/design/` → `specs/design/`）
2. 清理 `draft/` 目录
3. 更新根节点 `syncMeta.lastSyncAt`

增量模式下未变更节点文件保持不变。

---

## 存储结构

```
.harnesson/specs/
├── project.json                     # 根节点（level 1）
├── nodes/                           # 非根节点
│   └── {id}.json                    # 叶子节点，或
│   └── {id}/index.json              # 中间节点（有子节点时用目录）
│       └── {child-id}.json          # 子节点，递归展开
├── design/                          # 设计文档，路径结构与 nodes/ 对应
│   └── {path}.md
├── draft/                           # 草稿（审核中，结构同上）
│   ├── README.md                    # 变更清单
│   └── design/
└── sync-plans/                      # 历史同步计划（保留目录，优化后不再新增）
```

## 节点 Schema

所有节点共享统一 JSON 结构。详细字段说明见 `references/node-schema.md`（按需加载）。

核心字段：id, name, level, parent, children, isLeaf, summary, goals, design, acceptanceCriteria, specDetail, constraints, status, syncMeta

根节点额外字段：treeDepth（整数）、treeScenario（single/flat/multi-functional/multi-domain）

## 增量模式说明

- 仅变更节点读取 JSON 和设计文档内容（未变更节点仅读 children 数组做结构校验）
- 设计文档随节点同步：节点无变更 → 不重新生成；节点有变更 → 重新生成覆盖旧文件
- 补全操作为增量特有：仅生成缺失字段，不重写整个节点
