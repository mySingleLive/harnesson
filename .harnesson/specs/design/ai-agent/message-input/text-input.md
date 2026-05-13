# 文本输入 — 前端设计

## 布局

文本输入框位于聊天面板底部，使用 `contentEditable` div 实现，高度自适应 24px 至 140px。输入框左侧有附件按钮（+ 菜单），右侧根据 `isStreaming` 状态显示发送按钮（蓝色箭头）或中止按钮（红色停止图标）。

## 组件树

```
RichTextInput
├── contentEditable div (多行文本 + 内嵌图片)
├── Hooks:
│   ├── useEmacsKeybindings    (Emacs 风格快捷键)
│   ├── useImageInput          (图片粘贴/拖拽/选择)
│   ├── useKeyboardNavigation  (输入框内键盘导航)
│   └── useSlashCompletion     (斜杠命令补全)
├── ModelDropdown (模型选择)
├── SlashCommandPopup (命令弹窗)
└── 发送/中止按钮
```

## 样式与主题

输入框最小高度 24px（单行），最大高度 140px（约 6 行），超出后 `overflow-y-auto`。输入区域有圆角边框（`rounded-lg`），聚焦时边框高亮为强调色。

## 交互方式

**发送逻辑**：
- 输入非空且非输入法组合状态时，Enter 发送消息
- Shift+Enter 强制插入换行
- 反斜杠 `\` 后接 Enter 也插入换行（escape 发送行为）

**Emacs 快捷键**（`useEmacsKeybindings` hook）：
- Ctrl+A/E：跳转行首/行尾
- Ctrl+B/F/P/N：字符和行级移动
- Ctrl+D/H：删除后/前一个字符
- Ctrl+W：删除前一个词
- Ctrl+K/U：剪切到行尾/行首（共享剪切环，容量 10）
- Ctrl+Y：粘贴剪切环内容

纯粘贴文本时使用 `insertText` 命令保留纯文本格式。

## 状态管理

`agentStore.sendMessage(agentId, text, model, extra)` 负责将文本、模型和图片附件发送到后端。发送后输入框立即清空，不支持撤销恢复。

## Specification Details

### Parameters

- 输入框最小高度 24px，最大高度 140px
- Enter 发送，Shift+Enter 换行，\\+Enter 换行
- 输入法组合输入期间（`isComposing=true`）禁用 Enter 发送
- 发送按钮在无文本且无图片时禁用（灰色不可点击）

## Constraints

- 输入为空时按 Enter 不触发任何操作
- 输入法激活时 Enter 用于确认组合字符，不发送消息
- Emacs 快捷键仅在非输入法组合状态下生效
- 纯粘贴文本时使用 `insertText` 命令保留纯文本格式
- 文本发送后输入框立即清空，不支持撤销恢复
