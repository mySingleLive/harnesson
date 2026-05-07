# E2E 测试计划：Q&A Result Card 显示验证

## 测试简述

验证 Agent 聊天面板中 Q&A Result Card 功能：当用户通过 AskUserQuestion 弹出框回答问题后，聊天流中应内联显示 `question → answer` 卡片。测试覆盖卡片渲染、内容正确性和无回归。

## 测试目标列表

- [ ] 目标1：能够选择项目并进入 New Session 页面
- [ ] 目标2：能够通过 brainstorming slash command 触发 Agent 产生 AskUserQuestion 交互
- [ ] 目标3：Agent 询问是否继续时，能发送"继续"并收到回复
- [ ] 目标4：AskUserQuestion 弹出框出现后，能选择答案并提交
- [ ] 目标5：提交答案后，聊天流中出现 Q&A Result Card（question → answer 格式）
- [ ] 目标6：Q&A Result Card 样式正确（灰色问题、箭头分隔、蓝色答案）
- [ ] 目标7：后续 AskUserQuestion 触发时，Q&A Result Card 继续正常显示
- [ ] 目标8：无回归（文本段、工具卡片正常渲染，无控制台错误）

## 测试方案

从首页开始，选择 harnesson 项目 → 进入 New Session 页面 → 输入 `/superpowers:brainstorming Agent聊天输入框支持图片粘贴` 触发 Agent → 等待 AskUserQuestion 弹出 → 选择答案 → 验证 Q&A Result Card 出现在聊天流中。前置条件：开发服务器已启动（http://localhost:5173）。

## 测试用例列表

### 目标 1：选择项目并进入 New Session 页面

**测试用例 1.1：导航并选择项目**
- **测试数据**：项目名称: harnesson, 端口: http://localhost:5173
- **Given**：导航到 http://localhost:5173 → 等待页面加载
- **When**：使用 eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开项目下拉 → 等待下拉菜单出现 → click harnesson 项目按钮
- **Then**：页面显示聊天界面 → textarea placeholder 为 "Message Harnesson..."

**测试用例 1.2：进入 New Session**
- **测试数据**：无
- **Given**：已在 harnesson 项目页面
- **When**：如有历史会话列表，点击 "New Session" 按钮创建新会话
- **Then**：进入空白聊天页面，输入框可用

### 目标 2：通过 brainstorming 触发 AskUserQuestion

**测试用例 2.1：发送 brainstorming 命令**
- **测试数据**：slash command: `/superpowers:brainstorming Agent聊天输入框支持图片粘贴`
- **Given**：已在空白聊天页面，输入框已聚焦
- **When**：type `/superpowers:brainstorming Agent聊天输入框支持图片粘贴` → keyboard_press Enter 发送
- **Then**：消息发送成功 → 显示 ThinkingBar 动画（紫色动画点）→ Agent 开始处理

### 目标 3：处理 Agent "是否继续" 询问

**测试用例 3.1：发送"继续"**
- **测试数据**：回复内容: "继续"
- **Given**：Agent 回复中询问是否要继续或试一试
- **When**：type "继续" → keyboard_press Enter 发送
- **Then**：Agent 收到后继续处理 → ThinkingBar 动画恢复

### 目标 4：AskUserQuestion 弹出框交互

**测试用例 4.1：选择答案并提交**
- **测试数据**：选择第一个选项
- **Given**：Agent 触发 AskUserQuestion，弹出框已显示
- **When**：点击第一个选项按钮 → 如有提交按钮则点击提交
- **Then**：弹出框消失 → ThinkingBar 动画恢复显示

### 目标 5-6：验证 Q&A Result Card

**测试用例 5.1：检查 Q&A Result Card 渲染**
- **测试数据**：无
- **Given**：答案已提交，Agent 继续处理中或已回复
- **When**：截图查看聊天流内容
- **Then**：
  - 聊天流中出现 Q&A Result Card（深紫色背景 `#252540`，圆角 `8px`）
  - 卡片显示格式为 `question → answer`（灰色问题文字 + 灰色箭头 + 蓝色答案文字）
  - 答案文字颜色为 `#00bfff`
  - 问题文字颜色为 `#9ca3af`

### 目标 7：后续 Q&A Result Card

**测试用例 7.1：验证后续问答的 Q&A Result Card**
- **测试数据**：无
- **Given**：Agent 触发第二个 AskUserQuestion
- **When**：选择答案并提交
- **Then**：第二个 Q&A Result Card 出现在聊天流中 → 显示新的 question → answer 内容

### 目标 8：无回归验证

**测试用例 8.1：验证其他 UI 元素正常**
- **测试数据**：无
- **Given**：已完成所有 Q&A 交互
- **When**：截图查看整个聊天页面 + 检查浏览器控制台
- **Then**：
  - 文本段正常显示（Agent 的文字回复）
  - 工具卡片正常渲染（如有）
  - 浏览器控制台无错误（检查 console.txt）

## 验证方案

### 通过标准
- 所有测试用例的 Then 步骤均验证通过
- Q&A Result Card 在聊天流中正确显示，内容和样式符合预期
- 无回归：文本段和工具卡片不受影响

### 失败标准
- Q&A Result Card 未出现或样式异常
- AskUserQuestion 流程中断（弹出框不出现或提交无响应）
- 控制台有新增错误
- 其他 UI 元素显示异常

## 操作规则

### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"/"提交"按钮，**禁止**用 `\n` 字符
4. 下拉选择：用 select 操作，不要手动模拟键盘
5. 按钮点击：直接用 click 操作定位按钮元素
6. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. Agent 回复较慢（LLM 处理），需等待 30-60 秒，使用 await_text 或截图确认状态
2. AskUserQuestion 触发时机不确定，需要耐心等待
3. 选择项目优先使用 eval 触发 React click（策略A，base.md 已验证）
4. 聚焦 AskUserQuestion 面板容器使用 class 选择器 `.ml-\[68px\].rounded-\[10px\]`
