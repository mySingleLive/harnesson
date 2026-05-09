# E2E 测试计划：Agent 聊天输入框粘贴纯文本

## 测试简述
验证 Agent 聊天输入框粘贴带样式的富文本时，仅保留纯文本内容，不保留任何格式（加粗、斜体、颜色、字体等）。

## 测试目标列表
- [ ] 目标1：粘贴富文本 HTML 内容应转为纯文本
- [ ] 目标2：粘贴纯文本内容应正常显示
- [ ] 目标3：粘贴图片应正常处理（回归测试）

## 测试方案
从首页导航到 Agent 对话页面，在聊天输入框中分别粘贴富文本和纯文本内容，验证显示结果。参考 base.md 中"进入首页"和"选择项目"策略。

## 测试用例列表

### 目标 1：粘贴富文本 HTML 内容应转为纯文本

**测试用例 1.1：从网页复制带样式文本粘贴**
- **测试数据**：任意网页上的带格式文本（含加粗、链接等样式）
- **Given**：导航到 http://localhost:5173 → 选择项目进入 Agent 对话页面 → 输入框可见且为空
- **When**：使用 eval 在输入框中执行 `document.execCommand('insertHTML', false, '<b>Bold</b> <i>Italic</i> <span style="color:red">Red</span>')` 模拟富文本粘贴
- **Then**：输入框中的文本应显示为 `Bold Italic Red`，无任何加粗、斜体或颜色样式 → 通过 eval 检查输入框 innerHTML 不包含 `<b>`、`<i>`、`style` 等 HTML 标签

**测试用例 1.2：通过剪贴板粘贴富文本**
- **测试数据**：一段 HTML 格式文本
- **Given**：导航到 Agent 对话页面 → 输入框可见且为空
- **When**：使用 eval 将 HTML 富文本写入剪贴板 `await navigator.clipboard.write([new ClipboardItem({'text/html': new Blob(['<b>Bold</b> <i>Italic</i>'], {type: 'text/html'}), 'text/plain': new Blob(['Bold Italic'], {type: 'text/plain'})})])` → 聚焦输入框 → keyboard_press Ctrl+V 粘贴
- **Then**：输入框中显示 `Bold Italic`，无加粗或斜体样式

### 目标 2：粘贴纯文本内容应正常显示

**测试用例 2.1：粘贴普通文本**
- **测试数据**：纯文本字符串 `Hello World`
- **Given**：导航到 Agent 对话页面 → 输入框可见且为空
- **When**：使用 eval 将纯文本写入剪贴板 → 聚焦输入框 → Ctrl+V 粘贴
- **Then**：输入框中显示 `Hello World` 文本

### 目标 3：粘贴图片应正常处理（回归测试）

**测试用例 3.1：粘贴图片文件**
- **测试数据**：截图生成的 PNG 图片
- **Given**：导航到 Agent 对话页面 → 输入框可见且为空
- **When**：通过 eval 创建一个 canvas 生成小图片并写入剪贴板 → 聚焦输入框 → Ctrl+V 粘贴
- **Then**：输入框中应出现图片预览缩略图

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
- 输入框为 contentEditable div，使用 eval 操作 DOM 进行富文本模拟
- 粘贴操作通过 clipboard API + Ctrl+V 实现
