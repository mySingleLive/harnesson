# E2E 测试计划：Subagent 实时树形展示验证

## 测试简述

验证 Subagent 调用的实时流式树形展示功能：旧消息（嵌套 JSON 格式）的 Agent 卡片仍然正确渲染为树形；新消息触发 Agent 执行时，StreamingAgentCard 实时展示子代理的工具调用和文本输出，支持 running/completed 状态样式切换和展开折叠交互。

## 测试目标列表

- [ ] 目标1：能够选择项目并进入空白聊天页面
- [ ] 目标2：发送消息触发 Agent 执行，验证 Agent 工具卡片实时出现（紫色 running 状态）
- [ ] 目标3：Agent 执行过程中子事件（工具调用/文本）实时显示在卡片内
- [ ] 目标4：Agent 完成后卡片自动折叠，状态变为 completed（绿色样式）
- [ ] 目标5：点击已折叠的 Agent 卡片可展开查看子事件树
- [ ] 目标6：子事件树中连接线（border-left）正确连接父子节点
- [ ] 目标7：查看已有聊天记录，验证旧格式 Agent 卡片渲染为树形（向后兼容）
- [ ] 目标8：无回归（文本段、普通工具卡片、Q&A Result Card 正常渲染）

## 测试方案

从首页开始，选择 harnesson 项目 → 新建 Session → 发送需要 Agent 搜索代码库的消息触发 Agent 工具调用 → 实时观察 StreamingAgentCard 渲染 → 等待完成验证状态切换 → 点击展开验证树形结构 → 返回历史会话验证旧格式兼容。前置条件：开发服务器已启动（http://localhost:5173）。

## 测试用例列表

### 目标 1：选择项目并进入空白聊天页面

**测试用例 1.1：导航并选择项目**
- **测试数据**：项目名称: harnesson, 端口: http://localhost:5173
- **Given**：导航到 http://localhost:5173 → 等待页面加载
- **When**：使用 eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开项目下拉 → 等待下拉菜单出现 → click harnesson 项目按钮
- **Then**：页面显示聊天界面 → textarea placeholder 为 "Message Harnesson..."

**测试用例 1.2：创建新会话**
- **测试数据**：无
- **Given**：已在 harnesson 项目页面
- **When**：点击侧边栏的 "New Session" 或 "+" 按钮（如有历史会话列表）
- **Then**：进入空白聊天页面，输入框可用

### 目标 2-6：新消息实时展示 Agent 树形

**测试用例 2.1：发送消息触发 Agent 执行**
- **测试数据**：消息内容: "please explore this project and tell me what tech stack it uses"
- **Given**：已在空白聊天页面，输入框已聚焦
- **When**：type "please explore this project and tell me what tech stack it uses" → keyboard_press Enter 发送
- **Then**：
  - 消息发送成功 → 显示 ThinkingBar 动画
  - 等待 30-60 秒 Agent 开始执行
  - 截图确认 Agent 工具卡片出现

**测试用例 3.1：验证 Agent 卡片实时显示（running 状态）**
- **测试数据**：无
- **Given**：Agent 已开始执行（测试用例 2.1 通过）
- **When**：等待 Agent 工具卡片出现 → 截图查看
- **Then**：
  - 聊天流中出现 Agent 卡片（🤖 Agent 标识）
  - 卡片背景为紫色半透明（`rgba(168, 85, 247, 0.08)`）
  - 卡片边框为紫色（`1px solid rgba(168, 85, 247, 0.2)`）
  - 状态显示 "running..." 带紫色脉冲动画点
  - 卡片自动展开，内部显示子事件（工具调用/文本）
  - 子事件实时出现（不是完成后一次性展示）

**测试用例 4.1：验证 Agent 完成后状态切换**
- **测试数据**：无
- **Given**：Agent 执行中（测试用例 3.1 通过）
- **When**：等待 Agent 执行完成（子事件不再新增，状态从 running 变为 completed）→ 截图查看
- **Then**：
  - 卡片背景变为绿色半透明（`rgba(74, 222, 128, 0.06)`）
  - 卡片边框变为绿色（`1px solid rgba(74, 222, 128, 0.15)`）
  - 状态显示 "✓" + 耗时（如 "✓ 5.2s"）
  - 卡片自动折叠（子事件树隐藏）
  - 紫色脉冲动画消失

**测试用例 5.1：验证点击展开 Agent 卡片**
- **测试数据**：无
- **Given**：Agent 已完成并自动折叠（测试用例 4.1 通过）
- **When**：click Agent 卡片的头部区域（包含 🤖 Agent 标识的按钮）
- **Then**：
  - 卡片展开，显示子事件树
  - 可以看到子代理内部的工具调用（如 Glob、Read 等）
  - 可以看到子代理的文本输出（💬 标识，灰色斜体）
  - 再次点击可折叠

**测试用例 6.1：验证子事件树连接线**
- **测试数据**：无
- **Given**：Agent 卡片已展开（测试用例 5.1 通过）
- **When**：截图查看子事件树区域
- **Then**：
  - 子事件左侧有竖直连接线（border-left，灰色 `#374151` 级别）
  - 连接线从父 Agent 延伸到所有子事件
  - 子事件之间有适当间距
  - 工具调用显示工具名称和状态

### 目标 7：旧消息向后兼容

**测试用例 7.1：查看已有聊天记录中的 Agent 卡片**
- **测试数据**：无
- **Given**：已完成目标 2-6 的测试
- **When**：点击侧边栏中的历史会话（之前有 Agent 调用的会话）→ 等待消息加载 → 截图查看 Agent 卡片
- **Then**：
  - 旧格式的 Agent 卡片（嵌套 JSON）正确渲染为树形结构
  - 显示子事件树（不是旧的扁平格式）
  - 卡片状态为 completed（绿色样式）
  - 点击可展开查看子事件

### 目标 8：无回归验证

**测试用例 8.1：验证其他 UI 元素正常**
- **测试数据**：无
- **Given**：已完成所有测试
- **When**：截图查看整个聊天页面 + 检查浏览器控制台
- **Then**：
  - 文本段正常显示（Agent 的文字回复，Markdown 渲染正确）
  - 普通工具卡片正常渲染（非 Agent 工具调用）
  - 浏览器控制台无新增错误

## 验证方案

### 通过标准
- 所有测试用例的 Then 步骤均验证通过
- StreamingAgentCard 实时流式展示正常工作
- running/completed 状态样式正确切换
- 树形结构渲染正确（连接线、子事件、展开折叠）
- 旧格式消息向后兼容

### 失败标准
- Agent 卡片不出现或样式异常
- 子事件不是实时展示（完成后才一次性出现）
- 状态未从 running 切换为 completed
- 点击无法展开 Agent 卡片
- 旧格式消息渲染失败或报错
- 控制台有新增错误

## 操作规则

### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"/"提交"按钮，**禁止**用 `\n` 字符
4. 下拉选择：用 select 操作，不要手动模拟键盘
5. 按钮点击：直接用 click 操作定位按钮元素
6. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. Agent 回复较慢（LLM 处理），需等待 30-90 秒，使用 await_text 或截图确认状态
2. 选择项目优先使用 eval 触发 React click（策略A，base.md 已验证）
3. Agent 工具调用出现时机不确定，需耐心等待并定期截图查看
4. 验证 CSS 样式时使用 eval 检查 DOM 元素的 className/style
