# E2E 测试计划：Agent 聊天面板滚动到底 + 输入框悬浮固定（修订版）

## 测试简述
用户反馈 Agent 聊天面板（非最大化模式）中，滚动行为存在问题：滚动条无法滚动到面板最底部，似乎只能滚动到输入框上方。需要确保：滚动条可滚动到面板最底部、输入框以悬浮方式固定在底部、滚动到底部时输入框不遮挡文字。

当前代码已经实现了 ResizeObserver + 动态 padding-bottom 方案，但需要验证实际效果并修复发现的问题。

## 测试目标列表
- [x] 目标1：滚动条可以滚动到面板最底部（scrollHeight - scrollTop - clientHeight ≈ 0）
- [x] 目标2：输入框以悬浮方式固定在面板底部（absolute 定位，不随滚动移动）
- [x] 目标3：滚动到最底部时输入框不遮挡任何文字内容

## 测试方案
启动开发服务器 → 导航到首页 → 选择项目打开 Agent 面板 → 检查面板中消息的滚动行为 → 验证输入框悬浮 → 发送新消息产生滚动 → 验证底部不遮挡文字。

## 测试用例列表

### 目标 1：滚动条可以滚动到面板最底部

**测试用例 1.1：验证滚动可以到达面板底部**
- **测试数据**：项目 harnesson
- **Given**：开发服务器已启动 → 导航到 http://localhost:5173 → 选择项目 harnesson → Agent 面板打开
- **When**：检查滚动容器的 scrollHeight、scrollTop、clientHeight
- **Then**：`scrollHeight - scrollTop - clientHeight` 差值应接近 0（scrollTop 应等于 scrollHeight - clientHeight，即完全滚动到底）

### 目标 2：输入框悬浮固定在面板底部

**测试用例 2.1：输入框悬浮不随滚动移动**
- **测试数据**：项目 harnesson
- **Given**：面板中有消息 → 滚动位置不在底部
- **When**：检查输入框容器的 position 样式和位置
- **Then**：输入框 position 为 absolute 或 fixed → 输入框始终在面板底部，不随消息滚动移动

### 目标 3：滚动到最底部时输入框不遮挡文字

**测试用例 3.1：底部文字可见性**
- **测试数据**：项目 harnesson
- **Given**：面板中有足够消息可滚动 → 滚动到最底部
- **When**：检查最后一条消息底部位置 与 输入框顶部位置
- **Then**：最后一条消息底部应在输入框顶部之上 → 所有文字可见 → 没有文字被输入框遮挡

## 验证方案
所有测试用例的 Then 步骤均验证通过即为通过。

## 操作规则
### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键提交，禁止用 `\n` 字符
4. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. 开发服务器端口：http://localhost:5173
2. 项目选择方式：eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开下拉菜单 → click 项目名

## 测试结果：通过 ✅

### 代码修复

**文件**: `apps/web/src/components/layout/AgentPanel.tsx`

**修改内容**: 将 `inputHeight` 加入 `useAutoScroll` 的依赖数组，确保输入框高度动态变化时（编辑器展开/收缩），自动滚动机制能重新计算并滚动到底部。

```diff
- const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef, [messages, isStreaming]);
+ const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef, [messages, isStreaming, inputHeight]);
```

### 验证结果

| 目标 | 指标 | 结果 |
|------|------|------|
| 滚动到底部 | `scrollHeight - scrollTop - clientHeight = -0.5` ≈ 0 | ✅ 通过 |
| 滚动容器延伸至面板底部 | scroll 容器 bottom (1456) = panel bottom (1456) | ✅ 通过 |
| 输入框悬浮 | `position: absolute, bottom: 0px, z-index: 10` | ✅ 通过 |
| 动态padding匹配 | `padding-bottom: 129px` = 输入框高度 129px | ✅ 通过 |
| 底部文字不被遮挡 | 最后一条消息 bottom (1326.88) < 输入框 top (1327), covered: false | ✅ 通过 |
| Scroll-to-bottom 按钮 | sticky 定位, `bottom: 137px` (= inputHeight + 8), 点击后正确滚动到底 | ✅ 通过 |
