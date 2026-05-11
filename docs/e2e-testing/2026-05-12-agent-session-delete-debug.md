# E2E 测试计划：Agent Session 删除失败调试

## 测试简述
用户反馈：部分 Agent Session（标题为 "hello"、"/superpowers..."）无法删除。右键菜单正常显示，确认对话框正常弹出，但点击对话框中的"删除"按钮后无任何反应——对话框不关闭，session 也未删除。目标是定位 API 失败的根因并修复。

## 测试目标列表
- [x] 目标1：在浏览器中复现删除失败的问题
- [x] 目标2：查看 DELETE 请求的实际响应（状态码、响应体）
- [x] 目标3：定位根因并修复代码
- [x] 目标4：验证修复后删除功能正常

## 测试方案
启动开发服务器 → 导航到首页 → 在侧边栏找到目标 Agent Session → 右键点击 → 点击"删除" → 在确认对话框确认 → 通过 DevTools Network 面板观察 DELETE 请求 → 分析失败原因 → 修复 → 重新验证。

## 测试用例列表

### 目标 1：复现删除失败问题

**测试用例 1.1：删除 "/superpowers..." session** ✅
- **测试数据**：Agent Session "/superpowers..." (ID: 557c4add-...)
- **Given**：开发服务器已启动 → 导航到 http://localhost:5173 → 侧边栏可见，"/superpowers..." 卡片存在
- **When**：eval dispatchEvent contextmenu → 点击"删除" → 在确认对话框中点击"删除"
- **Then**：确认对话框不关闭，session 未删除。Network 面板显示 DELETE 请求为 [pending] 状态，从未完成。

**测试用例 1.2：删除 "hello, what ..." session** ✅（修复后验证）
- **测试数据**：Agent Session "hello, what ..." (ID: bf4a7847-...)
- **Given**：重启服务器后 → 导航到 http://localhost:5173
- **When**：eval dispatchEvent contextmenu → 点击"删除" → 确认对话框点击"删除"
- **Then**：DELETE 返回 200，session 从侧边栏消失，刷新后不再出现。

### 目标 2：查看 DELETE 请求响应

**测试用例 2.1：捕获 DELETE 请求详情** ✅
- **测试数据**："/superpowers..." session
- **Given**：DevTools Network 面板已打开
- **When**：在复现的故障状态下执行删除操作
- **Then**：DELETE 请求全部处于 [pending] 状态，无任何响应。且多个 DELETE 请求同时 pending（用户多次点击）。GET /api/agents/:id 请求也大量 pending。
- **关键发现**：浏览器 HTTP/1.1 连接池（6 个/origin）被 SSE EventSource 长连接耗尽。

### 目标 3：根因分析与修复 ✅

**根因**：`connectSSE()` 在用户点击不同 agent 时创建新的 EventSource 连接，但旧连接从未关闭。浏览器 HTTP/1.1 限制每个 origin 最多 6 个并发连接。累积 6 个 SSE 连接后，新的 HTTP 请求（包括 DELETE）被浏览器排队，永远无法发出。

**直接测试验证**：
1. curl 直接访问 3456 端口 DELETE → 200 成功（绕过浏览器连接限制）
2. curl 通过 Vite 代理 DELETE → 200 成功（无浏览器连接限制）
3. 浏览器中 DELETE → [pending]（连接池耗尽）
4. 重启服务器后浏览器 DELETE → 200 成功（连接池清空）

**修复 1**（`agentStore.ts:connectSSE`）：打开新 SSE 连接前关闭所有其他连接，确保同一时间只有 1 个活跃的 SSE 连接。

**修复 2**（`agentStore.ts:destroyAgent`）：保留原始错误信息，不再静默替换为 `Failed to destroy agent`。

**修复 3**（`AgentContextMenu.tsx:handleDeleteConfirm`）：添加 console.error 日志，错误时保留对话框便于重试。

### 目标 4：验证修复 ✅

**测试用例 4.1：多次点击不同 agent 后删除** ✅
- **Given**：依次点击 3 个不同 agent（模拟 SSE 连接累积场景）
- **When**：右键点击第3个 agent → 删除
- **Then**：DELETE 返回 200 → session 消失 → 刷新后不再出现

**测试用例 4.2：刷新持久删除** ✅
- **Given**：已删除 "hello, what ...", "/superpowers...", "111 22"
- **When**：刷新页面
- **Then**：三个 session 均不出现

## 修复内容

### agentStore.ts
1. `connectSSE`：打开新连接前关闭所有其他 SSE 连接，防止连接池耗尽
2. `destroyAgent`：保留原始错误消息

### AgentContextMenu.tsx
1. `handleDeleteConfirm`：添加 console.error 日志

## 验证方案
所有测试用例的 Then 步骤均验证通过。修复后删除操作即时生效，刷新后持久删除。
