# E2E 测试计划：Agent 面板输入框周围背景全透明

## 测试简述
修复并验证 Agent 面板底部的聊天输入框周围背景为全透明，移除 RichTextInput 的硬编码 `#2a2a48` 背景色和输入包装器的 `bg-harness-chat`，使输入区域与 AgentPanel 背景融为一体。

## 测试目标列表
- [ ] 目标1：RichTextInput 容器背景从硬编码 `#2a2a48` 改为透明
- [ ] 目标2：输入包装器背景从 `bg-harness-chat` 改为透明
- [ ] 目标3：输入区域在视觉上与 AgentPanel 背景融合，无额外色块

## 测试方案
导航到首页 → 选择项目打开 Agent 面板 → 检查输入框区域的背景色 → 修改代码 → 重新验证

## 测试用例列表

### 目标 1：RichTextInput 容器背景透明

**测试用例 1.1：验证 RichTextInput 容器背景为透明**
- **测试数据**：任意项目（如 harnesson）
- **Given**：开发服务器已启动 → 导航到 http://localhost:5173 → 选择项目打开 Agent 面板
- **When**：查看 Agent 面板底部聊天输入区域
- **Then**：RichTextInput 外层容器无硬编码背景色（`background` style 不存在或为 transparent）→ 输入框区域与 AgentPanel 背景颜色一致

### 目标 2：输入包装器背景透明

**测试用例 2.1：验证输入包装器无 bg-harness-chat**
- **测试数据**：任意项目（如 harnesson）
- **Given**：同 1.1
- **When**：查看 Agent 面板底部输入包装器 div
- **Then**：输入包装器无 `bg-harness-chat` 类 → 背景透明

### 目标 3：视觉融合验证

**测试用例 3.1：输入区域与面板背景融为一体**
- **测试数据**：任意项目（如 harnesson）
- **Given**：同 1.1
- **When**：截图查看 Agent 面板底部输入区域
- **Then**：输入框周围无独立色块 → 与 AgentPanel 整体背景（`#191930`）融为一体

## 验证方案
所有测试用例的 Then 步骤均验证通过即为通过。

## 操作规则
### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"/"提交"按钮，**禁止**用 `\n` 字符
4. 下拉选择：用 select 操作，不要手动模拟键盘
5. 按钮点击：直接用 click 操作定位按钮元素
6. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
- 开发服务器：`pnpm dev`，端口 `http://localhost:5173`
- Agent 面板选择项目：eval 触发 folder 按钮 → click 选择项目
