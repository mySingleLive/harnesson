# Sync-Specs 业务域视角重构 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修改 sync-specs SKILL.md，使规格树节点从业务域/业务功能视角划分，增加递归节点发现和计划自审循环。

**Architecture:** 在现有 Step 1→6 框架内做 3 处核心增量修改：新增节点识别原则章节、Step 1 增加递归发现、新增 Step 2.5 计划 Review，并适配修改 Step 3/4/5 和行为规则表。

**Tech Stack:** Markdown skill 文件编辑

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `.claude/skills/sync-specs/SKILL.md` | Modify | 唯一需要修改的文件 |

修改位置（按文件行号顺序）：

1. **Line 23**（`### Step 1` 之前）：插入「节点识别原则」章节
2. **Line 37**（Step 1 末尾）：插入递归节点发现第 5 步
3. **Line 78**（Step 2 末尾 `**禁止**` 之后）：插入 Step 2.5
4. **Line 87-91**（Step 3 生成规则）：修改 summary/goals 规则
5. **Line 120-123**（Step 4 结构校验第 4 项）：增强描述
6. **Line 138-155**（Step 5.0 第 3 项）：增强描述
7. **Line 270-280**（Agent 行为规则表）：新增计划 Review 行

---

### Task 1: 新增「节点识别原则」章节

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:23`（在 `### Step 1：扫描项目` 之前插入）

- [ ] **Step 1: 在 `## 流程` 和 `### Step 1` 之间插入节点识别原则章节**

在 `严格按以下步骤顺序执行。` 之后、`### Step 1：扫描项目` 之前插入：

```markdown
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
```

- [ ] **Step 2: 验证插入位置正确**

确认新章节位于 `严格按以下步骤顺序执行。` 之后、`### Step 1：扫描项目` 之前。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add business domain identification principles"
```

---

### Task 2: Step 1 增加递归节点发现

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Step 1 末尾，`**禁止**：此步骤不修改任何文件。` 之前）

- [ ] **Step 1: 在 Step 1 的第 4 步之后、禁止规则之前插入第 5 步**

在 `4. 全量模式：扫描全部源文件目录` 之后、`**禁止**：此步骤不修改任何文件。` 之前插入：

```markdown
5. **递归发现业务节点**：
   a. 从代码结构中识别业务域（按上述节点识别原则）
   b. 对每个业务域，识别其包含的业务功能
   c. 对每个业务功能，检查其是否足够复杂以至于需要子节点来完整描述
   d. 递归重复 c，直到所有叶子节点都是原子级业务功能
   e. 输出完整的节点树结构（id/name/level/parent/children），供 Step 2 使用

   **递归终止条件**：
   - 节点描述的功能已足够简单，用户只需一步操作即可完成
   - 继续细分后子节点不再有独立的用户价值
   - 节点关联的代码已是单文件或单组件级别
```

- [ ] **Step 2: 验证 Step 1 结构完整**

确认 Step 1 现在有 5 个子步骤 + 禁止规则，递归发现逻辑在最后一步。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add recursive business node discovery in Step 1"
```

---

### Task 3: 新增 Step 2.5 — 同步计划 Review

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Step 2 的 `**禁止**` 规则之后、`### Step 3` 之前）

- [ ] **Step 1: 在 Step 2 和 Step 3 之间插入 Step 2.5**

在 `**禁止**：不跳过此步骤直接生成草稿。` 之后、`### Step 3：生成草稿` 之前插入：

```markdown
### Step 2.5：同步计划 Review（循环直到通过）

对 Step 2 生成的同步计划执行以下 3 项检查。发现问题则修改计划并重新检查，循环直到全部通过。

**检查项：**

1. **代码一致性检查**
   - 计划中每个节点是否与代码实际存在对应
   - 不存在代码中已删除但计划仍标记为「更新/不变」的节点
   - 不存在代码中新增但计划遗漏的节点

2. **叶子节点子节点检测（递归）**
   - 对计划中每个叶子节点，检查其描述的功能是否足够完整
   - 判断标准：该叶子节点的功能是否包含多个独立的用户操作或多个跨技术模块的实现
   - 若需要子节点且计划中未列出 → 添加新子节点到计划中，说明添加原因
   - 对新添加的子节点递归执行同样检查

3. **结构合理性检查**
   - 父子关系是否符合业务域 → 业务功能的层次
   - 不存在技术模块被误判为业务功能（按节点识别原则判断）
   - 同层级节点间无功能重叠

**循环规则：** 发现任何问题 → 修改计划文档 → 从第 1 项重新检查 → 直到 3 项全部通过。

**通过后：** 计划文档标记为已 Review，继续进入 Step 3 生成草稿。

**禁止：** 不带问题进入草稿生成阶段。
```

- [ ] **Step 2: 验证插入位置正确**

确认新步骤在 Step 2 的禁止规则之后、Step 3 标题之前，编号为 Step 2.5。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add Step 2.5 sync plan review with recursive leaf check"
```

---

### Task 4: 修改 Step 3 节点内容生成规则

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Step 3 的节点内容生成规则部分）

- [ ] **Step 1: 修改 summary 和 goals 的生成规则**

将原来的：
```markdown
- `summary`：从代码注释、README、组件名/模块名提取，1-3 句话
- `goals`：从功能行为和代码实现推断，每个目标一句话
```

替换为：
```markdown
- `summary`：从用户/PM 视角描述该业务功能能做什么，1-3 句话。禁止使用技术术语描述实现方式（如「通过 SSE 推送消息」应改为「实时显示 Agent 回复」）
- `goals`：从用户使用场景推断，描述用户能完成什么目标，每个目标一句话。禁止描述技术实现目标
```

- [ ] **Step 2: 验证修改正确**

确认 summary 和 goals 规则都明确要求用户视角，且包含反面约束（禁止技术术语）。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): require user/PM perspective in summary and goals generation"
```

---

### Task 5: 增强 Step 4 结构校验

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Step 4 结构校验第 4 项）

- [ ] **Step 1: 修改结构校验第 4 项**

将原来的：
```markdown
4. **结构校验**
   - 父子关系一致：子节点的 parent 字段正确指向父节点 id，父节点的 children 包含所有子节点 id
   - 领域/模块划分合理：同一领域的功能归在同一父节点下
   - 不存在功能重叠：两个不同节点不应描述完全相同的功能
```

替换为：
```markdown
4. **结构校验**
   - 父子关系一致：子节点的 parent 字段正确指向父节点 id，父节点的 children 包含所有子节点 id
   - 业务域划分合理：同一业务域的功能归在同一父节点下（按节点识别原则判断）
   - 不存在技术模块被误分为独立节点：所有节点必须通过「用户是否直接感知」判断（按节点识别原则）
   - 不存在功能重叠：两个不同节点不应描述完全相同的功能
```

- [ ] **Step 2: 验证修改正确**

确认新增了「不存在技术模块被误分为独立节点」检查项，且引用了节点识别原则。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): enhance Step 4 structure validation with business domain checks"
```

---

### Task 6: 增强 Step 5.0 子节点完整性检测

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Step 5.0 第 3 项）

- [ ] **Step 1: 修改 Step 5.0 第 3 项**

将原来的：
```markdown
3. **子节点完整性检测**
   - 检查该节点关联的源文件（`syncMeta.sourceFiles`），识别是否有独立且足够复杂的功能模块缺少对应的规格节点
   - 判断标准：存在独立的实现代码（独立组件、独立路由、独立服务类等）但当前节点树中没有对应的子节点来描述它
   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿
```

替换为：
```markdown
3. **子节点完整性检测**
   - 从业务功能视角检查：该叶子节点描述的功能是否完整覆盖了用户可感知的所有子功能
   - 同时检查关联的源文件（`syncMeta.sourceFiles`），识别是否有独立的业务功能实现缺少对应的规格节点
   - 判断标准：存在用户可独立使用的子功能（按节点识别原则判断），但当前节点树中没有对应的子节点来描述它
   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿
```

- [ ] **Step 2: 验证修改正确**

确认检测视角从「独立实现代码」改为「用户可感知的子功能」，且引用了节点识别原则。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): enhance Step 5.0 sub-node detection with business function perspective"
```

---

### Task 7: 更新 Agent 行为规则表

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（Agent 行为规则表，在「计划」行之后）

- [ ] **Step 1: 在行为规则表中插入计划 Review 行**

在 `| 计划 | 生成 Markdown 同步计划到 .harnesson/specs/sync-plans/ | 不跳过用户确认 |` 行之后插入：

```markdown
| 计划 Review | 自检测计划与代码一致性、递归检查叶子节点子节点、检查结构合理性 | 不带问题进入草稿生成阶段 |
```

- [ ] **Step 2: 验证表格格式完整**

确认新增行的列数和分隔符与其他行一致。

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add plan review stage to agent behavior rules table"
```

---

### Task 8: 最终验证和整理

- [ ] **Step 1: 通读完整 SKILL.md**

从头到尾阅读修改后的文件，确认：
- 节点识别原则章节在 Step 1 前
- Step 1 有 5 个子步骤 + 禁止规则
- Step 2.5 在 Step 2 和 Step 3 之间
- Step 3 的 summary/goals 规则使用用户视角
- Step 4 第 4 项引用了节点识别原则
- Step 5.0 第 3 项使用业务功能视角
- 行为规则表包含计划 Review 行
- 无残留的旧描述或矛盾

- [ ] **Step 2: 修复发现的问题（如有）**

- [ ] **Step 3: 最终 Commit（如有修复）**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "fix(sync-specs): final cleanup and consistency fixes"
```

---

## Self-Review

**1. Spec coverage:**

| Spec 需求 | 对应 Task |
|-----------|----------|
| 节点识别原则（判断规则+示例+例外） | Task 1 |
| 递归节点发现（Step 1） | Task 2 |
| 计划 Review（Step 2.5） | Task 3 |
| Step 3 summary/goals 用户视角 | Task 4 |
| Step 4 结构校验增强 | Task 5 |
| Step 5.0 子节点检测增强 | Task 6 |
| Agent 行为规则表新增行 | Task 7 |
| 最终验证 | Task 8 |

**2. Placeholder scan:** 无 TBD/TODO/待定内容，所有步骤都包含完整的插入内容。

**3. Type consistency:** 所有引用的「节点识别原则」措辞一致；Step 2.5 和 Step 5.0 中的子节点检测描述不冲突（Step 2.5 检查计划阶段，Step 5.0 检查草稿阶段）。
