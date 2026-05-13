# 消息输入 -- 前端设计

## 布局

`RichTextInput` 是 Agent 聊天面板底部的消息输入组件。整体布局分为三层：顶部为 contentEditable 编辑区，中部为工具栏（Plus 菜单、类型选择器、分支选择器），底部右侧为模型选择器和发送/中止按钮，底部下方为快捷键提示栏。

## 组件树

```
RichTextInput
├── <div contentEditable> 编辑区
│   ├── 内联文本
│   └── 内联图片 (span + img，可通过 × 按钮删除)
├── SlashCommandPopup (斜杠命令自动补全弹窗)
├── 工具栏
│   ├── Plus 按钮 + 下拉菜单 (Add Image / Reference File / Slash Command / Tools / MCP)
│   ├── 类型选择器 (Agent type dropdown)
│   └── 分支选择器 (Git branch display)
├── 发送区
│   ├── ModelDropdown (模型选择器)
│   └── 发送按钮 (ArrowUp) / 中止按钮 (StopCircle，streaming 时显示)
└── 快捷键提示 (Enter / Shift+Enter / Ctrl+A/E/W/K/U/Y)
```

## 富文本输入

编辑区使用 `contentEditable` 实现富文本内联编辑，支持：

- **自动高度** — 监听 `internalText` 和图片数量变化，设置 `height: auto` 后重新计算 `scrollHeight`（上限 140px）。
- **输入法组合** — 通过 `isComposing` 状态标记 IME 组合输入过程，组合期间不触发发送或斜杠补全。
- **换行逻辑** — `Enter` 发送消息；`Shift+Enter` 换行；光标前字符为 `\` 时 `Enter` 插入换行（用于多行输入）。
- **Emacs 风格快捷键** — 通过 `useEmacsKeybindings` hook 支持：`Ctrl+A` 行首、`Ctrl+E` 行尾、`Ctrl+B/F` 前后字符、`Ctrl+P/N` 上下行、`Ctrl+D` 删后字符、`Ctrl+H` 删前字符、`Ctrl+W` 删词、`Ctrl+K` 删至行尾、`Ctrl+U` 删至行首、`Ctrl+Y` 粘贴。

## 图片上传

通过 `useImageInput` hook 管理图片状态（`PendingImage[]`），支持三种输入方式：

1. **粘贴** — `onPaste` 处理器检测 `clipboardData.items` 中的 `image/*` MIME 类型，提取文件后调用 `imageInput.addImages()`。纯文本粘贴使用 `document.execCommand('insertText')` 保持光标位置。
2. **拖拽** — `onDragOver` / `onDrop` 处理，过滤 `image/*` 文件。拖拽时显示虚线边框视觉反馈。
3. **文件选择器** — Plus 菜单中的 "Add Image" 按钮触发隐藏的 `<input type="file" accept="image/*" multiple>`。

图片以 base64 编码存储，在编辑区中内联显示为小缩略图（22px 高），鼠标悬停时显示删除按钮。点击缩略图弹出 `ImagePreview` 全屏查看。

发送时通过 `extractContentBlocks()` 遍历编辑区 DOM 节点，构建 `ContentBlock[]`（text 和 image 交错排列），同时生成 `ImageAttachment[]`（完整 base64 数据用于持久化）。

## 斜杠命令自动补全

`useSlashCompletion` hook 管理斜杠命令弹窗逻辑：

- **触发** — 当用户输入 `/` 后继续输入字符时，通过 `getCurrentSlashFragment()` 提取光标前的斜杠片段。
- **过滤** — `filterCommands()` 根据 prefix 匹配命令列表（来源：`slashCommandStore` + 服务端 `GET /api/slash-commands`）。
- **键盘导航** — `ArrowUp`/`ArrowDown` 循环选择，`Enter`/`Tab` 确认选择，`Escape` 关闭弹窗。
- **选择后** — 替换斜杠片段为完整命令名（skill 类型带 `plugin:` 前缀），光标移至命令后空格位置。
- **输入法兼容** — 组合输入期间不触发斜杠检测。

`SlashCommandPopup` 组件渲染命令列表，显示命令名称、类型（builtin / skill）、描述和所属插件。支持鼠标悬停高亮（`hoveredIndex`）和键盘选中（`selectedIndex`）两条独立索引。
