# 文档查看 — 前端设计

文档查看功能将图谱同步生成的 Markdown 文档以渲染后的富文本形式展示。分为规格文档和技术文档两个标签页，内容完全由外部同步工具生成。

## 布局

SpecsDocument 和 TechnicalDocument 组件分别读取 `graphFullData.specs.document` 和 `graphFullData.architect.document`，将内容传递给 MarkdownViewer 渲染。

## 组件树

- **MarkdownViewer**：核心渲染组件。使用 `react-markdown` + `remark-gfm` 进行 Markdown 到 HTML 的转换，支持 GFM 扩展语法（表格、删除线、任务列表）。使用 Tailwind Typography (`prose prose-invert`) 进行排版样式，自定义了标题、段落、加粗、行内代码、代码块和链接的颜色。内容为 null 时显示居中的空状态提示文字（默认 "No content available"）。
- **SpecsDocument**：规格文档容器。从 graphStore 读取 `specs.document`，传递给 MarkdownViewer。无数据时显示 "暂无规格文档"。
- **TechnicalDocument**：技术文档容器。从 graphStore 读取 `architect.document`，传递给 MarkdownViewer。无数据时显示 "暂无技术文档"。

## 样式与主题

MarkdownViewer 使用 dark mode 配色（`prose-invert`）：标题 gray-200、正文 gray-400、加粗 gray-300、行内代码和链接使用 harness-accent 色、代码块背景使用 harness-sidebar。文档容器使用 `max-w-none` 取消最大宽度限制以充分利用空间。

## Specification Details

### Parameters

- Markdown 渲染支持 GFM 扩展：表格、删除线、任务列表
- 文档内容为只读展示，不支持编辑
- MarkdownViewer 使用 Tailwind Typography 插件进行排版样式
- 无文档数据时显示空状态提示

## Constraints

- 文档内容完全由外部同步工具生成，平台不提供编辑功能
- 无网络环境下文档仍可正常显示（本地数据）
- 文档内容过长时页面滚动可能影响性能（依赖浏览器渲染）
- Markdown 中的图片引用可能无效（外部工具生成时需处理资源路径）
