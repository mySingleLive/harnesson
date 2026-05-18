# Message Input

## 前端设计

### 组件
- `RichTextInput`: ContentEditable 富文本输入
  - 自动高度调整
  - Emacs 风格快捷键 (Ctrl+A/E, Ctrl+W)
  - Enter 发送, Shift+Enter 换行

### Hooks
- `useSlashCompletion`: 斜杠命令自动补全
- `useImageInput`: 图片上传处理

### 集成
- 模型选择器下拉框
- 分支选择器下拉框
- 发送按钮
