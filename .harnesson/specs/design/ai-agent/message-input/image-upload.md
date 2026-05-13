# 图片上传 — 前端设计

## 布局

图片以缩略图形式内嵌在 `contentEditable` 输入框中（`contentEditable=false` 的 inline-block span），与文本同行排列。悬停时缩略图右上角显示红色圆形删除按钮（14px 直径）。

## 组件树

```
RichTextInput
└── contentEditable div
    └── inline <span> (每个图片)
        ├── <img> (缩略图, h=22px, max-w=120px, rounded=4px)
        └── <span> (× 删除按钮, 悬停显示)
ImagePreview (全屏灯箱, 点击缩略图打开)
useImageInput hook (图片状态管理)
```

## 样式与主题

- 缩略图：高度 22px，最大宽度 120px，圆角 4px，背景 `rgba(255,255,255,0.15)`
- 删除按钮：红色圆形（`rgba(239,68,68,0.9)`），直径 14px，白色 × 文字，默认隐藏
- 图片缩略图间距：`margin 0 2px`

## 交互方式

**三种添加图片方式**：
1. 剪贴板粘贴（Ctrl/Cmd+V）：监听 `paste` 事件，检测 `clipboardData.files` 中的 `image/*` 类型
2. 拖拽：监听 `dragover` / `drop`，筛选 `image/*` MIME 类型文件
3. 文件选择器：通过 + 菜单触发隐藏的 `input[type=file]`

**删除**：悬停缩略图显示 × 按钮，点击即移除该图片并标准化光标位置。

**预览**：点击缩略图打开 `ImagePreview` 全屏灯箱，显示原图，支持点击背景关闭。

## 状态管理

`useImageInput` hook 管理 `PendingImage[]` 数组（含 `id`、`previewUrl`、`base64`、`mediaType`、`name`）。发送时通过 `extractContentBlocks` 将图片转换为 `ContentBlock[]` 数组（`type: image`，base64 编码），随文本一起发送到后端。

## Specification Details

### Parameters

- 缩略图尺寸：高 22px，最大宽 120px，圆角 4px
- 删除按钮：红色圆形，直径 14px，悬停时显示
- 支持的图片格式：所有 `image/*` MIME 类型
- 图片在消息中作为 ContentBlock（`type: image`），base64 编码传输
- 全屏预览支持点击背景关闭

## Constraints

- 大图片文件可能导致 base64 编码后消息体积过大
- 无图片数量限制（仅受消息体积和内存限制）
- 拖拽非图片文件不会触发上传
- 图片预览灯箱同时只能显示一张图片
