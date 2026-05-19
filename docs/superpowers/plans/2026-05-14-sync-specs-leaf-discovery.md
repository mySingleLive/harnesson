# sync-specs 叶子节点发现优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 sync-specs skill 在全量模式下只发现 16 个节点（应为 26 个）的问题，通过强化叶子判定原则、增加审计环节和复核机制来防止过早标记叶子。

**Architecture:** 修改 3 个 skill 文件——替换叶子判定规则为基于语义独立性的核心规则，在 Step 1 增加强制叶子审计环节，在 Step 3 增加叶子复核。改动集中在 .claude/skills/sync-specs/ 目录下。

**Tech Stack:** Markdown skill 文件，无代码变更。

---

### Task 1: 更新 node-identification-examples.md — 增加误判案例和独立性示例

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-identification-examples.md`

- [ ] **Step 1: 在"叶子节点判定详解"章节之后，插入新的核心规则说明和误判案例**

在文件中 `## 叶子节点判定详解` 章节之后、`## 动词枚举检查示例` 之前，插入以下内容：

```markdown
## 叶子判定核心规则

**核心规则**：如果一个节点的功能描述可涵盖多个用户可独立感知/使用的功能/操作/组件/模块/接口 → 非叶子，必须拆分。

**独立性判断三条件**（全部不满足才判定独立）：
1. 用户能否只使用其中一个，而不关心另一个？
2. 它们是否出现在不同的 UI 区域或不同的使用场景？
3. 去掉其中一个后，另一个是否仍然是完整可用的？

**辅助信号**（仅触发深入语义分析，不作判定依据）：
- goals 中有 2+ 个动词
- sourceFiles 可按目录/命名分为 2+ 组
- summary 中有多个并列描述

遇到辅助信号时，必须用独立性三条件进行语义分析，而非机械计数。

## 误判为叶子的典型案例

| 节点 | 涵盖的独立功能 | 独立性分析 | 正确判定 |
|------|--------------|-----------|---------|
| Message Display | 文本渲染、工具卡片(Bash/Edit/Write/Read等)、思考指示器、Todo进度条、用户问答面板 | 每个功能在不同UI区域，用户可只使用其中一个 | 非叶子 → 拆为5个子节点 |
| Message Input | 文本输入编辑器、图片上传、斜杠命令自动补全 | 不同UI区域（编辑区、图片预览区、弹出补全菜单），可单独使用 | 非叶子 → 拆为3个子节点 |

## 独立性判断对比示例

| 功能描述 | 动词数 | 独立性分析 | 判定 |
|---------|--------|-----------|------|
| 添加或更新一条数据 | 2（添加、更新） | 同一工作流、同一UI表单，用户不会只添加不更新 | 不独立 → 叶子 |
| 文本渲染 + 图片上传 | 2（渲染、上传） | 不同UI区域，用户可以只打字不上传 | 独立 → 非叶子 |
| 切换模型 | 1（切换） | 单一操作，无法再拆 | 叶子 |
| 工具执行展示（Bash/Read/Write/Edit等卡片） | 多个 | 每种工具有独立组件、独立渲染逻辑，用户只关心当前执行的某个工具 | 独立 → 非叶子 |
```

- [ ] **Step 2: 删除旧的"叶子节点判定详解"章节中与核心规则重复的 4 条规则**

将 `## 叶子节点判定详解` 下的旧 4 条规则（"一个节点是叶子节点，当且仅当..."）替换为引用新核心规则：

```markdown
## 叶子节点判定详解

每个业务功能节点都需判断是叶子还是中间节点，判定依据为上方「叶子判定核心规则」。
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/references/node-identification-examples.md
git commit -m "docs(sync-specs): add leaf determination core rule and misclassification examples"
```

---

### Task 2: 更新 node-schema.md — isLeaf 字段增加核心规则引用

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-schema.md`

- [ ] **Step 1: 修改 isLeaf 字段说明**

将 `| isLeaf | boolean | 是否叶子节点。无子节点时为 true。 |` 改为：

```
| isLeaf | boolean | 是否叶子节点。判定依据见 SKILL.md 节点识别原则中的叶子判定核心规则。无子节点时为 true。 |
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/references/node-schema.md
git commit -m "docs(sync-specs): add leaf rule cross-reference in node schema"
```

---

### Task 3: 更新 SKILL.md — 替换叶子判定原则

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 替换"叶子节点判定"章节**

找到 SKILL.md 中 `**叶子节点判定**（满足全部条件）：` 开头的 4 条规则块，替换为：

```markdown
**叶子节点判定**（基于语义独立性）：

核心规则：如果一个节点的功能描述可涵盖多个用户可独立感知/使用的功能/操作/组件/模块/接口 → 非叶子，必须拆分。

独立性三条件（全部不满足才判定为叶子）：
1. 用户能否只使用其中一个，而不关心另一个？
2. 它们是否出现在不同的 UI 区域或不同的使用场景？
3. 去掉其中一个后，另一个是否仍然是完整可用的？

辅助信号（仅触发深入语义分析，不作判定依据）：goals 有 2+ 动词、sourceFiles 可分为 2+ 组、summary 有多个并列描述。遇到辅助信号时，必须用独立性三条件进行语义分析。
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): replace leaf rules with semantic independence core rule"
```

---

### Task 4: 更新 SKILL.md — Step 1 全量模式增加叶子审计环节

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 在全量模式步骤 5 和 6 之间插入叶子审计步骤**

在 SKILL.md 中找到全量模式的步骤列表：
```
5. 递归判定叶子节点（按叶子节点判定标准）
6. 输出完整节点树结构，写入 `draft/README.md`
```

将步骤 6 改为 7，在其前面插入新的步骤 6：

```markdown
6. **叶子审计**（强制，对每个候选叶子节点执行）：
   - 用叶子判定核心规则审视该节点的 summary 和 goals
   - 在 `draft/README.md` 中记录审计表格：节点 | 涵盖的独立功能列表 | 独立性分析（引用三条件） | 判定
   - 发现非叶子 → 立即补充子节点 → 对新子节点递归执行本步骤
   - 所有节点通过审计后才继续
7. 输出完整节点树结构，写入 `draft/README.md`
```

- [ ] **Step 2: 强化自检环节**

找到自检中的 `- 叶子节点是否需要继续拆分`，替换为：

```markdown
- 叶子节点是否通过独立性三条件审查（用户能否只使用其中一个、是否不同UI/场景、去掉一个另一个是否仍完整）
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): add mandatory leaf audit step in full-mode discovery"
```

---

### Task 5: 更新 SKILL.md — Step 3 校验增加叶子复核

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 修改 Step 3 第 6 项校验**

找到 `**6. 覆盖度审查**` 章节，将标题和内容改为：

```markdown
**6. 覆盖度与叶子复核**
- 验收标准覆盖所有 goals 的关键场景（所有 acceptanceCriteria 的 then 成立时功能正常运行）
- acceptanceCriteria 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件
- **叶子复核**：对每个叶子节点，用核心规则重新审视其 summary、goals 和 specDetail。如果语义上涵盖多个独立功能 → 标记需拆分，回到 Step 2 补充子节点
- 叶子节点再次检查独立性三条件：用户能否只使用其中一个、是否不同UI/场景、去掉一个另一个是否仍完整
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): add leaf re-audit to Step 3 validation"
```

---

### Task 6: 运行 sync-specs 验证节点数量

**Files:**
- 无文件变更

- [ ] **Step 1: 运行全量同步**

运行 `/sync-specs --full`，观察节点发现结果。

- [ ] **Step 2: 验证节点数量 >= 25**

检查 `draft/README.md` 中的节点树，确认节点总数 >= 25（接近之前 26 个的正确结果）。

- [ ] **Step 3: 验证审计表格存在**

确认 `draft/README.md` 中包含叶子审计表格。

- [ ] **Step 4: 如验证失败，分析原因并修复**

如果节点数量仍不足，检查哪些节点被错误标记为叶子，分析审计环节是否生效，修复 SKILL.md 中的相关指令。
