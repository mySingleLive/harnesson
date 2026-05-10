# E2E 测试计划：Agent 面板最大化布局修复

## 测试简述
修复 Agent 聊天面板最大化时的两个布局问题：1) 底部输入框（RichTextInput）消失；2) 所有工具卡片的右侧状态徽章（badge，如 ✓/✗/running...）未能正常显示。

根据代码分析，问题可能与 AgentPanel 在最大化时的高度链断裂（`h-full` 在 flex row 中的百分比高度解析），以及工具卡片中 badge 使用 `ml-auto` 但在长摘要内容挤压下被推出可视区域有关。

## 测试目标列表
- [x] 目标1：Agent 面板最大化时，底部输入框正常显示
- [x] 目标2：Agent 面板最大化时，工具卡片的右侧状态徽章正常显示

## 测试结果：通过 ✅

### 根因分析

**问题1：底部输入框消失**

`AgentPanel` 外层 div 含 `flex-1` 时，CSS flexbox 默认 `min-width: auto` 阻止收缩。面板最大化后，内容撑开面板宽度至 1,172,824px（远超视口 1200px），导致使用 `mx-auto max-w-[800px]` 的输入框居中在屏幕外。

**修复**：`AgentPanel.tsx:85` — 添加 `min-w-0` class：
```diff
-<div className={`relative flex h-full flex-col bg-harness-chat ${widthStyle}`}
+<div className={`relative flex h-full flex-col bg-harness-chat min-w-0 ${widthStyle}`}
```

**问题2：工具卡片右侧状态徽章不显示**

`CollapsibleCard` 中 `summary` 渲染为多个 `<span>` 作为 flex 子元素，长文本时挤压 `badge`（使用 `ml-auto`）超出卡片边界。

**修复**：`CollapsibleCard.tsx` — 用 `min-w-0 flex-1 overflow-hidden` 包裹 summary，badge 添加 `shrink-0`：
```diff
-{summary}
-{badge && <span className="ml-auto">{badge}</span>}
+<span className="min-w-0 flex-1 overflow-hidden">{summary}</span>
+{badge && <span className="ml-auto shrink-0">{badge}</span>}
```

### 验证结果
- 面板最大化后宽度：979px（正常，= 1200 - 220 sidebar - 1 divider）
- 输入框在 viewport 内居中显示（left: 309.5, width: 800）
- 工具卡片 badge `✓` / `✗` 均在卡片可视区域内
启动开发服务器 → 导航到首页 → 选择项目打开 Agent 面板 → 最大化面板 → 验证输入框可见 → 发送消息触发 Agent 使用工具 → 验证工具卡片右侧状态正常显示。

## 测试用例列表

### 目标 1：Agent 面板最大化时底部输入框正常显示

**测试用例 1.1：面板最大化后输入框可见**
- **测试数据**：项目 harnesson
- **Given**：开发服务器已启动 → 导航到 http://localhost:5173 → 等待首页加载 → 选择项目 harnesson → 等待 Agent 聊天面板打开
- **When**：点击面板右上角最大化按钮 → 等待面板展开
- **Then**：底部 RichTextInput 输入框应可见 → 输入框应显示 placeholder "Send a message..." → 输入框下方应显示快捷键提示

**测试用例 1.2：面板最大化后发送消息，输入框保持可见**
- **测试数据**：项目 harnesson
- **Given**：面板已最大化，输入框可见
- **When**：在输入框中输入测试消息 "hello" → 按 Enter 发送 → 等待 Agent 回复
- **Then**：Agent 回复后，底部输入框仍应可见 → 页面内容区域可滚动，输入框固定在底部

### 目标 2：Agent 面板最大化时工具卡片状态正常显示

**测试用例 2.1：工具卡片右侧状态徽章可见**
- **测试数据**：项目 harnesson
- **Given**：面板已最大化 → Agent 已产生包含工具调用（如 Read、Write、Bash 等）的消息
- **When**：观察工具卡片
- **Then**：每个已完成工具卡片的右侧应显示状态徽章（如绿色的 ✓、红色的 ✗）→ 运行中的工具卡片应显示 running... 动画 → 状态徽章不被截断或隐藏

## 验证方案
所有测试用例的 Then 步骤均验证通过即为通过。

## 操作规则
### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键提交，**禁止**用 `\n` 字符
4. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. 开发服务器端口：http://localhost:5173
2. 项目选择方式：eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开下拉菜单 → click 项目名
