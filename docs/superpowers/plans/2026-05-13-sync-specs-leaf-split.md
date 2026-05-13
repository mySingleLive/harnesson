# Sync-Specs 叶子节点拆分增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 sync-specs SKILL.md 中叶子节点判定标准，使递归节点发现能深入到操作级粒度。

**Architecture:** 仅修改 `.claude/skills/sync-specs/SKILL.md` 的「节点识别原则」中「叶子节点判定」区域（约 SKILL.md:59-78），加入动词枚举检查条件、代码交叉验证流程、未实现节点处理规则，并补充中粒度拆分示例。

**Tech Stack:** Markdown skill 文件编辑

---

### Task 1: 扩展叶子节点判定条件

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md:63-65`（叶子判定条件列表）

- [ ] **Step 1: 在现有两条判定条件后新增第三条动词枚举检查和第四条代码验证条件**

将 SKILL.md 中第 63-65 行：

```markdown
一个节点是**叶子节点**，当且仅当它描述的功能满足以下全部条件：
1. 它是一个完整的、用户可独立使用的最小功能单位
2. 继续拆分后，子项将不再是完整的功能（即拆开后用户无法独立使用其中任何一个子项）
```

替换为：

```markdown
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
```

- [ ] **Step 2: 验证替换后的上下文连贯性**

读取 SKILL.md 第 59-70 行，确认：
- "叶子节点判定："标题仍在
- 新的 4 条判定条件平滑衔接后面的"原则方向"
- 无重复或矛盾内容

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add verb enumeration check and code cross-validation to leaf node criteria"
```

---

### Task 2: 新增动词枚举示例表

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（在"原则方向"行之后、现有"叶子节点示例"之前插入）

- [ ] **Step 1: 在「原则方向」行之后插入动词枚举检查示例表**

在 SKILL.md 中找到：

```markdown
**原则方向：** 从树根到叶子节点：高层次 → 低层次，抽象 → 具体，模糊 → 明确，大范围 → 小范围。

**叶子节点示例：**
```

在"**叶子节点示例：**"之前插入：

```markdown
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

```

- [ ] **Step 2: 验证插入位置和格式**

读取 SKILL.md 第 67-95 行区域，确认：
- 示例表在"原则方向"和"叶子节点示例"之间
- 表格格式正确，Markdown 渲染无问题
- 未实现节点处理规则紧随表格之后

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add verb enumeration examples and unimplemented node handling rules"
```

---

### Task 3: 补充中粒度非叶子节点示例

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`（在现有"非叶子节点示例"区域补充操作级拆分）

- [ ] **Step 1: 在现有非叶子节点示例后追加操作级拆分示例**

在 SKILL.md 中找到：

```markdown
**非叶子节点示例（需继续拆分）：**
- 项目管理 → 项目创建、打开项目、克隆项目、删除项目
- 智能工具 → Bash 命令卡片、文件读取卡片、文件编辑卡片、...
- 快捷操作 → 快捷按钮、斜杠命令
```

替换为：

```markdown
**非叶子节点示例（需继续拆分）：**
- 项目管理 → 项目创建、打开项目、克隆项目、删除项目
- 智能工具 → Bash 命令卡片、文件读取卡片、文件编辑卡片、...
- 快捷操作 → 快捷按钮、斜杠命令

**操作级拆分示例（功能→操作层级）：**
- Agent Session → 创建会话、切换会话、删除会话（L4 操作级）
- Tool Execution Display → Bash 卡片、文件读取卡片、文件编辑卡片、文件搜索卡片、代码搜索卡片、...（L4）
- Message Display → 文本消息渲染、思考指示器、用户问答面板（L4）
- Message Input → 文本输入、图片上传、快捷键操作（L4）
```

- [ ] **Step 2: 验证完整章节的连贯性**

读取 SKILL.md 整个「节点识别原则」区域（约第 29-95 行），确认：
- 三类识别对象表不变
- 正面示例表不变
- 反面示例表不变
- 例外规则不变
- 叶子节点判定：新增的 4 条条件 + 动词枚举示例表 + 未实现节点处理 + 叶子/非叶子示例全部连贯
- 无重复内容

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add operation-level split examples for non-leaf nodes"
```

---

### Task 4: 最终验证

**Files:**
- Read: `.claude/skills/sync-specs/SKILL.md`（全文审阅）

- [ ] **Step 1: 全文审阅 SKILL.md**

读取完整 SKILL.md，检查：
1. 所有后续步骤（Step 1 的递归发现、Step 2.5 Review、Step 5.0 覆盖度审查）仍引用「节点识别原则」— 它们无需改动，加强原则后自动生效
2. 存储结构、节点 Schema、增量模式补充说明、Agent 行为规则等章节未被误改
3. 无拼写/格式错误

- [ ] **Step 2: 确认所有 commit 已正确提交**

运行 `git log --oneline -5`，确认最近 3 个 commit 对应 Task 1-3 的改动。

---

## Self-Review

**Spec coverage:**
- 动词枚举检查（设计 §1）→ Task 1 Step 1
- 代码交叉验证（设计 §2）→ Task 1 Step 1（条件 4）
- 未实现节点处理规则（设计 §3）→ Task 2 Step 1
- 中粒度拆分示例（设计 §4）→ Task 3 Step 1

**Placeholder scan:** 无 TBD/TODO，所有替换内容完整。

**Type consistency:** 不涉及代码类型，全部为 Markdown 文本替换。
