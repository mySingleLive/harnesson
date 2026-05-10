# E2E 测试计划：页面全屏布局与 Agent 输入框显示修复

## 测试简述
修复两个布局问题：1) 页面整体未满屏显示（只显示一半不到）；2) Agent 聊天面板中输入框未正常显示。根因是 `globals.css` 缺少 `html, body, #root { height: 100%; }`，导致 flex 高度链断裂。

## 测试目标列表
- [x] 目标1：首页满屏显示，页面占满整个浏览器窗口
- [x] 目标2：Agent 聊天面板打开后，底部输入框（RichTextInput）正常显示

## 测试方案
修复 `globals.css` 添加 `html, body, #root { height: 100%; }` → 启动开发服务器 → 导航到首页验证页面满屏 → 打开 Agent 聊天面板验证输入框正常显示。

## 测试用例列表

### 目标 1：首页满屏显示

**测试用例 1.1：页面占满整个浏览器窗口**
- **测试数据**：无需特殊数据
- **Given**：启动开发服务器 → 导航 http://localhost:5173
- **When**：等待首页加载完成
- **Then**：页面应占满整个浏览器窗口 → 主内容区域不应有大面积空白 → eval 检查 `document.querySelector('#root > div')` 的 `clientHeight` 应接近 `window.innerHeight`

### 目标 2：Agent 输入框正常显示

**测试用例 2.1：Agent 聊天面板底部输入框可见**
- **测试数据**：项目 harnesson
- **Given**：首页已加载 → 选择项目 harnesson → 等待 Agent 聊天面板打开
- **When**：观察 Agent 聊天面板底部
- **Then**：底部 RichTextInput 输入框应可见 → 输入框内应显示 placeholder 文字 "Send a message..." → 输入框下方应显示快捷键提示文字

## 验证方案
所有测试用例的 Then 步骤均验证通过即为通过。

## 操作规则
### 默认规则
1. 直接用浏览器进行端到端测试，不写任何脚本
2. 以本文档的测试步骤为操作流程依据
3. 输入框操作：输入完成后用回车键或点击"发送"/"提交"按钮，**禁止**用 `\n` 字符
4. 等待策略：操作后等待页面响应（await_element / await_text），不要假设即时生效

### 项目特定规则
1. 开发服务器端口：http://localhost:5173
2. 项目选择方式：eval `document.querySelector('button:has(svg.lucide-folder)').click()` 打开下拉菜单 → click 项目名
