# E2E 测试计划：AskUserQuestion 问答流程测试

## 测试简述

测试 Agent 聊天面板中 AskUserQuestion 问答功能的完整流程：通过触发 brainstorming skill 让 Agent 产生多轮问答交互，验证用户回答问题后 ThinkingBar 动画是否正常恢复显示，以及后续问答弹出框是否正确渲染。

## 测试目标列表

- [ ] 目标1：能够选择项目并进入 New Session 页面
- [ ] 目标2：能够通过输入 slash command 触发 Agent 回复
- [ ] 目标3：Agent 回复中询问是否继续时，能正常发送"继续"并收到回复
- [ ] 目标4：Agent 触发 AskUserQuestion 时，问答弹出框正确显示
- [ ] 目标5：选择答案后，ThinkingBar 动画恢复显示
- [ ] 目标6：下一个问题出现时，AskUserQuestion 弹出框再次正确显示

## 测试方案

从首页开始，选择 harnesson 项目 → 进入 New Session 页面 → 在聊天输入框输入 slash command 触发 Agent → 等待 Agent 产生问答交互 → 验证问答流程的 UI 表现。前置条件：开发服务器已启动（http://localhost:5173）。

## 测试详细步骤

### 步骤 1：导航到首页
- **操作**：导航到 http://localhost:5173
- **验证**：页面正常加载，显示项目列表或首页内容

### 步骤 2：选择 harnesson 项目
- **操作**：在项目列表中找到并点击 harnesson 项目
- **验证**：进入项目相关页面

### 步骤 3：进入 New Session 页面
- **操作**：找到并点击 "New Session" 按钮或入口
- **验证**：进入新会话页面，显示聊天输入框

### 步骤 4：输入 slash command
- **操作**：在聊天输入框中输入 "/superpowers:brainstorming Agent 聊天输入框支持粘贴图片"，然后按 Enter 发送
- **验证**：消息发送成功，Agent 开始处理（显示 ThinkingBar 动画）

### 步骤 5：等待 Agent 回复并处理询问
- **操作**：等待 Agent 回复。如果 Agent 询问是否要继续或试一试，输入"继续"并发送
- **验证**：Agent 收到"继续"后继续处理

### 步骤 6：等待 AskUserQuestion 触发并选择答案
- **操作**：等待 Agent 触发 AskUserQuestion 问答，选择其中一个答案选项
- **验证**：
  - 问答弹出框正确显示（包含问题文本、选项、自定义输入框）
  - 选择答案后弹出框消失
  - **关键验证**：ThinkingBar 动画恢复显示（紫色动画点）

### 步骤 7：验证下一个 AskUserQuestion
- **操作**：等待 Agent 继续处理后触发下一个问题
- **验证**：
  - ThinkingBar 动画消失
  - **关键验证**：新的 AskUserQuestion 弹出框正确显示（包含新的问题内容）

## 验证方案

### 核心验证点
1. **ThinkingBar 恢复**：用户回答问题后，应看到紫色动画点（thinking indicator）重新出现
2. **AskUserQuestion 渲染**：后续问题出现时，问答弹出框应包含完整结构（header、问题文本、选项、自定义输入）
3. **流程衔接**：ThinkingBar 和 AskUserQuestion 之间切换流畅，无卡顿或空白

### 通过标准
- 所有步骤均按预期执行
- ThinkingBar 在回答后恢复显示
- 后续 AskUserQuestion 弹出框正确渲染

### 失败标准
- ThinkingBar 在回答后未出现
- AskUserQuestion 弹出框未显示或显示异常
- 页面卡死或无响应

## 操作规则

### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后按 Enter 键或点击发送按钮，**禁止**用 `\n` 字符
4. 等待策略：操作后等待页面响应，不假设即时生效

### 项目特定规则
1. Agent 回复可能较慢（需等待 LLM 处理），使用 await_text 或截图确认状态
2. AskUserQuestion 触发时机不确定，需要耐心等待（可能需要 30-60 秒）
3. 如果 Agent 没有触发 AskUserQuestion，可能需要调整输入内容以触发问答
