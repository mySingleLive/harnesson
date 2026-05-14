# Sync-Specs Generation Order Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Step 2a field generation order with explicit dependency phases and remove testCases from the sync flow.

**Architecture:** Edit-only changes to SKILL.md — restructure Step 2a into 3 ordered phases, remove testCases references from Steps 2a/3 and the Schema section. No new files created.

**Tech Stack:** Markdown skill files.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `.claude/skills/sync-specs/SKILL.md:79-94` | Modify | Restructure Step 2a into 3 dependency phases, remove testCases |
| `.claude/skills/sync-specs/SKILL.md:120` | Modify | Remove testCases format check from Step 3 校验项 1 |
| `.claude/skills/sync-specs/SKILL.md:143-146` | Modify | Simplify Step 3 校验项 6, remove testCases coverage |
| `.claude/skills/sync-specs/SKILL.md:193` | Modify | Remove testCases from core fields list |

---

### Task 1: Restructure Step 2a — 3-phase generation, remove testCases

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:79-94`

- [ ] **Step 1: Replace Step 2a content**

Replace lines 79-94 (from `#### 2a — 生成节点 JSON` through `**补全操作（仅增量）：** ...`) with:

```markdown
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
```

- [ ] **Step 2: Verify** — Read the modified section. Confirm:
  - 3 explicit phases: descriptive fields → acceptanceCriteria → design path
  - Phase 2 explicitly states dependency on Phase 1 output
  - testCases completely absent
  - 补全 logic preserved at bottom

---

### Task 2: Remove testCases from Step 3 校验项 1 (格式校验)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:120`

- [ ] **Step 1: Remove testCases format check**

Delete line 120:
```
- testCases 含 unit-test/end-to-end/script-test 三个固定键，用例不含 type 字段
```

- [ ] **Step 2: Verify** — Read 校验项 1 section. Confirm it contains exactly 4 bullets (JSON parse, required fields, kebab-case/enums, status enum) with no testCases mention.

---

### Task 3: Simplify Step 3 校验项 6 (覆盖度审查)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:143-146`

- [ ] **Step 1: Replace 校验项 6 content**

Replace lines 143-146 with:

```markdown
**6. 覆盖度审查**
- 验收标准覆盖所有 goals 的关键场景（所有 acceptanceCriteria 的 then 成立时功能正常运行）
- acceptanceCriteria 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件
- 叶子节点再次检查：是否包含 2+ 个独立子功能 → 补充子节点，回到 Step 2 生成草稿
```

- [ ] **Step 2: Verify** — Read 校验项 6. Confirm:
  - No testCases mention
  - New bullet about acceptanceCriteria referencing specDetail/constraints is present
  - Leaf node sub-check preserved

---

### Task 4: Remove testCases from Schema core fields

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:193`

- [ ] **Step 1: Edit core fields line**

Change line 193 from:
```
核心字段：id, name, level, parent, children, isLeaf, summary, goals, design, acceptanceCriteria, testCases, specDetail, constraints, status, syncMeta
```
to:
```
核心字段：id, name, level, parent, children, isLeaf, summary, goals, design, acceptanceCriteria, specDetail, constraints, status, syncMeta
```

- [ ] **Step 2: Verify** — Read line 193. Confirm testCases is not in the list.

---

### Task 5: Final review and commit

- [ ] **Step 1: Full-file consistency check** — Read the complete SKILL.md. Search for any remaining `testCases` references. Expected: zero hits in the main flow (acceptable only in `references/node-schema.md` which is unchanged).

- [ ] **Step 2: Verify Step 2a dependency structure** — Confirm the 3-phase structure reads naturally: Phase 1 (descriptive) → Phase 2 (acceptanceCriteria with dependency annotation) → Phase 3 (design path).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "perf(sync-specs): add generation dependency phases, remove testCases from sync flow"
```
