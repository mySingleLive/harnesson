# E2E 测试计划：Q&A Result Card 刷新后持久化验证

## 测试简述

验证 QA Result Card 在页面刷新后能正确显示。核心场景：创建 Agent Session → 触发 AskUserQuestion → 回答问题 → 实时验证 QA Result Card → 刷新页面 → 重新进入同一 Session → 验证 QA Result Card 仍然正确渲染。

## 测试目标列表

- [ ] 目标1：能够选择项目并创建新的 Agent Session
- [ ] 目标2：能通过 brainstorming 触发 AskUserQuestion 并回答，实时看到 QA Result Card
- [ ] 目标3：刷新页面后重新进入同一 Agent Session，聊天记录完整恢复
- [ ] 目标4：刷新后 QA Result Card 正确渲染（question → answer 格式，样式正确）
- [ ] 目标5：刷新后其他 UI 元素无回归（文本段、工具卡片正常）

## 测试方案

从首页开始，选择 harnesson 项目 → 创建新 Session → 输入 brainstorming 命令触发 Agent → 等待 AskUserQuestion 弹出 → 回答问题 → 实时验证 QA Result Card → 刷新页面 → 点击左侧同一 Session 重新进入 → 验证 QA Result Card 仍然渲染正确。前置条件：开发服务器已启动（http://localhost:5173）。

## 测试用例列表

### 目标 1：选择项目并创建新 Session

**测试用例 1.1：导航并选择项目**
- **测试数据**：项目名称: harnesson, 端口: http://localhost:5173
- **Given**：导航到 http://localhost:5173 → 等待页面加载
- **When**：使用 eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开项目下拉 → 等待下拉菜单出现 → click harnesson 项目按钮
- **Then**：页面显示聊天界面 → textarea placeholder 为 "Message Harnesson..."

**测试用例 1.2：创建新 Session**
- **测试数据**：任务标题: "测试QA卡片持久化"
- **Given**：已在 harnesson 项目页面，输入框已聚焦
- **When**：type "测试QA卡片持久化" → keyboard_press Enter 发送
- **Then**：Agent Session 创建成功 → 显示 Agent 聊天面板 → ThinkingBar 动画出现

### 目标 2：触发 AskUserQuestion 并验证实时 QA Result Card

**测试用例 2.1：发送 brainstorming 命令触发 AskUserQuestion**
- **测试数据**：slash command: `/superpowers:brainstorming 测试功能设计`
- **Given**：Agent 已回复初始消息，输入框可用
- **When**：type `/superpowers:brainstorming 测试功能设计` → keyboard_press Enter 发送
- **Then**：Agent 开始处理 → ThinkingBar 动画显示

**测试用例 2.2：回答 AskUserQuestion 并验证实时 QA Result Card**
- **测试数据**：选择第一个选项
- **Given**：AskUserQuestion 弹出框已出现
- **When**：click 第一个选项按钮
- **Then**：弹出框消失 → Agent 继续处理 → 聊天流中出现 QA Result Card（question → answer 格式）

**测试用例 2.3：截图记录实时状态**
- **测试数据**：无
- **Given**：QA Result Card 已在聊天流中显示
- **When**：screenshot 截图
- **Then**：截图可见 QA Result Card（深紫色背景 #252540，灰色问题 + 蓝色答案）

### 目标 3：刷新页面后重新进入同一 Session

**测试用例 3.1：刷新页面**
- **测试数据**：无
- **Given**：Agent Session 有完整聊天记录（含 QA Result Card）
- **When**：navigate 到 http://localhost:5173（刷新页面）
- **Then**：页面重新加载 → 左侧导航栏显示之前的 Agent Session 列表

**测试用例 3.2：重新进入同一 Session**
- **测试数据**：无
- **Given**：页面已刷新，左侧显示 Session 列表
- **When**：click 刚才创建的 Agent Session 条目（"测试QA卡片持久化"）
- **Then**：Agent 聊天面板打开 → 聊天记录完整恢复（用户消息、Agent 回复、QA Result Card 均可见）

### 目标 4：验证刷新后 QA Result Card 正确渲染

**测试用例 4.1：检查 QA Result Card 内容和样式**
- **测试数据**：无
- **Given**：已重新进入 Agent Session，聊天记录已恢复
- **When**：screenshot 截图查看聊天流
- **Then**：
  - QA Result Card 在聊天流中可见
  - 卡片显示 question → answer 格式
  - 答案文字颜色为蓝色（#00bfff）
  - 问题文字颜色为灰色（#9ca3af）
  - 卡片背景为深紫色（#252540）

**测试用例 4.2：eval 验证 QA Result Card DOM 存在**
- **测试数据**：无
- **Given**：已重新进入 Agent Session
- **When**：eval `document.querySelectorAll('[style*="background: rgb(37, 37, 64)"]')` 或检查 QA Result Card 特征元素
- **Then**：返回至少 1 个匹配元素（证明 QA Result Card 已渲染）

### 目标 5：无回归验证

**测试用例 5.1：验证其他 UI 元素正常**
- **测试数据**：无
- **Given**：已完成刷新后验证
- **When**：截图查看整个聊天页面
- **Then**：
  - 文本段正常显示（Agent 的文字回复）
  - 工具卡片正常渲染（如有）
  - 顶部标题栏显示正确的项目名和分支
  - 输入框可用

## 验证方案

### 通过标准
- 所有测试用例的 Then 步骤均验证通过
- 刷新后 QA Result Card 仍然在聊天流中正确显示
- 聊天记录完整恢复，无丢失

### 失败标准
- 刷新后 QA Result Card 消失或样式异常
- 聊天记录丢失或不完整
- 刷新后出现重复消息

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
