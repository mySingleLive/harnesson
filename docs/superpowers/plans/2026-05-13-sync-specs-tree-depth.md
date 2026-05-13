# sync-specs 树形变更概览与无深度限制 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修改 sync-specs skill，将同步计划变更概览从表格改为树形，并替换叶子节点终止条件以移除深度限制。

**Architecture:** 单文件编辑（`.claude/skills/sync-specs/SKILL.md`），共 7 处文本替换，无代码变更。

**Tech Stack:** Markdown skill instructions

**Design Spec:** `docs/superpowers/specs/2026-05-13-sync-specs-tree-depth-design.md`

---

### Task 1: 添加叶子节点判定原则到「节点识别原则」

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:57` — 在"例外"段落之后追加

- [ ] **Step 1: 追加叶子节点判定原则**

在 `SKILL.md` 第 57 行 `**例外：**...agent-service`）。` 之后，追加以下内容：

```markdown

**叶子节点判定：**

每个业务功能节点都需判断是叶子还是中间节点。判断标准：

一个节点是**叶子节点**，当且仅当它描述的功能满足以下全部条件：
1. 它是一个完整的、用户可独立使用的最小功能单位
2. 继续拆分后，子项将不再是完整的功能（即拆开后用户无法独立使用其中任何一个子项）

**原则方向：** 从树根到叶子节点：高层次 → 低层次，抽象 → 具体，模糊 → 明确，大范围 → 小范围。

**叶子节点示例：**
- 打开项目 — 完整的最小功能，拆为"选择文件夹"+"确认"没有独立用户价值
- Bash 命令卡片 — 展示命令执行和结果，用户独立感知的最小单位
- 发送消息 — 用户输入文本并发送给 Agent 的完整操作

**非叶子节点示例（需继续拆分）：**
- 项目管理 → 项目创建、打开项目、克隆项目、删除项目
- 智能工具 → Bash 命令卡片、文件读取卡片、文件编辑卡片、...
- 快捷操作 → 快捷按钮、斜杠命令
```

- [ ] **Step 2: 验证编辑**

Read `.claude/skills/sync-specs/SKILL.md` 确认新内容在"例外"段落后、`### Step 1` 之前。

---

### Task 2: 替换 Step 1 的递归终止条件

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:74-77`

- [ ] **Step 1: 替换终止条件**

将 Step 1 中的递归终止条件从旧内容替换为新内容。

**旧文本（第 74-77 行）：**
```markdown
	   **递归终止条件**：
	   - 节点描述的功能已足够简单，用户只需一步操作即可完成
	   - 继续细分后子节点不再有独立的用户价值
	   - 节点关联的代码已是单文件或单组件级别
```

**新文本：**
```markdown
	   **递归终止条件**：
	   按「节点识别原则」中的叶子节点判定标准确定。不设层数上限，层数完全由业务逻辑的自然拆分决定。
```

- [ ] **Step 2: 验证编辑**

Read `.claude/skills/sync-specs/SKILL.md` 确认终止条件已更新。

---

### Task 3: Step 2 计划模板 — 变更概览改树形，删除汇总表

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:100-117`

- [ ] **Step 1: 替换计划模板中的变更概览和汇总部分**

**旧文本（第 100-117 行）：**
```markdown
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

**新文本：**
```markdown
## 变更概览

{节点名} (L{层级}, {操作}){ - 简述}
├── {子节点名} (L{层级}, {操作}){ - 简述}
│   └── ...
└── ...

操作标记：新增、更新、删除、不变。简述可选。

## 详细变更

### {node-id} ({操作})
- 关联文件: {文件路径}
- 变更原因: {描述}
- 预计影响: {需要更新的字段}
```

注意："新增节点"和"删除节点"两个汇总部分已删除。

- [ ] **Step 2: 验证编辑**

Read `.claude/skills/sync-specs/SKILL.md` 确认计划模板已更新，表格已改为树形，汇总表已删除。

---

### Task 4: Step 2.5 检查项 2 — 更新叶子节点判断文字

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:133-137`

- [ ] **Step 1: 替换检查项 2 的判断标准**

**旧文本（第 133-137 行）：**
```markdown
2. **叶子节点子节点检测（递归）**
	   - 对计划中每个叶子节点，检查其描述的功能是否足够完整
	   - 判断标准：该叶子节点的功能是否包含多个独立的用户操作或多个跨技术模块的实现
	   - 若需要子节点且计划中未列出 → 添加新子节点到计划中，说明添加原因
	   - 对新添加的子节点递归执行同样检查
```

**新文本：**
```markdown
2. **叶子节点子节点检测（递归）**
	   - 对计划中每个叶子节点，按「节点识别原则」中的叶子节点判定标准检查其是否应为中间节点
	   - 判断标准：该节点的功能包含多个用户可独立使用的子功能 → 需要继续拆分为子节点
	   - 若需要子节点且计划中未列出 → 添加新子节点到计划中，说明添加原因
	   - 对新添加的子节点递归执行同样检查
```

- [ ] **Step 2: 验证编辑**

Read 对应行确认文字已更新。

---

### Task 5: Step 5.0 检查项 3 — 更新子节点完整性判断标准

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:223-227`

- [ ] **Step 1: 替换检查项 3 的判断标准**

**旧文本（第 223-227 行）：**
```markdown
3. **子节点完整性检测**
	   - 从业务功能视角检查：该叶子节点描述的功能是否完整覆盖了用户可感知的所有子功能
	   - 同时检查关联的源文件（`syncMeta.sourceFiles`），识别是否有独立的业务功能实现缺少对应的规格节点
	   - 判断标准：存在用户可独立使用的子功能（按节点识别原则判断），但当前节点树中没有对应的子节点来描述它
	   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿
```

**新文本：**
```markdown
3. **子节点完整性检测**
	   - 按「节点识别原则」中的叶子节点判定标准，检查每个叶子节点是否应继续拆分
	   - 同时检查关联的源文件（`syncMeta.sourceFiles`），识别是否有独立的业务功能实现缺少对应的规格节点
	   - 判断标准：该节点包含多个用户可独立使用的子功能，但当前节点树中没有对应的子节点来描述它们
	   - 若发现缺失 → 在同步计划中添加新子节点，回到 Step 3 为其生成草稿
```

- [ ] **Step 2: 验证编辑**

Read 对应行确认文字已更新。

---

### Task 6: 存储结构注释更新

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:269-275`

- [ ] **Step 1: 更新文件布局注释，去掉层数暗示**

**旧文本（第 269-275 行）：**
```markdown
│   ├── project.json                          # L1 根节点
│   ├── nodes/                                # 所有非根节点
│   │   ├── {kebab-case-name}.json           # L2 域/功能节点（无子节点时为单文件）
│   │   ├── {kebab-case-name}/               # 有子节点时用目录组织
│   │   │   ├── index.json                   # 自身节点
│   │   │   ├── {child-name}.json           # 直接子节点（叶子）
│   │   │   └── {child-name}/               # 子节点还有子节点时递归
```

**新文本：**
```markdown
│   ├── project.json                          # 根节点（level 1）
│   ├── nodes/                                # 所有非根节点
│   │   ├── {kebab-case-name}.json           # 无子节点的叶子节点
│   │   ├── {kebab-case-name}/               # 有子节点时用目录组织
│   │   │   ├── index.json                   # 自身节点
│   │   │   ├── {child-name}.json           # 直接子节点
│   │   │   └── {child-name}/               # 子节点还有子节点时递归
```

- [ ] **Step 2: 验证编辑**

Read 对应行确认注释已更新。

---

### Task 7: Agent 行为规则表更新

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:347-348`

- [ ] **Step 1: 更新计划和计划 Review 行的描述**

**旧文本（第 347-348 行）：**
```markdown
| 计划 | 生成 Markdown 同步计划到 .harnesson/specs/sync-plans/ | 不跳过用户确认 |
| 计划 Review | 自检测计划与代码一致性、递归检查叶子节点子节点、检查结构合理性 | 不带问题进入草稿生成阶段 |
```

**新文本：**
```markdown
| 计划 | 生成 Markdown 同步计划（树形变更概览）到 .harnesson/specs/sync-plans/ | 不跳过用户确认 |
| 计划 Review | 自检测计划与代码一致性、按叶子判定标准递归检查节点拆分、检查结构合理性 | 不带问题进入草稿生成阶段 |
```

- [ ] **Step 2: 验证编辑**

Read 对应行确认文字已更新。

---

### Task 8: 最终验证与提交

- [ ] **Step 1: 完整阅读 SKILL.md**

Read `.claude/skills/sync-specs/SKILL.md` 全文，确认：
1. 所有 7 处编辑已正确应用
2. 无残留的旧格式（表格格式的变更概览、旧终止条件、旧汇总表）
3. 新增的叶子节点判定原则与 Step 1/2.5/5.0 的引用一致
4. Markdown 格式正确（缩进、标题层级）

- [ ] **Step 2: 提交**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): tree-format change overview and unlimited spec depth"
```
