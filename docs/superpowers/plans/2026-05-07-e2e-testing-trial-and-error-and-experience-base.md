# E2E Testing Skill 试错循环与经验库 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 e2e-testing skill 增加试错循环机制和经验库 base.md，让测试执行更智能、测试计划更精准。

**Architecture:** 修改 `.claude/skills/e2e-testing/SKILL.md` 的阶段一和阶段二内容，将自愈循环替换为三层级统一问题处理流程，新增经验库管理章节。同时在 `docs/e2e-testing/` 创建初始 base.md 文件。

**Tech Stack:** Claude Code skill（纯 Markdown 指令文档）

---

### Task 1: 新增经验库管理章节

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md`（在"浏览器操作规范"章节前插入新章节）

在"阶段转换总结"之前、"浏览器操作规范"之后插入新的独立章节。这个章节定义 base.md 的格式、初始化、读写规则，是后续修改的基础。

- [ ] **Step 1: 在 SKILL.md 的"浏览器操作规范"章节之后、"红旗清单"章节之前，插入经验库管理章节**

在 SKILL.md 第 220 行（`---` 分隔线之前）插入以下内容：

```markdown
---

## 经验库管理

### 文件位置

`{项目目录}/docs/e2e-testing/base.md`

### 初始化

首次使用时如果 `docs/e2e-testing/base.md` 不存在，创建空文件（仅含标题 `# E2E 测试经验库`）。后续测试中通过试错和用户指导逐步积累经验。

### 经验格式

按场景分类记录，每个场景记录粗粒度策略 + 中粒度关键步骤：

```markdown
## 导航类

### 进入项目首页
- **策略**：直接导航到应用根 URL
- **关键步骤**：navigate http://localhost:5173 → await_element 等待页面加载
- **注意**：确保开发服务器已启动

### 选择特定项目
- **策略 A（推荐）**：项目列表页 → select 下拉选择
  - 关键步骤：await_element 项目列表 → select 选择目标项目
- **策略 B**：项目列表页 → click 项目名称
  - 关键步骤：await_element 项目列表 → XPath 定位项目名 → click
```

### 记录粒度

- **粗粒度**：用一句话描述达成目标的策略（如"项目列表页 → select 下拉选择"）
- **中粒度**：列出关键操作步骤和使用的工具（如"await_element 项目列表 → select 选择目标项目"）
- **不记录**：具体选择器、精确等待时间等易变细节

### 读写规则

**读取时机**：
1. 阶段一 Step 2.5（理解用户意图后、澄清问题前）读取 base.md
2. 阶段二执行每个 Given/When 前，参考 base.md 中同类场景的经验

**写入时机**：
- 层级1 试错成功 → 立即追加
- 层级2 用户指导成功 → 立即追加

**去重规则**：写入前检查是否已有相同场景的记录。如有：
- 已有条目只有一条策略 → 追加新策略（变为策略 B）
- 已有条目有多条策略 → 追加新策略（策略 C/D/...）
- 新策略与已有某条策略本质相同 → 不重复添加
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: add experience base management section to e2e-testing skill"
```

---

### Task 2: 修改阶段一 — 新增 Step 2.5 和修改 Step 3

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md`

在阶段一中新增读取 base.md 的步骤，并修改澄清问题步骤以支持多路径选择。

- [ ] **Step 1: 在 Step 2 和 Step 3 之间插入 Step 2.5**

在 SKILL.md 中找到 `### Step 3: 澄清问题`，在其前面插入：

```markdown
### Step 2.5: 读取经验库

读取 `docs/e2e-testing/base.md`（如不存在则创建空文件）。记住已有场景的经验，供后续步骤参考：
- 澄清问题时：如果某目标有多条操作路径，base.md 中的路径标记为候选推荐
- 生成测试计划时：Given/When 步骤优先使用 base.md 中已验证的操作流程
- 执行测试时：遇到相似场景优先参考 base.md 中的成功经验
```

- [ ] **Step 2: 修改 Step 3 澄清问题，增加多路径选择逻辑**

将现有的 Step 3 内容：

```markdown
### Step 3: 澄清问题

如果用户的意图中有不明确的地方，逐一提问澄清：
- 一次只问一个问题
- 如果所有信息已经清晰，直接跳过此步骤
- 澄清完毕后，简要复述理解，确认与用户意图一致
```

替换为：

```markdown
### Step 3: 澄清问题

如果用户的意图中有不明确的地方，逐一提问澄清：
- 一次只问一个问题
- 如果所有信息已经清晰，直接跳过此步骤
- 澄清完毕后，简要复述理解，确认与用户意图一致

**多路径选择**：思考推理中发现某目标（进入某页面、进入某状态、完成某操作）有多种操作路径时，按以下规则处理：

1. 汇总所有可用路径（base.md 中已有的 + 新发现的路径）
2. 如果 base.md 中记录了该场景且只有一条策略 → 直接采用，不问用户
3. 如果存在 2 条及以上路径 → 用 AskUserQuestion 让用户选择
4. 推荐规则：
   - base.md 中的路径标记"(推荐)"
   - 如果 base.md 中同一场景有多条路径，推荐最短路径

**呈现格式示例**：
```
进入 Agent 对话页面有以下路径：
- A: 点击侧边栏聊天图标 → 等待对话界面加载 (推荐, base.md)
- B: 直接导航 /agent/chat URL
```

被用户选择的路径将用于后续生成测试计划文档的 Given/When 步骤。
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: add base.md reading step and multi-path selection to e2e planning phase"
```

---

### Task 3: 修改阶段二 — 替换自愈循环为统一问题处理流程

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md`

这是最大的改动。将现有的 Step 4 自愈循环替换为三层级统一问题处理流程，并在 Step 3 中增加参考 base.md 的说明。

- [ ] **Step 1: 修改 Step 3 逐步执行浏览器测试，增加参考 base.md 说明**

找到 Step 3 中的"每个测试用例的执行流程"列表，在第 1 项"准备测试数据（如需要）"之前插入：

```markdown
0. **参考经验库**：执行 Given/When 前，查看 base.md 中是否有同类场景的成功经验，优先使用已验证的操作方式
```

- [ ] **Step 2: 替换 Step 4 自愈循环为统一问题处理流程**

将现有的整个 Step 4（从 `### Step 4: 自愈循环` 到该步骤结束，包含详细流程和升级机制）替换为：

```markdown
### Step 4: 统一问题处理流程

测试执行中遇到问题时，按三层级逐级处理：

```
Given/When 操作失败
    │
    ▼
层级1: 试错循环（换操作方式）
├─ 成功 → 保存经验到 base.md → 继续
└─ 3次失败 ↓
    │
    ▼
层级2: 升级用户（请用户提供操作指导）
├─ 成功 → 保存经验到 base.md → 继续
└─ 用户无法解决 ↓
    │
    ▼
层级3: 代码修复（定位根因 → 修复代码 → 重新验证）
├─ 修复成功 → 继续
└─ 3次失败 → 终止测试，报告用户
```

**注意**：Then 验证失败不经过层级1和层级2，直接进入层级3（代码修复）。

#### 层级1: 试错循环

**触发**：Given 或 When 操作步骤失败（元素找不到、操作无响应、未进入预期状态等）

**流程**：
1. 截图查看当前页面状态
2. 分析失败原因
3. 换一种操作方式重试，可尝试的变化：
   - 不同选择器策略（CSS → XPath）
   - 不同操作方式（click → keyboard_press）
   - 不同导航路径
   - 先 await_element 等待再操作
4. 成功 → 立即将成功的操作流程保存到 base.md → 继续下一个测试步骤
5. 失败 → 回到步骤 1，累计尝试次数 +1

**限制**：同一操作最多尝试 3 种不同方式

#### 层级2: 升级用户

**触发**：试错循环 3 次仍失败

**流程**：
1. 向用户展示：问题描述 + 已尝试的方式（附截图）+ 当前页面状态截图
2. 请用户提供操作指导："这个操作应该怎么完成？"
3. 按用户指导操作
4. 成功 → 立即将用户指导的操作流程保存到 base.md → 继续下一个测试步骤
5. 用户无法解决 → 进入层级3

#### 层级3: 代码修复

**触发**：层级2 用户无法解决，**或** Then 验证步骤失败

**流程**：
1. **记录问题**：简要记录问题现象、实际结果 vs 预期结果
2. **停下测试**：不再继续后续测试用例，专注当前问题
3. **定位根因**：查看相关源代码，分析问题原因（先根因后修复）
4. **修复代码**：修改代码解决问题
5. **重新验证**：回到出问题的测试用例，重新从 Given 步骤开始执行完整操作和验证
6. **通过** → 继续下一个测试用例 | **仍失败** → 回到步骤 3，累计尝试次数 +1

**升级机制**：
- 同一测试用例修复尝试达到 **3 次**仍失败 → 停止测试
- 向用户报告：问题描述、已尝试的修复方案、失败原因
- 等待用户决定：继续尝试、跳过该测试用例、或终止测试
```

- [ ] **Step 3: 更新终止条件**

将现有的终止条件：

```markdown
### 终止条件

- 所有测试用例执行完毕且全部通过 → 向用户报告测试结果摘要
- 同一问题修复 3 次仍失败 → 升级给用户
```

替换为：

```markdown
### 终止条件

- 所有测试用例执行完毕且全部通过 → 向用户报告测试结果摘要
- 层级3 代码修复同一问题 3 次仍失败 → 升级给用户
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: replace self-healing loop with unified 3-level problem handling in e2e execution phase"
```

---

### Task 4: 更新阶段转换总结图

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md`

更新末尾的阶段转换总结图，反映新的流程。

- [ ] **Step 1: 替换阶段转换总结**

将现有的阶段转换总结（从 `## 阶段转换总结` 到文件末尾）替换为：

```markdown
## 阶段转换总结

```
用户触发 skill
    │
    ▼
┌──────────────────────────────────┐
│   阶段一：测试计划                │
│  理解代码 → 理解意图              │
│  → 读取 base.md                  │
│  → 澄清问题(含多路径选择)         │
│  → 生成测试文档                   │
└────────┬─────────────────────────┘
         │ 用户确认计划
         ▼
┌──────────────────────────────────┐
│   阶段二：测试执行                │
│  读取文档 → 检测服务器            │
│  → 逐用例浏览器测试               │
│  → Given/When 参考 base.md       │
│  → 操作失败?                     │
│    ├─ 是 → 层级1: 试错循环       │
│    │         ├─ 成功→保存经验     │
│    │         └─ 3次→层级2:问用户  │
│    │                   ├─ 成功→保存经验 │
│    │                   └─ 失败→层级3:修代码 │
│    └─ 否 → Then 验证              │
│           ├─ 通过 → 下一用例      │
│           └─ 失败 → 层级3:修代码  │
│  → 全部通过 / 升级               │
└──────────────────────────────────┘
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: update e2e-testing flow diagram with trial-and-error and experience base"
```

---

### Task 5: 创建初始 base.md 文件

**Files:**
- Create: `docs/e2e-testing/base.md`

- [ ] **Step 1: 创建初始 base.md**

创建文件 `docs/e2e-testing/base.md`，内容为：

```markdown
# E2E 测试经验库
```

- [ ] **Step 2: Commit**

```bash
git add docs/e2e-testing/base.md
git commit -m "feat: create initial e2e testing experience base file"
```

---

## Self-Review

**1. Spec coverage:**
- 统一问题处理流程（三层级）→ Task 3
- 经验库 base.md 格式与读写规则 → Task 1
- 阶段一读取 base.md → Task 2 (Step 2.5)
- 阶段一多路径选择 → Task 2 (Step 3)
- 阶段二参考 base.md → Task 3 (Step 3 修改)
- 试错成功/用户指导成功保存经验 → Task 3 (层级1/层级2 描述中)
- base.md 初始化 → Task 1 + Task 5
- 阶段转换图更新 → Task 4

**2. Placeholder scan:** No TBD, TODO, or placeholder patterns found.

**3. Consistency:** All task references to base.md path (`docs/e2e-testing/base.md`) are consistent. Layer numbering (1/2/3) matches throughout. The "Then 直接进层级3" rule appears in both Task 3's replacement text and the flow diagram in Task 4.
