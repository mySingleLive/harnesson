# E2E Testing Skill 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建项目级 e2e-testing skill，实现两阶段端到端测试流程（计划 → 执行 + 自愈循环）

**Architecture:** 单文件 skill，包含 frontmatter 元数据 + 两阶段流程指引（计划阶段和执行阶段）。通过 Chrome 浏览器工具直接操作，不使用任何自动化测试脚本。

**Tech Stack:** Claude Code skill (Markdown + frontmatter), Chrome 浏览器工具 (superpowers-chrome)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `.claude/skills/e2e-testing/SKILL.md` | Create | Skill 主文件，包含完整的两阶段测试流程指引 |

---

### Task 1: 创建 e2e-testing skill 文件

**Files:**
- Create: `.claude/skills/e2e-testing/SKILL.md`

- [ ] **Step 1: 创建 skill 目录并写入 SKILL.md**

```markdown
---
name: e2e-testing
description: 使用浏览器直接进行端到端测试。先理解测试意图、生成测试计划文档，然后按计划执行浏览器测试，发现问题自动修复，直到所有测试目标通过。
---

# E2E 端到端测试

使用浏览器直接进行端到端测试。不写任何脚本，直接通过 Chrome 浏览器工具操作 Web 应用，验证功能是否正常。

## 铁律

1. **NO SCRIPTS** — 直接用 Chrome 浏览器工具操作，不写任何自动化测试脚本
2. **NO UNSUPERVISED FIXES** — 同一问题修复超过 3 次仍未解决，必须停下来向用户报告
3. **FOLLOW THE PLAN** — 测试执行阶段必须以生成的测试计划文档为准，不得偏离
4. **RESPECT UI RULES** — 严格遵守操作规则，特别是输入提交方式（回车/点击按钮，禁止 `\n`）

## 触发条件

用户要求对 Web 应用进行端到端测试、功能验证、或 UI 交互测试时。

---

## 阶段一：测试计划（Planning Phase）

```
理解项目代码 → 理解用户意图 → 澄清问题(Q&A循环) → 生成测试计划文档 → 用户确认
```

### Step 1: 理解项目代码

快速扫描项目结构，建立对应用的基本认知：
- 项目技术栈（框架、路由、状态管理）
- 页面/路由结构
- 关键组件和交互逻辑
- 开发服务器端口和启动方式

### Step 2: 理解用户意图

明确用户的测试需求：
- **测试目标**：要测试哪些功能/页面/流程
- **验证标准**：什么结果算通过、什么算失败
- **关注点**：重点关注的交互、边界情况

### Step 3: 澄清问题

如果用户的意图中有不明确的地方，逐一提问澄清：
- 一次只问一个问题
- 如果所有信息已经清晰，直接跳过此步骤
- 澄清完毕后，简要复述理解，确认与用户意图一致

### Step 4: 生成测试计划文档

根据对项目和用户意图的理解，生成测试计划文档到 `docs/e2e-testing/YYYY-MM-DD-<topic>.md`：

```markdown
# E2E 测试计划：<测试主题>

## 测试简述
一段话概括本次测试的目标和范围。

## 测试目标列表
- [ ] 目标1：具体描述
- [ ] 目标2：具体描述

## 测试方案
整体测试策略说明：从哪个页面开始、测试路径、前置条件（如需要登录、特定数据等）。

## 测试详细步骤

### 步骤 1：<步骤标题>
- **操作**：描述具体操作（如"导航到 /chat 页面"）
- **验证**：描述预期结果（如"页面应显示聊天界面，包含输入框"）

### 步骤 2：<步骤标题>
- **操作**：...
- **验证**：...

## 验证方案
每个测试目标的验证方式总结，以及整体测试通过/失败的判定标准。

## 操作规则
### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"/"提交"按钮，**禁止**用 `\n` 字符
4. 下拉选择：用 select 操作，不要手动模拟键盘
5. 按钮点击：直接用 click 操作定位按钮元素
6. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
（根据项目代码分析自动补充）
```

### 检查点

测试计划生成后，暂停。向用户展示计划摘要并等待确认：
- 列出测试目标概要
- 说明测试步骤数量和关键路径
- 等待用户说"继续"或"可以"后才进入阶段二

---

## 阶段二：测试执行（Execution Phase）

```
读取测试文档 → 启动/检测开发服务器 → 逐步执行浏览器测试 → 发现问题 → 修复 → 验证 → 继续
```

### Step 1: 读取测试文档

读取阶段一生成的测试计划文档，以文档内容为唯一测试依据。

### Step 2: 开发服务器管理

智能检测并启动开发服务器：

1. 尝试访问开发服务器地址（默认 `http://localhost:5173`）
2. 如果未运行：启动开发服务器（`pnpm dev`），等待服务器就绪
3. 如果已运行：直接继续

测试期间保持服务器运行，测试结束后不关闭。

### Step 3: 逐步执行浏览器测试

按测试计划中的步骤顺序，用 Chrome 浏览器工具逐一操作和验证。

**每个步骤的执行流程：**

1. 执行操作（navigate / click / type / select 等）
2. 等待页面响应（await_element / await_text）
3. 截图查看实际状态（screenshot）
4. 对比预期结果，判断是否通过
5. 通过 → 继续下一步 | 不通过 → 进入自愈循环

### Step 4: 自愈循环

当测试步骤的实际结果与预期不符时：

```
发现问题 → 记录问题 → 停下测试 → 定位根因 → 修复代码 → 重新验证该步骤
     ↑                                                        |
     |________________________________________________________|
                          (最多3次)
```

**详细流程：**

1. **发现问题**：浏览器操作后实际结果与预期不符
2. **记录问题**：简要记录问题现象、实际结果 vs 预期结果
3. **停下测试**：不再继续后续步骤，专注当前问题
4. **定位根因**：查看相关源代码，分析问题原因（先根因后修复）
5. **修复代码**：修改代码解决问题
6. **重新验证**：回到出问题的步骤，重新执行该步骤的完整操作和验证
7. **通过** → 继续下一步 | **仍失败** → 回到步骤4，累计尝试次数+1

**升级机制：**
- 同一步骤修复尝试达到 **3 次**仍失败 → 停止测试
- 向用户报告：问题描述、已尝试的修复方案、失败原因
- 等待用户决定：继续尝试、跳过该步骤、或终止测试

### 终止条件

- 所有测试步骤执行完毕且全部通过 → 向用户报告测试结果摘要
- 同一问题修复 3 次仍失败 → 升级给用户

---

## 浏览器操作规范

### DO（正确做法）

| 场景 | 操作方式 |
|------|---------|
| 文本输入后提交 | `type` 输入内容，然后 `keyboard_press` Enter 或 `click` 提交按钮 |
| 点击按钮 | `click` + CSS/XPath 选择器定位按钮 |
| 下拉选择 | `select` 操作选择选项 |
| 等待页面响应 | `await_element` 或 `await_text` 等待目标出现 |
| 页面导航 | `navigate` 到目标 URL |
| 查看页面状态 | 先 `screenshot` 截图，然后读取截图文件分析 |

### DON'T（禁止做法）

| 场景 | 禁止操作 | 原因 |
|------|---------|------|
| 文本输入提交 | 在 type 的 payload 中使用 `\n` | 无效果，浏览器不会触发提交 |
| 假设操作即时生效 | 操作后立即验证下一步 | 页面可能还在加载/渲染 |
| 硬编码等待 | `sleep` 固定秒数 | 不可靠，应使用 await 等待 |

---

## 红旗清单

执行阶段遇到以下情况必须 STOP：

1. **连续 2 次操作无响应** — 页面可能崩溃或路由错误，截图确认后决定是否继续
2. **选择器找不到元素** — 先截图查看实际页面状态，不要盲目重试
3. **页面显示错误信息** — 记录错误内容，进入自愈循环
4. **与测试计划描述严重不符** — 截图后与用户确认，可能是代码变更导致测试计划过时
```

- [ ] **Step 2: 验证 skill 文件格式正确**

Run: `head -5 .claude/skills/e2e-testing/SKILL.md`
Expected: 显示 frontmatter（`---`, `name: e2e-testing`, `description: ...`, `---`）

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: add e2e-testing skill for browser-based end-to-end testing"
```

---

### Task 2: 验证 Skill 可被发现和触发

**Files:**
- Verify: `.claude/skills/e2e-testing/SKILL.md`

- [ ] **Step 1: 确认 skill 文件在正确的位置**

Run: `find .claude/skills/e2e-testing -type f`
Expected:
```
.claude/skills/e2e-testing/SKILL.md
```

- [ ] **Step 2: 确认 frontmatter 格式正确**

Run: `grep -A3 "^---" .claude/skills/e2e-testing/SKILL.md | head -6`
Expected: frontmatter 包含 `name: e2e-testing` 和 `description:` 字段

- [ ] **Step 3: 手动触发验证**

在 Claude Code 中输入 `/e2e-testing`，确认 skill 被正确识别和加载。预期：skill 内容被加载到对话中。

---

## Self-Review

**Spec coverage:**
- Skill 基本信息 & 铁律 → Task 1 SKILL.md frontmatter + 铁律章节 ✓
- 两阶段流程 → 阶段一和阶段二章节完整覆盖 ✓
- 测试计划文档结构 → 阶段一 Step 4 中的模板 ✓
- 自愈循环 → 阶段二 Step 4 完整覆盖 ✓
- 开发服务器管理 → 阶段二 Step 2 覆盖 ✓
- 浏览器操作规范 → DO/DON'T 表格覆盖 ✓
- 红旗清单 → 独立章节覆盖 ✓
- 升级机制（3次上限）→ 自愈循环章节覆盖 ✓

**Placeholder scan:** 无 TBD/TODO/placeholder。所有内容完整。

**Type consistency:** 无代码依赖，纯 Markdown skill 文件，不涉及类型一致性问题。
