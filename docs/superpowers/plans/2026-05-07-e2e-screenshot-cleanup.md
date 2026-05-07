# E2E 测试截图清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 e2e-testing skill 中添加测试结束后自动清理截图文件的功能。

**Architecture:** 在测试开始时创建 `.e2e-start` 标记文件作为时间基准，测试结束后用 `find -newer` 增量删除新生成的 PNG 截图文件，最后删除标记文件。

**Tech Stack:** Markdown skill 文件编辑

---

### Task 1: 在阶段二 Step 2 添加标记文件创建

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md:168-176`

- [ ] **Step 1: 在 Step 2 开发服务器管理开头添加标记文件创建指令**

在 `### Step 2: 开发服务器管理` 下、`智能检测并启动开发服务器：` 之前，插入：

```markdown
创建标记文件，用于后续清理截图：

```bash
touch .e2e-start
```

智能检测并启动开发服务器：
```

- [ ] **Step 2: 更新阶段二的流程图**

在 SKILL.md 的阶段二流程图（第 161 行）中，将：

```
读取测试文档 → 启动/检测开发服务器 → 逐步执行浏览器测试 → 发现问题 → 修复 → 验证 → 继续
```

改为：

```
创建标记文件 → 读取测试文档 → 启动/检测开发服务器 → 逐步执行浏览器测试 → 发现问题 → 修复 → 验证 → 继续 → 清理截图文件
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: add screenshot marker file creation to e2e-testing skill"
```

---

### Task 2: 在终止条件后添加清理步骤

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md:263-267`

- [ ] **Step 1: 修改终止条件并添加 Step 5 清理截图文件**

将当前的终止条件部分（第 263-267 行）：

```markdown
### 终止条件

- 所有测试用例执行完毕且全部通过 → 向用户报告测试结果摘要
- 层级3 代码修复同一问题 3 次仍失败 → 升级给用户
```

替换为：

```markdown
### 终止条件

- 所有测试用例执行完毕且全部通过 → 进入 Step 5 清理
- 层级3 代码修复同一问题 3 次仍失败 → 进入 Step 5 清理

### Step 5: 清理截图文件

测试结束后（无论通过或终止），删除本次测试中生成的截图文件：

```bash
find . -maxdepth 1 -type f \( -name '*.png' -o ! -name '*.*' \) -newer .e2e-start -delete && rm .e2e-start
```

- 匹配：`.png` 扩展名文件 + 无扩展名文件（浏览器截图可能无扩展名）
- 仅删除比 `.e2e-start` 更新的文件（即本次测试生成的）
- 最后删除 `.e2e-start` 标记文件
- 不清理 `.md`、`.html`、`.txt` 等其他浏览器生成的文件

清理完成后，向用户报告测试结果摘要。
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: add screenshot cleanup step to e2e-testing skill"
```

---

### Task 3: 更新阶段转换总结流程图

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md:371-386`

- [ ] **Step 1: 在阶段二流程图中添加标记文件和清理步骤**

将阶段二流程图部分（第 371-386 行）替换为：

```
┌──────────────────────────────────┐
│   阶段二：测试执行                │
│  创建标记 → 读取文档              │
│  → 检测服务器                    │
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
│  → 清理截图文件 → 报告结果        │
└──────────────────────────────────┘
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "feat: update flow diagram with screenshot cleanup in e2e-testing skill"
```
