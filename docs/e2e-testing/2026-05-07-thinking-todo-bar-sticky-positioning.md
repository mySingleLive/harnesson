# E2E 测试计划：ThinkingBar/TodoBar 粘性定位修复验证

## 测试简述

验证 ThinkingBar 和 TodoBar 的 sticky 定位改动：消息少时（无滚动条），ThinkingBar/TodoBar 应紧跟在最新消息下方；消息多时（有滚动条），ThinkingBar/TodoBar 应固定在输入框上方（sticky bottom-0）。

## 测试目标列表

- [ ] 目标1：消息少时，ThinkingBar 紧跟在最新消息下方（无大间距）
- [ ] 目标2：消息多时，ThinkingBar 固定在 scroll 容器底部（sticky 生效）
- [ ] 目标3：消息少时，TodoBar 紧跟在消息下方
- [ ] 目标4：scroll-to-bottom 按钮在 ThinkingBar 上方正常显示

## 测试方案

从首页开始，选择 harnesson 项目 → 发送消息创建 Agent → 等待 Agent 思考 → 截图验证 ThinkingBar 位置 → 继续交互产生更多消息 → 向上滚动 → 截图验证 sticky 行为。前置条件：开发服务器已启动（http://localhost:5173）。

## 测试用例列表

### 目标 1：消息少时，ThinkingBar 紧跟在最新消息下方

**测试用例 1.1：新会话发送消息后 ThinkingBar 位置**
- **测试数据**：消息内容 "hello, what can you do?"
- **Given**：导航到 http://localhost:5173 → 选择 harnesson 项目 → 等待 New Session 页面加载
- **When**：在输入框中输入 "hello, what can you do?" → 点击发送按钮 → 等待 "Thinking" 文本出现
- **Then**：截图验证 → ThinkingBar 应出现在用户消息正下方 → 用户消息底部与 ThinkingBar 顶部之间不应有大面积空白（间距应 < 30px）

### 目标 2：消息多时，ThinkingBar 固定在 scroll 容器底部

**测试用例 2.1：多轮对话后滚动时 ThinkingBar sticky 行为**
- **测试数据**：发送第二条消息 "tell me more about your features"
- **Given**：测试用例 1.1 通过 → 等待 Agent 完成回复（ThinkingBar 消失）→ Agent 回复内容较长
- **When**：在输入框中输入 "tell me more about your features" → 点击发送按钮 → 等待 "Thinking" 文本出现 → 使用 eval 执行 scroll 向上滚动（`scrollContainer.scrollTop = scrollContainer.scrollTop - 200`）
- **Then**：截图验证 → ThinkingBar 应固定在 scroll 容器底部（紧贴输入框上方） → 不随滚动消失

### 目标 3：消息少时，TodoBar 紧跟在消息下方

**测试用例 3.1：Agent 创建 Todo 时的 TodoBar 位置**
- **测试数据**：消息内容 "help me implement a login feature with tests"
- **Given**：导航到 http://localhost:5173 → 选择 harnesson 项目 → 等待 New Session 页面加载
- **When**：输入 "help me implement a login feature with tests" → 点击发送按钮 → 等待 TodoBar 出现（await_text "todo" 或 "pending"）
- **Then**：截图验证 → TodoBar 应出现在消息区域下方 → 用户消息与 TodoBar 之间不应有大面积空白

### 目标 4：scroll-to-bottom 按钮在 ThinkingBar 上方正常显示

**测试用例 4.1：滚动后 scroll-to-bottom 按钮显示**
- **测试数据**：同测试用例 2.1 的会话
- **Given**：测试用例 2.1 通过 → Agent 正在思考中（ThinkingBar 可见）
- **When**：使用 eval 将 scrollContainer 向上滚动至少 200px
- **Then**：截图验证 → scroll-to-bottom 按钮（向下箭头）应可见 → 应显示在 ThinkingBar 上方（z-index 正确，不被遮挡）

## 验证方案

所有测试用例的 Then 步骤均通过截图视觉验证。核心判断标准：
1. 消息少时：ThinkingBar/TodoBar 与最新消息之间无明显空白间距
2. 消息多时：滚动后 ThinkingBar/TodoBar 不随内容滚走，固定在输入框上方
3. scroll-to-bottom 按钮不被 ThinkingBar 遮挡

## 操作规则

### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后点击发送按钮或按回车键，**禁止**用 `\n` 字符
4. 下拉选择：用 select 操作，不要手动模拟键盘
5. 按钮点击：直接用 click 操作定位按钮元素
6. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. 选择项目：点击顶部栏项目下拉菜单（Folder + ChevronDown 图标）→ 点击目标项目名称
2. Agent 思考时间较长，需要使用 await_text "Thinking" 等待 ThinkingBar 出现
3. 截图验证为主，辅以 eval 检查 DOM 结构确认定位行为
