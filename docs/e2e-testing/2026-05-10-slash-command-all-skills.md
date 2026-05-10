# E2E 测试计划：斜杠命令智能提示搜索所有 Skills

## 测试简述

修复并验证 Agent 聊天输入框中斜杠命令智能提示无法搜索出所有 skills 的问题（如 `/e2e-testing` 无法搜到），确保项目级 `.claude/skills/` 目录下的 skill 也能出现在命令列表中。

## 测试目标列表

- [ ] 目标1：输入 `/` 后弹出的命令列表包含项目级 skills（如 `/e2e-testing`、`/frontend-design`）
- [ ] 目标2：输入 `/e2e` 后能搜索过滤出 `/e2e-testing`
- [ ] 目标3：选择项目级 skill 命令后，输入框正确替换为命令文本

## 测试方案

从首页开始，选择项目后进入 NewSessionPage 输入框，测试斜杠命令能否发现并搜索项目级 skills。重点验证之前不可见的 `e2e-testing` skill 现在可以被搜索到。

## 测试用例列表

### 目标 1：命令列表包含项目级 skills

**测试用例 1.1：NewSessionPage 输入框显示项目级 skills**
- **测试数据**：项目 harnesson
- **Given**：导航到 http://localhost:5173 → 选择项目 harnesson → 输入框可见
- **When**：点击输入框 → 输入 `/`
- **Then**：弹窗中出现项目级 skills（如 `/e2e-testing`、`/frontend-design`、`/mcp-builder` 等）→ 同时仍包含全局 plugin skills（如 `/browsing`）→ 同时包含 builtin commands（如 `/clear`）

### 目标 2：搜索过滤项目级 skills

**测试用例 2.1：搜索 `/e2e` 过滤出 e2e-testing**
- **Given**：输入框可见
- **When**：输入 `/e2e`
- **Then**：弹窗过滤结果中包含 `/e2e-testing` → 描述应为 "使用浏览器直接进行端到端测试..."

**测试用例 2.2：搜索 `/frontend` 过滤出 frontend-design**
- **Given**：输入框可见
- **When**：输入 `/frontend`
- **Then**：弹窗过滤结果中包含 `/frontend-design`

### 目标 3：选择项目级 skill 命令

**测试用例 3.1：Tab 选择 e2e-testing**
- **Given**：输入 `/e2e` → 弹窗显示 `/e2e-testing`
- **When**：按 Tab 键
- **Then**：输入框文本变为 `/e2e-testing ` → 光标位于末尾

## 验证方案

所有测试用例的 Then 步骤均验证通过即为通过。

## 操作规则

### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"按钮，禁止用 `\n` 字符
4. 等待策略：操作后 await_element / await_text

### 项目特定规则
1. dev server 端口：5173
2. 选择项目策略：eval 触发 React 点击打开下拉 → click 选择项目
