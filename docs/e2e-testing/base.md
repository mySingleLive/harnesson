# E2E 测试经验库

## Agent Session 管理类

### DELETE 请求 pending 排查
- **策略**：检查浏览器 HTTP/1.1 连接池是否被 SSE/EventSource 耗尽（max 6 per origin）
- **关键步骤**：DevTools Network 面板查看 DELETE 请求状态 → 若 [pending] 检查是否有大量长连接 → curl 直接测试服务端排除后端问题 → 检查 SSE EventSource 连接数 → 修复连接泄漏
- **注意**：浏览器 HTTP/1.1 限制 6 个并发连接/origin，EventSource 占用一个连接。多个 agent 同时持有 SSE 连接会耗尽连接池，导致新请求排队。

### 右键菜单删除 Agent Session
- **策略 A（推荐）**：eval 触发 contextmenu 事件 → click "删除" → click 确认按钮
  - 关键步骤：eval `dispatchEvent(new MouseEvent('contextmenu', ...))` 在目标按钮上 → await_element 确认菜单出现 → click "删除" → await_element 确认对话框出现 → click 确认"删除"按钮 → await_element 验证 agent 卡片消失
  - 注意：Sidebar 中 agent 按钮 textContent 可能含 `\n` 换行符（如 "hello\nworld"），搜索时需注意；`fireEvent.click` 只触发 click 事件不触发 mousedown，真实浏览器中 mousedown 先于 click 触发

## 导航类

### 进入首页
- **策略**：直接导航到应用根 URL
- **关键步骤**：navigate http://localhost:5173 → await_element 等待页面加载

### 选择项目
- **策略 A（推荐）**：eval 触发 React 点击 → click 选择项目
  - 关键步骤：eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开下拉菜单 → await_element 等待菜单出现 → click `//div[contains(@class,'absolute')]//button[contains(.,'harnesson') and contains(@class,'text-left')]` 选择项目
  - 验证：eval `document.querySelector('textarea')?.placeholder` 应为 "Message Harnesson..."
- **策略 B**：直接 click folder 按钮 → click 项目名
  - 关键步骤：click folder 按钮 → await_element 下拉菜单 → click 项目名
  - 注意：直接 click 不稳定，有时下拉菜单不会打开

## 布局调试类

### Flex 子元素宽度溢出
- **策略**：检查 `min-width: auto` (flex 默认值) 是否阻止收缩
- **关键步骤**：添加 `min-w-0` 到 flex 子元素 → 验证宽度恢复预期
- **注意**：`flex: 1 1 0%` 不足以控制宽度，`min-width: auto` 会让元素扩展到内容最小宽度

## Agent 交互类

### 触发 AskUserQuestion
- **策略 A（推荐）**：使用 brainstorming skill 触发 Agent 产生问答
  - 关键步骤：输入 `/superpowers:brainstorming <话题>` → Enter 发送 → 等待 30-60 秒 Agent 回复 → AskUserQuestion 面板出现
- **注意**：Agent 回复较慢，需耐心等待；AskUserQuestion 触发时机不确定

## AskUserQuestion 面板交互类

### 聚焦 AskUserQuestion 面板容器
- **策略**：使用 eval 聚焦面板容器 div
- **关键步骤**：`document.querySelector('.ml-\\[68px\\].rounded-\\[10px\\]').focus()` → 然后 keyboard_press 操作
- **注意**：直接 click 面板容器无法使其获得焦点（activeElement 仍为 BODY）；`[tabindex="0"]` 选择器会匹配到其他元素（如 ModelDropdown），必须用 class 选择器精确定位

### 键盘操作 AskUserQuestion
- **策略**：先 eval 聚焦面板 → 再 keyboard_press
- **关键步骤**：eval 聚焦 → keyboard_press ArrowDown/ArrowUp/Escape/Enter/Space
- **注意**：keyboard_press 不支持 Ctrl+字母组合（如 Ctrl+N），仅支持特殊键；Ctrl+N/P 导航无法在 e2e 中直接测试

### 视觉状态验证
- **策略**：通过 eval 检查选项按钮的 className
- **关键步骤**：`document.querySelectorAll('button[class*="rounded-lg border"]')[i].className` → 检查是否包含 `border-harness-accent`（聚焦态）或 `border-[#3a3a5c]`（悬停态）
- **三种状态 CSS 类**：
  - 普通态：`border-[#2a2a4e] bg-[#1a1a2e]`
  - 聚焦态：`border-harness-accent bg-[#1e1e3a] shadow-[0_0_0_2px_rgba(139,92,246,0.25)]`
  - 悬停态：`border-[#3a3a5c] bg-[#1c1c32]`

## 项目管理类

### 打开文件夹添加项目
- **策略**：下拉菜单 click "打开文件夹" → 用户手动选择文件夹（原生对话框）
- **关键步骤**：click `button:has(svg.lucide-folder)` 打开下拉菜单 → click `button:has(svg.lucide-folder-open)` → 等待原生对话框 → 用户选择文件夹 → 验证项目出现在下拉框
- **注意**：Windows 上 PowerShell `-NonInteractive` 标志会阻止 `FolderBrowserDialog` 弹出（已修复）；原生对话框不属于浏览器操作范畴，需用户手动完成；浏览器工具无法操作原生对话框

### 选择已存在项目
- **策略 A（推荐）**：打开下拉菜单 → eval 点击项目按钮
  - 关键步骤：click `button:has(svg.lucide-folder)` 打开菜单 → eval `document.querySelectorAll('button')[N].click()` 选择目标项目 → 验证下拉框文本从 "No Project" 变为项目名
- **注意**：需要先通过 eval 确定项目按钮的索引位置

## 布局模式类

### 底部悬浮输入框 + 滚动内容区
- **策略**：输入框 absolute 定位 + 滚动容器动态 padding-bottom
- **关键步骤**：
  1. 外层容器 `relative flex flex-col h-full`
  2. 滚动容器 `flex-1 min-h-0 overflow-y-auto`，`style={{ paddingBottom: inputHeight }}`
  3. 输入框容器 `absolute bottom-0 left-0 right-0 z-10 bg-<panel-bg>`
  4. 使用 `ResizeObserver` + `entry.borderBoxSize[0].blockSize` 测量输入框高度
  5. Sticky 元素（如 scroll-to-bottom 按钮）的 bottom 需动态偏移 `inputHeight`
- **注意**：`contentRect.height` 不含 padding，需用 `borderBoxSize` 获取完整高度；`hasPendingQuestion` 变化时需重新 observe
