# E2E Testing Skill 历史文档引用规则改进 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 e2e-testing skill 的"参考历史测试文档"段落从模糊的"直接复用"改为结构化的引用规则。

**Architecture:** 单文件文本替换，修改 `.claude/skills/e2e-testing/SKILL.md` 第 55 行的段落。

**Tech Stack:** Markdown skill 文件编辑

---

### Task 1: 替换"参考历史测试文档"段落

**Files:**
- Modify: `.claude/skills/e2e-testing/SKILL.md:55`

- [ ] **Step 1: 执行替换**

将 SKILL.md 第 55 行的：

```
**参考历史测试文档**：生成测试用例前，先扫描 `docs/e2e-testing/` 目录下的历史测试计划文档。如果历史文档中存在与当前测试目标相似的测试数据或 Given 前置步骤（如登录流程、页面导航、数据准备等），应直接复用这些已验证过的内容，避免重复走弯路。
```

替换为：

```
**参考历史测试文档**：每次测试必须生成全新的测试计划文档。编写新测试用例时，按以下规则参考历史文档：

1. **扫描历史文档**：生成测试用例前，先扫描 `docs/e2e-testing/` 目录下的历史测试计划文档
2. **匹配相似场景**：找到与当前测试目标有相似前置条件的历史用例（如相同的登录流程、页面导航、数据准备）
3. **参考蓝本编写**：将匹配到的历史用例作为蓝本，提取已验证的经验写进新文档

**可参考的内容（作为蓝本）：**
- Given 前置步骤的操作流程（如登录流程、页面导航路径、服务器启动步骤）
- 测试数据（如用户名、项目名称、端口等已验证的固定值）
- 项目特定规则（如操作约束、等待策略）

**必须重新编写的内容：**
- When 触发操作（每次测试的功能不同）
- Then 验证步骤（每次验证的目标不同）
- 测试目标列表和测试用例列表（每次测试范围不同）
```

- [ ] **Step 2: 验证替换结果**

读取 `.claude/skills/e2e-testing/SKILL.md` 第 50-65 行，确认：
1. 旧段落已消失
2. 新段落完整插入
3. 紧跟其后的 markdown 模板代码块未受影响

- [ ] **Step 3: 提交**

```bash
git add .claude/skills/e2e-testing/SKILL.md
git commit -m "fix: clarify e2e-testing skill historical doc reference rules

Replace ambiguous '直接复用' wording with structured reference rules
that distinguish reusable content (Given steps, test data, project rules)
from content that must be rewritten fresh (When/Then, test goals)."
```
