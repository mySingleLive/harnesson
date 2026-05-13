# Sync-Specs Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite sync-specs SKILL.md (500→~240 lines) with restructured flow (8 steps/3 loops → 5 steps/1 loop) and simplified references.

**Architecture:** Single-pass rewrite of SKILL.md with 8 sequential tasks. Each task produces a self-contained section. Final assembly task stitches sections together and verifies line count and completeness against the design spec.

**Tech Stack:** Markdown skill files, no code dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `.claude/skills/sync-specs/SKILL.md` | Rewrite | Main skill instructions: trigger, mode detection, 5-step flow, storage structure, incremental notes |
| `.claude/skills/sync-specs/references/design-doc-templates.md` | Simplify | Compress 4 templates, remove verbose section descriptions |
| `.claude/skills/sync-specs/references/node-schema.md` | No change | Already reference-only, loaded on demand |

---

### Task 1: Write header + mode detection section

**Files:**
- Create: (none — content assembled in final task)
- Read: `.claude/skills/sync-specs/SKILL.md:1-23` (existing header for reference)

- [ ] **Step 1: Write the frontmatter, trigger, and mode detection section**

Content to write:

```markdown
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
```

- [ ] **Step 2: Verify** — Confirm section is ~18 lines (down from ~23). Check against design spec "触发/模式判断" row in the reduction table.

---

### Task 2: Write node identification principles (condensed)

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:28-105` (existing node principles for reference)

- [ ] **Step 1: Write the condensed node identification section**

Content to write (replaces lines 28-105, condensing ~78 lines to ~35):

```markdown
## 节点识别原则

规格树节点按**业务域/业务功能**组织。判断标准：问「谁用、为什么用」而非「怎么实现」。

| 类型 | 判断问题 |
|------|---------|
| 业务域节点 | 用户是否直接感知并使用这个功能？ |
| 业务功能节点 | 用户能否独立描述这个功能，且它跨越多个技术模块？ |
| 技术模块（不可独立） | 用户是否完全不感知这个模块的存在？ → 归入对应业务功能 |

**叶子节点判定**（满足全部条件）：
1. 用户可独立使用的最小完整功能
2. 继续拆分后子项不再完整
3. summary/goals 不含 2+ 个独立用户操作（动词枚举：创建、删除、切换等）
4. sourceFiles 中无独立 API 路由/UI 组件/store action 对应子功能

**未实现节点**：代码中有对应 → 正常创建；代码中无对应 → status 设为 `draft`，summary 标注"功能待实现"。

详细示例见 `references/node-identification-examples.md`。
```

- [ ] **Step 2: Create the examples reference file** — Move 4 detailed example tables (positive, negative, verb enumeration, leaf/non-leaf examples) to `.claude/skills/sync-specs/references/node-identification-examples.md` so they don't consume main skill context.

- [ ] **Step 3: Verify** — Count lines: target ~35 for principles + examples file. Check that all 4 example categories (正面/反面/叶子/非叶子/动词枚举) are preserved in the reference.

---

### Task 3: Write new Step 1 — Scan + Change Analysis

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:106-207` (existing Step 1 + Step 2 + Step 2.5 for reference)

- [ ] **Step 1: Write the merged Step 1**

Content to write (replaces lines 106-207, merging Steps 1+2+2.5, ~30 lines):

```markdown
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
6. 输出变更清单（新增/更新/删除/补全/不变），写入 `draft/README.md` 作为草稿说明

**全量模式：**
3. 扫描全部源文件目录
4. 递归识别业务节点（按节点识别原则）
5. 递归判定叶子节点（按叶子节点判定标准）
6. 输出完整节点树结构，写入 `draft/README.md`

**自检（思维中完成）：**
- 每个节点是否与代码实际对应（无孤儿、无遗漏）
- 叶子节点是否需要继续拆分
- 父子关系是否符合业务域→业务功能层次
- 发现问题立即修正变更清单，不进入 Step 2
```

- [ ] **Step 2: Verify** — Confirm ~30 lines, covers all audit items from old Step 1, merge logic from old Step 2, and self-check from old Step 2.5. No sync-plan file is generated.

---

### Task 4: Write new Step 2 — Draft Generation (2 sub-steps)

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:210-275` (existing Step 3 for reference)

- [ ] **Step 1: Write the compressed Step 2**

Content to write (replaces lines 210-275, compressing 5 sub-steps to 2, ~40 lines):

```markdown
### Step 2：生成草稿

所有输出写入 `.harnesson/specs/draft/`。禁止写入正式目录。

#### 2a — 生成节点 JSON

对变更清单中每个节点：

1. 分析 `syncMeta.sourceFiles` 提取事实
2. 生成字段：
   - `summary`：用户视角，1-3 句，禁止技术术语
   - `goals`：用户目标列表，每个一句话，禁止技术实现描述
   - `design`：设计文档相对路径（见 2b）
   - `acceptanceCriteria`：至少 1 条 Given/When/Then
   - `testCases`：对象，含 `unit-test`/`end-to-end`/`script-test` 三个固定键。p0 从验收标准转换；p1 分支覆盖；p2 边界条件；p3 兼容性
   - `specDetail`（叶子节点 + 有 sourceFiles 时）：`description`（Markdown，1-3 段用户视角）+ `parameters`（string[]，≥1 条，覆盖 UI/数据/行为维度）
   - `constraints`（叶子节点 + 有 sourceFiles 时）：string[]，≥3 条（适用场景/不适用场景/错误条件各 1）
3. 写入 `draft/nodes/{path}.json`

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
```

- [ ] **Step 2: Verify** — Confirm ~40 lines vs ~75 lines original. Check that 补全 logic, specDetail/constraints generation, and design doc rendering are all covered.

---

### Task 5: Write new Step 3 — Unified Validation

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:277-369` (existing Step 4 + 5.0 for reference)

- [ ] **Step 1: Write the unified Step 3**

Content to write (replaces lines 277-369, merging old Step 4 + 5.0, ~50 lines):

```markdown
### Step 3：统一校验

对 `draft/` 中所有文件逐节点检查。发现问题 → 修复当前节点 → 继续下一个。全部完成后仅复查修复过的项。不再回退到 Step 2。

**6 项校验：**

**1. 格式校验**
- JSON 可正确解析
- 必填字段存在且类型正确：id, name, level, parent, children, isLeaf, summary, status, syncMeta
- id 为 kebab-case，children 为数组，叶子节点 children 为空
- status 为枚举值：draft/backlog/todo/in-progress/review/testing/dev-done/released
- testCases 含 unit-test/end-to-end/script-test 三个固定键，用例不含 type 字段

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

**6. 覆盖度审查**
- 验收标准覆盖所有 goals 的关键场景（所有 acceptanceCriteria 的 then 成立时功能正常运行）
- testCases 覆盖所有验收标准（p0）+ 代码分支路径（p1）+ 边界条件（p2）
- 叶子节点再次检查：是否包含 2+ 个独立子功能 → 补充子节点，回到 Step 2 生成草稿
```

- [ ] **Step 2: Verify** — Confirm ~50 lines vs ~93 original. Check all 6 items are present, deduplication is correct, and the "no fallback to Step 2" rule is clear (except for item 6 sub-node discovery).

---

### Task 6: Write new Steps 4+5 — Review + Publish

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:370-399` (existing Step 5.1 + 6 for reference)

- [ ] **Step 1: Write streamlined Steps 4+5**

Content to write (replaces lines 370-399, ~20 lines):

```markdown
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
```

- [ ] **Step 2: Verify** — Confirm ~20 lines. Check status auto-detection rules preserved, publish steps complete.

---

### Task 7: Write supporting sections (storage, schema, incremental notes)

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md:403-500` (existing storage, schema, incremental notes, behavior rules for reference)

- [ ] **Step 1: Write condensed supporting sections**

Content to write (~50 lines total):

```markdown
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

核心字段：id, name, level, parent, children, isLeaf, summary, goals, design, acceptanceCriteria, testCases, specDetail, constraints, status, syncMeta

根节点额外字段：treeDepth（整数）、treeScenario（single/flat/multi-functional/multi-domain）

## 增量模式说明

- 仅变更节点读取 JSON 和设计文档内容（未变更节点仅读 children 数组做结构校验）
- 设计文档随节点同步：节点无变更 → 不重新生成；节点有变更 → 重新生成覆盖旧文件
- 补全操作为增量特有：仅生成缺失字段，不重写整个节点
```

- [ ] **Step 2: Verify** — Confirm ~50 lines vs ~100 original. Check that all essential info (file layout, schema fields, incremental rules) is preserved.

---

### Task 8: Simplify design-doc-templates.md

**Files:**
- Modify: `.claude/skills/sync-specs/references/design-doc-templates.md` (123 lines → ~70 lines)

- [ ] **Step 1: Write simplified templates**

Content to write:

```markdown
# 设计文档模板

根据节点类型自动选择模板。有内容的章节保留，无内容的章节省略。

## 节点类型检测

占比按源文件数量计算。扩展名不在识别范围内的文件不计入分母。

| 类型 | 判断规则 |
|------|---------|
| project | 根节点（level=1） |
| frontend | 前端文件占比 ≥ 80%（.tsx/.jsx/.vue/.css/.scss/.less，或 components/pages/hooks 目录） |
| backend | 后端文件占比 ≥ 80%（routes/services/models/controllers/middleware 目录，或 .go/.java/.py） |
| fullstack | 前后端混合，任一侧不足 80% |

无法判定时默认 fullstack。中间节点生成业务域总体概述；叶子节点聚焦该功能点。

## 模板

章节标题固定，无内容则跳过。从代码提取事实，不捏造。

### project — 项目架构

技术栈 / 设计原则 / 编码规范 / 架构图（Mermaid 或文字） / 项目结构 / 关键模块 / 部署架构

### frontend — 前端设计

布局 / 路由与导航 / 组件树 / 样式与主题 / 交互方式 / 状态管理

### backend — 后端设计

API 设计（方法/路径/请求体/响应体表格） / 数据库表结构 / 业务流程（Mermaid 或文字） / 中间件/拦截器 / 认证与授权 / 错误处理

### fullstack — 全栈设计

架构概览（前后端协作方式） / 前端设计（按需裁剪） / 后端设计（按需裁剪）

## 生成原则

1. 从代码提取事实，不捏造
2. 代码路径、API 路径等具体信息与源文件一致
3. Mermaid 图能用则用，否则文字描述
4. 设计文档长度与功能复杂度匹配
```

- [ ] **Step 2: Verify** — Confirm ~70 lines vs ~123 original. Check all 4 templates preserved, node type detection rules intact.

---

### Task 9: Assemble, review, and verify final SKILL.md

**Files:**
- Write: `.claude/skills/sync-specs/SKILL.md` (assemble from Tasks 1-7)

- [ ] **Step 1: Assemble the complete SKILL.md** by concatenating output from Tasks 1-7 in order

- [ ] **Step 2: Verify line count** — Target ~240 lines. Count with `wc -l`. Acceptable range: 220-260.

- [ ] **Step 3: Verify completeness against design spec** — Check each requirement:
  - [ ] 5-step flow (not 8)
  - [ ] 1 validation loop (not 3)
  - [ ] Step 1 merges scan + plan + review
  - [ ] Step 2 has 2 sub-steps (not 5)
  - [ ] Step 3 has 6 checks (not 10)
  - [ ] No sync-plan file generation
  - [ ] draft/ safety net preserved
  - [ ] JSON↔MD consistency check preserved
  - [ ] Incremental mode skips unchanged nodes
  - [ ] specDetail/constraints generation rules preserved
  - [ ] 补全 (gap-fill) logic preserved for incremental
  - [ ] Status auto-detection rules preserved

- [ ] **Step 4: Review for internal consistency** — Read through assembled SKILL.md:
  - [ ] No references to deleted steps (Step 2.5, Step 5.0, sync-plans/)
  - [ ] Step numbering is sequential (1→2→3→4→5)
  - [ ] All referenced files exist (references/node-schema.md, references/design-doc-templates.md, references/node-identification-examples.md)
  - [ ] No orphaned cross-references

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md \
        .claude/skills/sync-specs/references/design-doc-templates.md \
        .claude/skills/sync-specs/references/node-identification-examples.md
git commit -m "perf(sync-specs): streamline skill from 500→240 lines, 8→5 steps, 3→1 validation loop"
```
```

### Task 10: Final cleanup and verification

- [ ] **Step 1: Verify node-schema.md needs no changes** — Read the file, confirm all referenced fields (specDetail, constraints, testCases structure) are documented. The file was last updated recently and should be current.

- [ ] **Step 2: Verify no other files reference deleted concepts** — Grep for `Step 2.5`, `Step 5.0`, `sync-plans` in the skill directory to ensure no dangling references.

```bash
grep -r "Step 2.5\|Step 5.0\|sync-plans/" .claude/skills/sync-specs/
```

Expected: Only hits in sync-plans/ directory mention (historical).

- [ ] **Step 3: Run a test sync** — Execute `/sync-specs --full` to verify the new skill works end-to-end. This is the ultimate verification.

- [ ] **Step 4: Commit any follow-up fixes**
