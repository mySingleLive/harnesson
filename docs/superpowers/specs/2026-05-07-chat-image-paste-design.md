# Chat Image Paste Design

Agent 聊天输入框支持粘贴图片，图片内嵌在输入区域中，发送后作为多模态消息传递给 Claude 进行视觉分析。

## Requirements

- **输入方式**：Ctrl+V 粘贴 + 拖拽文件 + 文件选择按钮
- **预览方式**：图片缩略图内嵌在文本输入区域中（类似微信）
- **用途**：聊天界面展示 + 发送给 AI 多模态分析
- **限制**：暂不设限，后续根据体验调整
- **影响范围**：`NewSessionPage`（首条消息）和 `AgentPanel`（持续对话）两个输入框

## Technical Approach

**Base64 内联传输**：图片转 Base64 后直接嵌入 JSON 请求体，以 Claude 多模态 content block 格式发送。与 Claude API 原生方式契合，不需要额外的文件上传端点或存储系统。

## Data Model

### New Types (`packages/shared/src/types/agent.ts`)

```typescript
export interface ImageAttachment {
  id: string;           // 前端生成的唯一 ID（crypto.randomUUID）
  base64: string;       // Base64 编码的图片数据（不含 data: 前缀）
  mediaType: string;    // MIME 类型，如 "image/png", "image/jpeg"
  name?: string;        // 原始文件名（可选，剪贴板截图无文件名）
}

export interface ContentBlock {
  type: 'text' | 'image';
  text?: string;           // type === 'text' 时
  image?: ImageAttachment; // type === 'image' 时
}
```

### Modified Types

```typescript
export interface SendMessageRequest {
  message: string;                    // 纯文本部分（向后兼容）
  model?: string;
  contentBlocks?: ContentBlock[];     // 按顺序排列的图文混合内容
  images?: ImageAttachment[];         // 所有图片（扁平列表）
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  images?: ImageAttachment[];         // 仅 user 消息使用
  contentBlocks?: ContentBlock[];     // 仅 user 消息使用
  timestamp: string;
  events?: AgentStreamEvent[];
  todoSnapshot?: TodoItem[];
}
```

**设计要点**：
- `ImageAttachment` 是纯值对象，不含 UI 状态
- `base64` 不含 `data:image/png;base64,` 前缀，纯粹的数据部分
- `images` 仅在 `role: 'user'` 的消息中使用
- `contentBlocks` 保留图文顺序信息，`images` 是扁平列表方便后端处理
- 无图片时所有新字段为空，完全向后兼容

## Frontend Architecture

### `useImageInput` Hook (`apps/web/src/hooks/useImageInput.ts`)

独立的图片输入状态管理 Hook，从 UI 组件中解耦。

```typescript
interface PendingImage {
  id: string;
  previewUrl: string;     // data URL（含前缀），供 <img> 预览
  base64: string;         // 纯 Base64 数据（不含前缀）
  mediaType: string;      // MIME 类型
  name?: string;          // 文件名
}

interface UseImageInputReturn {
  images: PendingImage[];
  addImages: (files: File[]) => void;
  handlePaste: (e: ClipboardEvent) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  imageCount: number;
}
```

**职责**：
- `addImages()` 统一入口：文件选择和拖拽都调用此方法
- `handlePaste()` 从 ClipboardEvent 提取图片 item，转 File 后调 `addImages()`
- 使用 `FileReader.readAsDataURL()` 做 File → Base64 转换
- `previewUrl` 保留完整 data URL 前缀用于预览

### ContentEditable Input (`apps/web/src/components/chat/RichTextInput.tsx`)

将现有 `<textarea>` 替换为 `<div contentEditable>`，支持内嵌图片元素。

**布局**：
```
┌──────────────────────────────────────────┐
│ 按钮样式应该如图 [thumb] 所示，请参考     │
│ [thumb2] 的布局来调整                     │
│                                           │
│ [+ ] [Claude Code ▾] [main ▾]    [发送→] │
└──────────────────────────────────────────┘
```

**技术要点**：
- 粘贴图片时，在光标位置插入 `<span contentEditable="false">` 包裹的缩略图
- 每个内嵌图片有唯一 ID，对应 `useImageInput` 中的图片数据
- 内嵌缩略图：`display: inline-block`，高度 20-24px（与文字行高匹配），宽度按比例，圆角 4px
- hover 时显示 x 删除按钮
- 拖拽文件到输入框时，容器边框高亮为紫色虚线

**发送时数据提取**：
- 遍历 contentEditable div 的 DOM 子节点
- 按顺序提取 text node → `ContentBlock { type: 'text' }`，image span → `ContentBlock { type: 'image' }`
- 生成 `ContentBlock[]` 和扁平 `ImageAttachment[]`

**需迁移的现有功能**：
- IME 中文输入（`onCompositionStart/End`）→ contentEditable 同样支持
- Slash Command 高亮覆盖层（`HighlightOverlay`）→ 适配 contentEditable 的文本提取
- 自动高度调整 → 从 `textarea.scrollHeight` 改为 `div.scrollHeight`
- 光标管理 → 粘贴图片后正确恢复光标位置

**组件接口**：
```typescript
interface RichTextInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: (data: { text: string; contentBlocks: ContentBlock[]; images: ImageAttachment[] }) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  commands: SlashCommand[];
  modelValue: string;
  onModelChange: (model: string) => void;
}
```

### 两个输入框的适配

**`NewSessionPage.tsx`**：
- 复用 `RichTextInput` 组件和 `useImageInput` hook
- `handleSend()` 中提取 `ContentBlock[]` 和 `images`
- 首条消息就携带图片创建 Agent

**`AgentPanel.tsx`**：
- 复用同样的 `RichTextInput` 组件
- 已有的 Plus → "Add Image" 下拉按钮触发 `<input type="file" accept="image/*" multiple>`
- `sendMessage()` 扩展为接受 `ContentBlock[]` 和 `images` 参数

## Backend Changes

### Message Endpoint (`apps/server/src/routes/agents.ts`)

```typescript
agentsRoute.post('/api/agents/:id/message', async (c) => {
  const agentId = c.req.param('id');
  const body = await c.req.json() as SendMessageRequest;

  if (!body.message?.trim() && (!body.contentBlocks?.length)) {
    return c.json({ error: 'message is required' }, 400);
  }

  await agentService.sendMessage(agentId, body.message, body.model, {
    contentBlocks: body.contentBlocks,
    images: body.images,
  });
  return c.json({ status: 'accepted' }, 202);
});
```

### ClaudeCodeAdapter (`apps/server/src/lib/claude-code-adapter.ts`)

```typescript
function buildPromptContent(blocks: ContentBlock[]): Array<Record<string, unknown>> {
  return blocks.map(block => {
    if (block.type === 'text') {
      return { type: 'text', text: block.text };
    }
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: block.image!.mediaType,
        data: block.image!.base64,
      },
    };
  });
}

// 在 sendMessage 中：
const messageStream = query({
  prompt: contentBlocks
    ? buildPromptContent(contentBlocks)
    : message,  // 向后兼容纯文本
  options: sdkOptions,
});
```

**向后兼容**：无图片时走原来的 `prompt: message` 纯文本路径，SSE 流式响应逻辑不变。

### Message Persistence

`AgentMessage` 中的 `images` 和 `contentBlocks` 随消息存入 SQLite。Prisma 中用 `String` 类型存储 JSON 序列化后的内容，读取时反序列化。

## Chat Message Rendering

### UserMessage Component (`MessageRenderer.tsx`)

改造为支持图文混排渲染：

- 有 `contentBlocks` 时，按顺序渲染文字和内联图片
- 仅有 `images`（无位置信息）时，图片显示在文字下方
- 纯文本时走原有逻辑（向后兼容）

内联图片样式：`max-h-[200px] max-w-[300px] rounded cursor-pointer`，点击可放大预览。

### ImagePreview Component

轻量级全屏预览弹窗：
- 点击聊天中的图片时弹出
- 深色遮罩背景，居中显示大图
- 点击遮罩区域关闭
- 不引入新依赖，复用现有 UI 风格

## Error Handling

| 场景 | 处理方式 |
|------|----------|
| 粘贴非图片内容 | 忽略，走正常文本粘贴逻辑 |
| 图片转换 Base64 失败 | toast 提示"图片处理失败" |
| 发送时图片数据缺失 | 前端校验，移除无效图片后发送 |
| 后端 Base64 损坏 | Claude API 返回错误，走现有 SSE error 流 |
| 图片过大导致请求超时 | 后续迭代添加大小限制和压缩 |

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/types/agent.ts` | Modify | 新增 ImageAttachment、ContentBlock 类型，修改 AgentMessage、SendMessageRequest |
| `apps/web/src/hooks/useImageInput.ts` | New | 图片输入状态管理 Hook |
| `apps/web/src/components/chat/RichTextInput.tsx` | New | ContentEditable 富文本输入组件 |
| `apps/web/src/components/chat/ImagePreview.tsx` | New | 图片全屏预览弹窗 |
| `apps/web/src/pages/NewSessionPage.tsx` | Modify | 接入 RichTextInput 组件 |
| `apps/web/src/components/layout/AgentPanel.tsx` | Modify | 接入 RichTextInput 组件，激活 Add Image 按钮 |
| `apps/web/src/components/chat/MessageRenderer.tsx` | Modify | UserMessage 支持图文混排渲染 |
| `apps/web/src/lib/serverApi.ts` | Modify | sendAgentMessage 支持携带图片数据 |
| `apps/web/src/stores/agentStore.ts` | Modify | sendMessage 支持 ContentBlock 和 images 参数 |
| `apps/server/src/routes/agents.ts` | Modify | 消息端点接受图片数据 |
| `apps/server/src/lib/claude-code-adapter.ts` | Modify | buildPromptContent 转换图文为 Claude 多模态格式 |
| `apps/server/src/lib/agent-service.ts` | Modify | 传递 contentBlocks 到 adapter |
