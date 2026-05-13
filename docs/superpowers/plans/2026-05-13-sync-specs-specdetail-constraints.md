# Sync-Specs: specDetail + Constraints + Incremental Completeness Detection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `specDetail` and `constraints` optional fields to node schema, render them in design docs, and add five completeness audit checks to incremental sync.

**Architecture:** Two-file change. `references/node-schema.md` documents the new optional fields. `skill.md` wires them into the sync pipeline: Step 1 gains a completeness audit, Step 2 gains "补全" operations, Step 3 gains field generation + design doc rendering, Step 4 gains three new content validation rules.

**Tech Stack:** Markdown (skill instructions), JSON Schema documentation

---

### Task 1: Update node-schema.md — document new optional fields

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-schema.md`

- [ ] **Step 1: Add `specDetail` and `constraints` to the optional fields table**

Find the "按需填充字段" table. Add two rows after `testCases`:

```
| specDetail | object | 规格详细信息。包含 `description`（Markdown 描述）和 `parameters`（string[]，可测试可量化的参数列表）。叶子节点优先填充。 |
| constraints | string[] | 约束条件列表。描述功能的边界条件、适用/不适用场景、错误条件、前置/后置条件等。每条为自由文本。叶子节点优先填充。 |
```

- [ ] **Step 2: Add `specDetail` sub-structure documentation**

After the `constraints` row, append a new subsection "### specDetail 结构":

```markdown
### specDetail 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | Markdown 格式的功能详细描述。 |
| parameters | string[] | 可测试、可量化的参数/规格列表。每条描述一个可观测的特性：UI 布局、字号、颜色、最大/最小值、时间阈值等。至少 1 条。 |
```

- [ ] **Step 3: Add new fields to the leaf node example JSON**

In the leaf node example (the `chat-input` one), add before `"status"`:

```json
  "specDetail": {
    "description": "多行文本输入组件，支持自动高度调整、快捷键发送和文件拖拽。输入框使用 textarea 实现，最小高度 40px，最大高度 200px 后出现滚动条。",
    "parameters": [
      "输入框最小行高 40px，最大可扩展到 200px",
      "Enter 发送消息，Shift+Enter 插入换行",
      "发送按钮图标为 PaperPlaneIcon，尺寸 20x20px，颜色 #6B7280",
      "最大输入字符数为 10000，超出后截断"
    ]
  },
  "constraints": [
    "输入为空时按 Enter → 不触发发送",
    "网络断开时发送 → 显示'发送失败'提示，消息保留在输入框",
    "仅支持纯文本和 Markdown 语法，不支持富文本粘贴",
    "组件未挂载时无法输入"
  ],
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/references/node-schema.md
git commit -m "docs(sync-specs): add specDetail and constraints to node schema reference"
```

---

### Task 2: Update skill.md Step 1 — add completeness audit sub-step

**Files:**
- Modify: `.claude/skills/sync-specs/skill.md`

- [ ] **Step 1: Add completeness audit after the node discovery step in Step 1**

Find the end of Step 1 (after "**禁止**：此步骤不修改任何文件。" and before "### Step 2：生成同步计划").

Insert a new sub-section:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/skill.md
git commit -m "docs(sync-specs): add completeness audit sub-step to Step 1"
```

---

### Task 3: Update skill.md Step 2 — add "补全" operation

**Files:**
- Modify: `.claude/skills/sync-specs/skill.md`

- [ ] **Step 1: Add "补全" to the operation markers**

Find the line `操作标记：新增、更新、删除、不变。简述可选。` in Step 2's plan format section.

Replace with:

```
操作标记：新增、更新、删除、补全、不变。简述可选。

- 补全（gap-fill）：节点已存在，但缺少 specDetail、constraints 等字段或 design 文档不完整。Step 3 仅生成缺失部分，不重写整个节点。
```

- [ ] **Step 2: Add "补全" to the detailed change section**

Find the detailed change template:

```
### {node-id} ({操作})
- 关联文件: {文件路径}
- 变更原因: {描述}
- 预计影响: {需要更新的字段}
```

Add a note after it:

```
补全操作在"预计影响"中列出缺失的字段名（如 specDetail、constraints），不列出关联文件变更。
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/skill.md
git commit -m "docs(sync-specs): add 补全 operation type to Step 2 sync plan"
```

---

### Task 4: Update skill.md Step 3 — generate specDetail/constraints + render design doc sections

**Files:**
- Modify: `.claude/skills/sync-specs/skill.md`

- [ ] **Step 1: Add specDetail and constraints generation rules**

Find the node content generation rules in Step 3 (after `testCases` rules). Add:

```markdown
- `specDetail`：从代码中提取可测试、可量化的规格参数。
  - `description`：用 Markdown 描述功能的详细工作方式。1-3 段。从用户视角说明功能如何运作、涉及哪些 UI 元素或逻辑流程。
  - `parameters`：string 数组，每条一个可量化的规格。优先提取：UI 布局尺寸、字号、颜色代码、间距、最大/最小值、超时时间、字符限制、文件大小限制等。若无明确的规格参数（如纯业务逻辑节点），至少描述 1 个可观测的行为特征。
  - 叶子节点（`isLeaf: true` + 有 `sourceFiles`）必须生成。中间节点可选。
- `constraints`：string 数组，描述功能的边界条件和约束。
  - 覆盖：前置条件（什么情况下功能可用）、后置条件（功能完成后系统状态）、不变条件（始终成立）、适用场景、不适用场景、错误条件（什么输入/状态下会报错）
  - 每条一句话。叶子节点至少 1 条。中间节点可选。
```

- [ ] **Step 2: Add design doc section rendering rules**

Find the design doc generation section (Step 3 sub-step 3b). After the existing rules, add:

```markdown
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
```

- [ ] **Step 3: Add "补全" merge behavior rule**

After the design doc rendering rules, add:

```markdown
   e. **补全模式（仅增量）**：同步计划中标记为"补全"的节点，只生成缺失字段并合并到现有 JSON 和 design 文档，不重写整个文件。
      - JSON：读取现有文件，添加/更新缺失字段，保留其他字段不变
      - Design：若缺失 "Specification Details" 或 "Constraints" 章节，追加到文档末尾；已存在的章节不重写
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/skill.md
git commit -m "docs(sync-specs): add specDetail, constraints generation and design doc rendering to Step 3"
```

---

### Task 5: Update skill.md Step 4 — add validation rules 3a/3b/3c

**Files:**
- Modify: `.claude/skills/sync-specs/skill.md`

- [ ] **Step 1: Expand the content validation section (item 3)**

Find the existing content validation in Step 4:

```
3. **内容校验**
   - 节点的 summary 和 goals 与其关联的源文件（syncMeta.sourceFiles）的实际实现一致
   - 不存在代码中已删除但规格中仍标记为"已实现"的功能
```

Replace with:

```
3. **内容校验**
   - 节点的 summary 和 goals 与其关联的源文件（syncMeta.sourceFiles）的实际实现一致
   - 不存在代码中已删除但规格中仍标记为"已实现"的功能

3a. **specDetail 完整性（叶子节点）**
   - 叶子节点（`isLeaf: true` + `sourceFiles` 非空）的 `specDetail` 不应为 null
   - `specDetail.description` 为非空字符串
   - `specDetail.parameters` 至少 1 条
   - 每条 parameter 包含可量化的规格（不能全是模糊描述如"界面好看"）

3b. **constraints 完整性（叶子节点）**
   - 叶子节点（`isLeaf: true` + `sourceFiles` 非空）的 `constraints` 不应为 null 或空数组
   - 每条为非空字符串

3c. **JSON ↔ Markdown 一致性**
   - `specDetail.description` 内容与 design 文档的 "Specification Details" 段落一致
   - `constraints` 各条目与 design 文档的 "Constraints" 列表一致
   - 若 design 文档缺少对应章节 → 补充渲染
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/skill.md
git commit -m "docs(sync-specs): add specDetail and constraints validation rules to Step 4"
```

---

### Task 6: Update skill.md Step 5.0 — add coverage checks for new fields

**Files:**
- Modify: `.claude/skills/sync-specs/skill.md`

- [ ] **Step 1: Add specDetail/constraints coverage check**

Find the coverage checks in Step 5.0. Add a new check item after check 3 (子节点完整性检测):

```markdown
4. **specDetail 与 constraints 覆盖度**
   - 所有叶子节点（`isLeaf: true` + `sourceFiles` 非空）必须具有非 null 的 `specDetail` 和 `constraints`
   - `specDetail.parameters` 至少覆盖以下维度各 1 条（如功能涉及）：
     - UI 规格（尺寸、颜色、字体、布局）
     - 数据限制（最大值、最小值、长度限制）
     - 行为规格（超时时间、重试次数、并发限制）
   - `constraints` 至少覆盖：1 个适用场景、1 个不适用场景、1 个错误条件
   - 若某个维度不适用（如纯后端逻辑无 UI），在 `specDetail.description` 中说明
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/skill.md
git commit -m "docs(sync-specs): add specDetail and constraints coverage check to Step 5.0"
```

---

### Task 7: Verify — run sync-specs on current project

**Files:**
- (no file changes — verification only)

- [ ] **Step 1: Run sync-specs to verify the skill still works**

Run: `/sync-specs` (incremental mode)

Expected: The skill runs through all 6 steps. New fields `specDetail` and `constraints` are generated for leaf nodes in the draft output. Existing nodes without these fields are detected and marked "补全" in the sync plan.

- [ ] **Step 2: Check draft output for new fields**

Verify that draft node JSON files contain `specDetail` and `constraints` fields. Verify that draft design docs contain "Specification Details" and "Constraints" sections.

- [ ] **Step 3: Check that existing nodes are not corrupted**

Verify that nodes marked "不变" in the sync plan are untouched — their JSON files remain identical to before the sync.
