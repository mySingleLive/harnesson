# E2E 测试计划：Agent 聊天面板滚动到底 + 输入框悬浮固定

## 测试简述
修复 Agent 聊天面板的滚动行为和输入框定位。当前输入框在正常文档流中（`shrink-0`），导致滚动区域被限制在输入框上方。需将输入框改为悬浮固定在面板底部，同时确保滚动到底部时文字不被输入框遮挡。

## 测试目标列表
- [x] 目标1：滚动条可以滚动到面板最底部（内容可以滚动到输入框下方）
- [x] 目标2：输入框以悬浮方式固定在面板底部（不随滚动移动）
- [x] 目标3：滚动到最底部时输入框不遮挡任何文字内容

## 测试方案
启动开发服务器 → 导航到首页 → 选择项目打开 Agent 面板 → 发送多条消息产生足够内容 → 测试滚动行为 → 验证输入框悬浮 → 验证底部不遮挡文字。

## 测试用例列表

### 目标 1：滚动条可以滚动到面板最底部

**测试用例 1.1：滚动到底部验证**
- **测试数据**：项目 harnesson
- **Given**：开发服务器已启动 → 导航到 http://localhost:5173 → 等待首页加载 → 选择项目 harnesson → 等待 Agent 聊天面板打开 → 面板中有足够消息（需发送消息产生滚动）
- **When**：滚动面板到最底部 → 检查滚动位置
- **Then**：`scrollHeight - scrollTop - clientHeight` 差值应接近 0（完全到底）

### 目标 2：输入框悬浮固定在面板底部

**测试用例 2.1：输入框悬浮不随滚动移动**
- **测试数据**：项目 harnesson
- **Given**：面板中有足够消息可滚动
- **When**：向下滚动到底部 → 再向上滚动 → 观察输入框位置
- **Then**：输入框始终固定在面板底部，不随滚动移动 → 输入框的 position 为 absolute 或 fixed

### 目标 3：滚动到最底部时输入框不遮挡文字

**测试用例 3.1：底部文字可见性**
- **测试数据**：项目 harnesson
- **Given**：面板中有消息 → 滚动到最底部
- **When**：检查最后一条消息的位置
- **Then**：最后一条消息的底部应在输入框顶部之上 → 所有文字内容可见可读 → 没有文字被输入框遮挡

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

## 测试结果：通过 ✅

### 代码修复

**文件**: `apps/web/src/components/layout/AgentPanel.tsx`

**修改内容**:

1. **输入框悬浮定位** — 将输入框容器从 `shrink-0`（正常文档流）改为 `absolute bottom-0 left-0 right-0 z-10 bg-harness-chat`，使其浮动在面板底部

2. **动态 padding-bottom** — 使用 `ResizeObserver` + `borderBoxSize` 测量输入框容器高度，动态设置滚动容器的 `padding-bottom`，确保内容可滚动到输入框上方

3. **Sticky 元素偏移** — ThinkingBar 和 scroll-to-bottom 按钮的 `bottom` 值改为动态 `inputHeight` 和 `inputHeight + 8`，使其浮动在输入框上方

关键 diff:
```diff
// 输入框容器
- <div className={`shrink-0 px-3 pb-3 ...`}>
+ <div ref={inputWrapperRef} className={`absolute bottom-0 left-0 right-0 z-10 bg-harness-chat px-3 pb-3 ...`}>

// 滚动容器
- <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto relative">
+ <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto relative" style={{ paddingBottom: inputHeight }}>

// ResizeObserver
+ useEffect(() => {
+   const el = inputWrapperRef.current;
+   if (!el) return;
+   const observer = new ResizeObserver((entries) => {
+     for (const entry of entries) {
+       setInputHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
+     }
+   });
+   observer.observe(el);
+   return () => observer.disconnect();
+ }, [hasPendingQuestion]);
```

### 验证结果

| 目标 | 指标 | 结果 |
|------|------|------|
| 滚动到面板最底部 | `scroll容器bottom === panel bottom` (diff=0) | ✅ 通过 |
| 滚动到绝对底部 | `scrollHeight - scrollTop - clientHeight = 0` | ✅ 通过 |
| 输入框悬浮 | `input position = absolute`, `z-index: 10` | ✅ 通过 |
| 底部文字不被遮挡 | `lastMsgBottom === inputTop` (差 0.008px) | ✅ 通过 |
| 动态padding匹配 | `padding-bottom === inputHeight` (129px) | ✅ 通过 |
