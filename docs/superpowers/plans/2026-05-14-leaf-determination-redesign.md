# 叶子节点判定逻辑重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unified independence-three-conditions leaf determination with separate frontend/backend criteria.

**Architecture:** Two markdown files modified — SKILL.md (main skill logic) and node-identification-examples.md (reference examples). No code changes, documentation only.

**Tech Stack:** Markdown editing.

---

### Task 1: Replace leaf determination section in SKILL.md

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:35-44`

- [ ] **Step 1: Replace the leaf determination paragraph (L35-L44)**

Replace the old content:

```markdown
**叶子节点判定**（基于语义独立性）：

核心规则：如果一个节点的功能描述可涵盖多个用户可独立感知/使用的功能/操作/组件/模块/接口 → 非叶子，必须拆分。

独立性三条件（全部不满足才判定为叶子）：
1. 用户能否只使用其中一个，而不关心另一个？
2. 它们是否出现在不同的 UI 区域或不同的使用场景？
3. 去掉其中一个后，另一个是否仍然是完整可用的？

辅助信号（仅触发深入语义分析，不作判定依据）：goals 有 2+ 动词、sourceFiles 可分为 2+ 组、summary 有多个并列描述。遇到辅助信号时，必须用独立性三条件进行语义分析。
```

With the new content:

```markdown
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
```

- [ ] **Step 2: Verify the edit is correct**

Read `.claude/skills/sync-specs/SKILL.md:35-50` and confirm:
- New frontend/backend criteria are present
- Fallback section with old independence conditions is present
- Surrounding text (未实现节点 line, detailed examples line) is intact

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): replace leaf determination with frontend/backend criteria"
```

---

### Task 2: Update Step 1 flow references in SKILL.md

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:79,84-85,92`

- [ ] **Step 1: Update Step 1 全量模式 4c (L79)**

Replace:
```
   c) 对步骤 b 中发现的每个功能，用独立性三条件判断是否应成为独立子节点
```
With:
```
   c) 对步骤 b 中发现的每个功能，按前后端叶子判定标准判断是否应成为独立子节点
```

- [ ] **Step 2: Update Step 1 叶子审计 5 (L84-85)**

Replace:
```
	   - 对枚举出的功能列表应用独立性三条件
	   - 在 `draft/README.md` 中记录审计表格：节点 | 源码中发现的独立功能列表 | 独立性分析（引用三条件） | 判定
```
With:
```
	   - 对枚举出的功能列表按前后端叶子判定标准分析。无法确定时假定为非叶子并继续拆解；若无法再拆解，则判定为叶子
	   - 在 `draft/README.md` 中记录审计表格：节点 | 源码中发现的独立功能列表 | 判定分析（引用前后端标准） | 判定
```

- [ ] **Step 3: Update Step 1 自检 (L92)**

Replace:
```
- 叶子节点是否通过独立性三条件审查（用户能否只使用其中一个、是否不同UI/场景、去掉一个另一个是否仍完整）
```
With:
```
- 叶子节点是否通过前后端叶子判定标准审查
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): update Step 1 flow references to use frontend/backend leaf criteria"
```

---

### Task 3: Update Step 3 leaf re-check in SKILL.md

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:171-172`

- [ ] **Step 1: Replace Step 3 覆盖度与叶子复核 (L171-172)**

Replace:
```
	- **叶子复核**：对每个叶子节点，读取其 sourceFiles 源码，枚举其中实现的用户可感知功能。如果发现多个独立功能 → 标记需拆分，回到 Step 2 补充子节点
	- 叶子节点再次检查独立性三条件：用户能否只使用其中一个、是否不同UI/场景、去掉一个另一个是否仍完整
```
With:
```
	- **叶子复核**：对每个叶子节点，读取其 sourceFiles 源码，枚举其中实现的用户可感知功能。如果发现多个功能 → 按前后端叶子判定标准判断是否需拆分，回到 Step 2 补充子节点
	- 叶子节点再次检查前后端判定标准。无法确定时假定为非叶子并继续拆解；若无法再拆解，则判定为叶子
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): update Step 3 leaf re-check to use frontend/backend criteria"
```

---

### Task 4: Rewrite leaf determination sections in node-identification-examples.md

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-identification-examples.md:24-67`

- [ ] **Step 1: Replace L24-L67 with new sections**

Replace everything from `## 叶子节点判定详解` through the end of `## 动词枚举检查示例` (L24-L67) with:

```markdown
## 叶子节点判定详解

每个业务功能节点都需判断是叶子还是中间节点，判定依据为下方「叶子判定核心规则」。

## 叶子判定核心规则

**前端（UI）叶子** — 满足任一即为叶子：
1. 用户触发的一次操作（点击按钮、展开/收起树、键盘输入等）所执行的单一功能
2. 足够简单、无复杂功能的组件
3. 多个相同类型的子组件或子功能可合并为一个（如表单中多个输入框的输入和校验合并为一个）

**后端叶子** — 满足任一即为叶子：
1. 由 API 触发的一个业务功能
2. 可被外部触发的功能（定时任务、Hooks、AI Function Call、Skills 等）

**跨前后端功能**：按子项目拆为前端节点和后端节点，共享同一父节点。

**无法确定时**：假定为非叶子，继续拆解子节点；若无法再拆解，则判定为叶子。

## 前后端叶子判定对比示例

| 功能 | 前端/后端 | 判定分析 | 结果 |
|------|----------|---------|------|
| 切换模型 | 前端 | 用户点击一次操作 → 满足前端条件1 | 叶子 |
| 文本消息渲染 | 前端 | 简单组件，只负责渲染文本 → 满足前端条件2 | 叶子 |
| 表单输入与校验（含多个输入框） | 前端 | 多个相同类型子组件（输入框）→ 满足前端条件3，合并为一个 | 叶子 |
| Message Display | 前端 | 含文本渲染、工具卡片、思考指示器等 → 不满足任一条件 | 非叶子 → 拆分 |
| 创建会话 API | 后端 | 单个 API 触发的业务功能 → 满足后端条件1 | 叶子 |
| 定时同步规格 | 后端 | 外部定时任务触发 → 满足后端条件2 | 叶子 |
| Agent 调度 | 后端 | 涉及多个 API（创建会话、发送消息、流式响应）→ 不满足任一条件 | 非叶子 → 拆分 |
| 提交表单 | 跨前后端 | 前端按钮点击 + 后端 API → 拆为前端叶子 + 后端叶子，共享父节点 | 拆为两个叶子 |

## 误判为叶子的典型案例

| 节点 | 涵盖的独立功能 | 判定分析（前后端标准） | 正确判定 |
|------|--------------|----------------------|---------|
| Message Display | 文本渲染、工具卡片(Bash/Edit/Write/Read等)、思考指示器、Todo进度条、用户问答面板 | 不满足前端任一叶子条件（非单次操作、非简单组件、非同类型可合并） | 非叶子 → 拆为5个子节点 |
| Message Input | 文本输入编辑器、图片上传、斜杠命令自动补全 | 不满足前端任一叶子条件（3个不同类型操作，不可合并） | 非叶子 → 拆为3个子节点 |

## 判定流程示例

| 节点 | 枚举的功能 | 前后端归属 | 判定 | 拆分结果 |
|------|-----------|----------|------|---------|
| Agent Session | 创建会话、切换会话、删除会话 | 后端（API 触发） | 3 个独立 API → 非叶子 | 创建会话 / 切换会话 / 删除会话（各为后端叶子） |
| Message Input | 文本输入、图片上传、斜杠命令补全 | 前端（UI 操作） | 3 个不同操作 → 非叶子 | 文本输入 / 图片上传 / 斜杠命令补全（各为前端叶子） |
| 发送消息（前端） | 输入文本并发送 | 前端 | 用户一次操作 → 前端条件1 | 叶子 |
| Bash 命令卡片 | 展示单条命令执行结果 | 前端 | 简单组件 → 前端条件2 | 叶子 |
| 规格同步 | API 触发的全量同步 + 定时增量同步 | 后端 | 2 种触发方式 → 非叶子 | 全量同步 / 增量同步（各为后端叶子） |
```

- [ ] **Step 2: Verify the edit is correct**

Read `.claude/skills/sync-specs/references/node-identification-examples.md` and confirm:
- New sections (叶子判定核心规则, 前后端叶子判定对比示例, 判定流程示例) are present
- Old sections (独立性三条件, 辅助信号, 独立性判断对比示例, 动词枚举检查示例) are removed
- Sections below (叶子/非叶子节点示例, 操作级拆分示例) are intact

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/references/node-identification-examples.md
git commit -m "docs(sync-specs): rewrite leaf determination examples with frontend/backend criteria"
```

