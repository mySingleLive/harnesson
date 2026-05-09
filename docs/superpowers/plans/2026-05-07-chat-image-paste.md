# Chat Image Paste Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image paste/drag/file-select support to Agent chat input boxes, with inline preview and multimodal sending to Claude.

**Architecture:** Images are converted to Base64 in the browser, stored as `ImageAttachment` / `ContentBlock` types. The input `<textarea>` is replaced with a `<div contentEditable>` that renders inline image thumbnails. On send, the structured content is posted as JSON to the server, which converts it to Claude SDK's multimodal format (`AsyncIterable<SDKUserMessage>` with image blocks).

**Tech Stack:** React 19, TypeScript, Zustand, contentEditable API, Claude Agent SDK (multimodal), Prisma/SQLite

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/shared/src/types/agent.ts` | Modify | Add `ImageAttachment`, `ContentBlock` types; extend `SendMessageRequest`, `AgentMessage`, `PersistedMessage` |
| `apps/web/src/hooks/useImageInput.ts` | Create | Image file handling hook (paste/drag/file-select → PendingImage state) |
| `apps/web/src/components/chat/RichTextInput.tsx` | Create | contentEditable input with inline image support, replaces textarea in both input areas |
| `apps/web/src/components/chat/ImagePreview.tsx` | Create | Full-screen image preview overlay |
| `apps/web/src/pages/NewSessionPage.tsx` | Modify | Replace textarea with RichTextInput component |
| `apps/web/src/components/layout/AgentPanel.tsx` | Modify | Replace textarea with RichTextInput component, wire Add Image button |
| `apps/web/src/components/chat/MessageRenderer.tsx` | Modify | UserMessage renders inline images from contentBlocks |
| `apps/web/src/lib/serverApi.ts` | Modify | `sendAgentMessage` accepts image data |
| `apps/web/src/stores/agentStore.ts` | Modify | `sendMessage` accepts and stores image data |
| `apps/server/src/routes/agents.ts` | Modify | Message endpoint accepts image fields |
| `apps/server/src/lib/agent-service.ts` | Modify | `sendMessage` passes contentBlocks to adapter |
| `apps/server/src/lib/claude-code-adapter.ts` | Modify | Convert ContentBlocks to Claude multimodal format |
| `apps/server/prisma/schema.prisma` | Modify | Add `images` column to Message model |

---

### Task 1: Shared Types — ImageAttachment & ContentBlock

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: Add new types and modify existing types in agent.ts**

Add `ImageAttachment` and `ContentBlock` interfaces after the `TodoItem` interface (around line 55). Then modify `AgentMessage` (line 58), `SendMessageRequest` (line 90), and `PersistedMessage` (line ~155).

```typescript
// Add after TodoItem interface (after line 55):
export interface ImageAttachment {
  id: string;
  base64: string;       // Base64 encoded data WITHOUT data: prefix
  mediaType: string;    // MIME type: "image/png", "image/jpeg", etc.
  name?: string;        // Original filename (optional for clipboard screenshots)
}

export interface ContentBlock {
  type: 'text' | 'image';
  text?: string;
  image?: ImageAttachment;
}

// Modify AgentMessage (line 58) to add images and contentBlocks:
export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  images?: ImageAttachment[];
  contentBlocks?: ContentBlock[];
  timestamp: string;
  events?: AgentStreamEvent[];
  todoSnapshot?: TodoItem[];
}

// Modify SendMessageRequest (line 90) to add images and contentBlocks:
export interface SendMessageRequest {
  message: string;
  model?: string;
  images?: ImageAttachment[];
  contentBlocks?: ContentBlock[];
}

// Modify PersistedMessage to add images and contentBlocks:
export interface PersistedMessage {
  id: string;
  agentId: string;
  role: string;
  content: string;
  images?: string;          // JSON serialized ImageAttachment[]
  contentBlocks?: string;   // JSON serialized ContentBlock[]
  events?: AgentStreamEvent[];
  createdAt: string;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | head -20`
Expected: No errors related to the new types.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add ImageAttachment and ContentBlock types for multimodal messages"
```

---

### Task 2: useImageInput Hook

**Files:**
- Create: `apps/web/src/hooks/useImageInput.ts`

- [ ] **Step 1: Create the useImageInput hook**

```typescript
import { useState, useCallback } from 'react';
import type { ImageAttachment } from '@harnesson/shared';

export interface PendingImage {
  id: string;
  previewUrl: string;     // Full data URL for <img> preview
  base64: string;         // Pure base64 data (no prefix)
  mediaType: string;      // MIME type
  name?: string;          // Original filename
}

export interface UseImageInputReturn {
  images: PendingImage[];
  addImages: (files: File[]) => void;
  handlePaste: (e: ClipboardEvent) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  imageCount: number;
  toImageAttachments: () => ImageAttachment[];
}

function fileToPendingImage(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl format: "data:image/png;base64,iVBOR..."
      const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) {
        reject(new Error('Failed to parse image data URL'));
        return;
      }
      resolve({
        id: crypto.randomUUID(),
        previewUrl: dataUrl,
        base64: match[2],
        mediaType: match[1],
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function useImageInput(): UseImageInputReturn {
  const [images, setImages] = useState<PendingImage[]>([]);

  const addImages = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    Promise.all(imageFiles.map(fileToPendingImage))
      .then((newImages) => {
        setImages((prev) => [...prev, ...newImages]);
      })
      .catch((err) => {
        console.error('Failed to process images:', err);
      });
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const toImageAttachments = useCallback((): ImageAttachment[] => {
    return images.map((img) => ({
      id: img.id,
      base64: img.base64,
      mediaType: img.mediaType,
      name: img.name,
    }));
  }, [images]);

  return {
    images,
    addImages,
    handlePaste,
    removeImage,
    clearImages,
    imageCount: images.length,
    toImageAttachments,
  };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to the new hook.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useImageInput.ts
git commit -m "feat: add useImageInput hook for image paste/drag/file handling"
```

---

### Task 3: ImagePreview Component

**Files:**
- Create: `apps/web/src/components/chat/ImagePreview.tsx`

- [ ] **Step 1: Create the ImagePreview component**

```tsx
import { useEffect, useCallback } from 'react';

interface ImagePreviewProps {
  src: string;  // data URL
  onClose: () => void;
}

export function ImagePreview({ src, onClose }: ImagePreviewProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <img
        src={src}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/ImagePreview.tsx
git commit -m "feat: add ImagePreview fullscreen overlay component"
```

---

### Task 4: RichTextInput Component

This is the core component that replaces `<textarea>` with `<div contentEditable>` supporting inline images.

**Files:**
- Create: `apps/web/src/components/chat/RichTextInput.tsx`

- [ ] **Step 1: Create the RichTextInput component**

```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, StopCircle, ImageIcon, FileText, Terminal, Wrench, Network } from 'lucide-react';
import type { ImageAttachment, ContentBlock, SlashCommand } from '@harnesson/shared';
import { useImageInput, type PendingImage } from '@/hooks/useImageInput';
import { useSlashCompletion } from '@/hooks/useSlashCompletion';
import { ModelDropdown } from '@/components/layout/ModelDropdown';
import { SlashCommandPopup } from '@/components/chat/SlashCommandPopup';
import { ImagePreview } from '@/components/chat/ImagePreview';

// ---- Inline image element management ----

const IMAGE_DATA_ATTR = 'data-image-id';

function insertInlineImage(container: HTMLElement, image: PendingImage): void {
  const span = document.createElement('span');
  span.setAttribute('contentEditable', 'false');
  span.setAttribute(IMAGE_DATA_ATTR, image.id);
  span.style.display = 'inline-block';
  span.style.verticalAlign = 'middle';
  span.style.position = 'relative';
  span.style.margin = '0 2px';
  span.style.cursor = 'pointer';

  const img = document.createElement('img');
  img.src = image.previewUrl;
  img.style.height = '22px';
  img.style.maxWidth = '120px';
  img.style.borderRadius = '4px';
  img.style.verticalAlign = 'middle';
  img.draggable = false;

  // Delete button
  const del = document.createElement('span');
  del.textContent = '×';
  del.style.cssText = 'position:absolute;top:-6px;right:-6px;width:14px;height:14px;border-radius:50%;background:rgba(239,68,68,0.9);color:white;font-size:10px;line-height:14px;text-align:center;cursor:pointer;display:none;';
  span.onmouseenter = () => { del.style.display = 'block'; };
  span.onmouseleave = () => { del.style.display = 'none'; };
  del.onclick = (e) => {
    e.stopPropagation();
    span.remove();
    // Normalize adjacent text nodes after removal
    container.normalize();
  };

  span.appendChild(img);
  span.appendChild(del);

  // Insert at current selection/cursor position
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    // Ensure the range is inside our contentEditable
    if (container.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(span);
      // Move cursor after the inserted image
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  }

  // Fallback: append at end
  container.appendChild(span);
}

function extractContentBlocks(container: HTMLElement, images: PendingImage[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const imageMap = new Map(images.map((img) => [img.id, img]));

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text) {
        // Merge with previous text block if exists
        const last = blocks[blocks.length - 1];
        if (last?.type === 'text') {
          last.text += text;
        } else {
          blocks.push({ type: 'text', text });
        }
      }
    } else if (node instanceof HTMLElement && node.hasAttribute(IMAGE_DATA_ATTR)) {
      const imgId = node.getAttribute(IMAGE_DATA_ATTR)!;
      const pending = imageMap.get(imgId);
      if (pending) {
        blocks.push({
          type: 'image',
          image: {
            id: pending.id,
            base64: pending.base64,
            mediaType: pending.mediaType,
            name: pending.name,
          },
        });
      }
    } else if (node instanceof HTMLElement) {
      // Handle <br> and nested elements
      const text = node.textContent ?? '';
      if (node.tagName === 'BR') {
        const last = blocks[blocks.length - 1];
        if (last?.type === 'text') {
          last.text += '\n';
        } else {
          blocks.push({ type: 'text', text: '\n' });
        }
      } else if (text) {
        blocks.push({ type: 'text', text });
      }
    }
  }

  return blocks;
}

function getPlainText(container: HTMLElement): string {
  return extractContentBlocks(container, []).map((b) => b.text ?? '').join('');
}

// ---- Props ----

interface RichTextInputProps {
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  commands: SlashCommand[];
  modelValue?: string;
  onModelChange?: (model: string) => void;
  showModelSelector?: boolean;
  showBranchSelector?: boolean;
  branchName?: string;
  showTypeSelector?: boolean;
  typeName?: string;
  onSend: (data: {
    text: string;
    contentBlocks: ContentBlock[];
    images: ImageAttachment[];
  }) => void;
  onAbort?: () => void;
}

export function RichTextInput({
  placeholder,
  disabled,
  isStreaming,
  commands,
  modelValue,
  onModelChange,
  showModelSelector = true,
  showBranchSelector = false,
  branchName = 'main',
  showTypeSelector = true,
  typeName = 'Claude Code',
  onSend,
  onAbort,
}: RichTextInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalText, setInternalText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const imageInput = useImageInput();

  const textareaRef = useRef<{ value: string; selectionStart: number }>({
    value: internalText,
    selectionStart: 0,
  });

  // Make textareaRef compatible with useSlashCompletion
  const compatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  // We'll create a dummy textarea for compatibility
  useEffect(() => {
    const ta = document.createElement('textarea');
    compatTextareaRef.current = ta;
    return () => { ta.remove(); };
  }, []);

  const {
    isOpen: isPopupOpen,
    filteredCommands,
    selectedIndex,
    handleInput: handleCompletionInput,
    handleKeyDown: handleCompletionKeyDown,
    selectCommand,
    closePopup,
    hoveredIndex,
    setHoveredIndex,
    setIsComposing: setCompletionComposing,
  } = useSlashCompletion(internalText, (val: string) => {
    setInternalText(val);
    if (editorRef.current) {
      editorRef.current.textContent = val;
    }
  }, compatTextareaRef as React.RefObject<HTMLTextAreaElement>);

  // Sync editor text to internalText state
  const syncText = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText ?? '';
    setInternalText(text);
    return text;
  }, []);

  // Auto-resize
  useEffect(() => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [internalText, imageInput.imageCount]);

  // Insert image into editor
  const insertImage = useCallback((pending: PendingImage) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    insertInlineImage(editorRef.current, pending);
    syncText();
  }, [syncText]);

  // Watch for new images and insert them
  useEffect(() => {
    const latest = imageInput.images[imageInput.images.length - 1];
    if (latest) {
      insertImage(latest);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageInput.imageCount]);

  // Paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        hasImage = true;
        break;
      }
    }

    if (hasImage) {
      e.preventDefault();
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      imageInput.addImages(files);
    }
    // Non-image paste: let contentEditable handle it natively
  }, [imageInput]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      imageInput.addImages(files);
    }
  }, [imageInput]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isComposing) return;

    // Slash command completion compatibility
    const text = editorRef.current?.textContent ?? '';
    const sel = window.getSelection();
    const cursorPos = sel?.focusOffset ?? 0;

    // Update compat textarea for slash completion
    if (compatTextareaRef.current) {
      compatTextareaRef.current.value = text;
      compatTextareaRef.current.selectionStart = cursorPos;
    }

    if (handleCompletionKeyDown(e)) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendInternal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComposing, handleCompletionKeyDown]);

  // Composition
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
    setCompletionComposing(true);
  }, [setCompletionComposing]);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
    setCompletionComposing(false);
    const text = syncText() ?? '';
    if (compatTextareaRef.current) {
      handleCompletionInput(text, editorRef.current?.textContent?.length ?? 0);
    }
  }, [syncText, setCompletionComposing, handleCompletionInput]);

  // Input handler for slash commands
  const handleInput = useCallback(() => {
    const text = syncText() ?? '';
    if (compatTextareaRef.current) {
      compatTextareaRef.current.value = text;
    }
    handleCompletionInput(text, editorRef.current?.textContent?.length ?? 0);
  }, [syncText, handleCompletionInput]);

  // Send
  const handleSendInternal = useCallback(() => {
    if (!editorRef.current) return;
    const blocks = extractContentBlocks(editorRef.current, imageInput.images);
    const text = blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    const imageBlocks = blocks.filter((b) => b.type === 'image');
    const allImages = imageInput.toImageAttachments();

    if (!text.trim() && imageBlocks.length === 0) return;

    onSend({
      text,
      contentBlocks: blocks,
      images: allImages,
    });

    // Clear editor
    editorRef.current.textContent = '';
    setInternalText('');
    imageInput.clearImages();
    closePopup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSend, imageInput, closePopup]);

  // File select
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      imageInput.addImages(files);
    }
    e.target.value = '';
    setShowPlusMenu(false);
  }, [imageInput]);

  // Image click for preview
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target.closest('img') as HTMLImageElement | null;
    if (img) {
      setPreviewSrc(img.src);
    }
  }, []);

  const canSend = internalText.trim().length > 0 || imageInput.imageCount > 0;

  return (
    <>
      {previewSrc && (
        <ImagePreview src={previewSrc} onClose={() => setPreviewSrc(null)} />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <div
        className={`rounded-2xl border transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)] ${isDragOver ? 'border-harness-accent border-dashed' : 'border-white/10'}`}
        style={{ background: '#2a2a48' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onPaste={handlePaste}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onClick={handleEditorClick}
          data-placeholder={placeholder ?? 'Send a message...'}
          className="min-h-[24px] max-h-[140px] w-full resize-none overflow-y-auto bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none text-gray-300 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600"
          style={{ wordBreak: 'break-word' }}
        />
        {isPopupOpen && (
          <SlashCommandPopup
            commands={filteredCommands}
            selectedIndex={selectedIndex}
            onSelect={selectCommand}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
          />
        )}
        <div className="flex items-center justify-between px-2.5 pb-2">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300"
              >
                <Plus className="h-[18px] w-[18px]" />
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-[38px] left-0 z-[9999] min-w-[200px] rounded-lg border border-white/10 bg-[#252540] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                    Add Image
                    <span className="ml-auto text-[11px] text-gray-600">⌘ V</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 opacity-50 cursor-not-allowed">
                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                    Reference File
                    <span className="ml-auto text-[11px] text-gray-600">@</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 opacity-50 cursor-not-allowed">
                    <Terminal className="h-3.5 w-3.5 text-gray-500" />
                    Slash Command
                    <span className="ml-auto text-[11px] text-gray-600">/</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 opacity-50 cursor-not-allowed">
                    <Wrench className="h-3.5 w-3.5 text-gray-500" />
                    Tools
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 opacity-50 cursor-not-allowed">
                    <Network className="h-3.5 w-3.5 text-gray-500" />
                    MCP Servers
                  </button>
                </div>
              )}
            </div>
            {showTypeSelector && (
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">{typeName}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            )}
            {showBranchSelector && (
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{branchName}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showModelSelector && modelValue !== undefined && onModelChange && (
              <ModelDropdown value={modelValue} onChange={onModelChange} />
            )}
            {isStreaming && onAbort ? (
              <button
                onClick={onAbort}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <StopCircle className="h-[15px] w-[15px]" />
              </button>
            ) : (
              <button
                onClick={handleSendInternal}
                disabled={!canSend || !!disabled}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
              >
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-1.5 text-center text-[10px] text-gray-600">
        <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">⌘V</kbd> 粘贴图片
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors in RichTextInput.tsx. Some unused import warnings are acceptable.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/RichTextInput.tsx
git commit -m "feat: add RichTextInput contentEditable component with inline image support"
```

---

### Task 5: Backend — Schema Migration & Claude Adapter

**Files:**
- Modify: `apps/server/prisma/schema.prisma`
- Modify: `apps/server/src/lib/claude-code-adapter.ts`
- Modify: `apps/server/src/lib/agent-service.ts`
- Modify: `apps/server/src/routes/agents.ts`

- [ ] **Step 1: Add `images` and `contentBlocks` columns to Message model in schema.prisma**

In the `Message` model, add two optional string fields:

```prisma
model Message {
  id           String   @id @default(uuid())
  agentId      String
  role         String
  content      String   @default("")
  images       String?   // JSON serialized ImageAttachment[]
  contentBlocks String?  // JSON serialized ContentBlock[]
  events       String?
  createdAt    DateTime @default(now())

  agent        AgentSession @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId, createdAt])
}
```

- [ ] **Step 2: Run Prisma migration**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/server && npx prisma db push`
Expected: Schema changes applied successfully.

- [ ] **Step 3: Modify claude-code-adapter.ts — add multimodal prompt support**

Add the `buildPromptContent` helper and modify `sendMessage` signature. The key change is that `sendMessage` now accepts an optional `ContentBlock[]` parameter and builds an `AsyncIterable<SDKUserMessage>` for the Claude SDK `query` function.

Add this import at the top:
```typescript
import type { AgentStreamEvent, ContentBlock } from '@harnesson/shared';
```

Add this helper function before the class:
```typescript
function buildSDKMessages(message: string, contentBlocks?: ContentBlock[]): AsyncIterable<import('@anthropic-ai/claude-agent-sdk').SDKUserMessage> {
  if (!contentBlocks || contentBlocks.length === 0) {
    // Pure text — no images
    return (async function* () {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: message,
        },
      };
    })();
  }

  // Build multimodal content blocks
  const content = contentBlocks.map((block) => {
    if (block.type === 'text') {
      return { type: 'text' as const, text: block.text ?? '' };
    }
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: block.image!.mediaType,
        data: block.image!.base64,
      },
    };
  });

  return (async function* () {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content,
      },
    };
  })();
}
```

Then modify the `sendMessage` method signature to accept optional content blocks:

```typescript
async *sendMessage(agentId: string, message: string, contentBlocks?: ContentBlock[]): AsyncIterable<AgentStreamEvent> {
```

And change the `query` call inside `sendMessage` from:
```typescript
const messageStream = query({
  prompt: message,
  options: sdkOptions,
});
```
to:
```typescript
const messageStream = query({
  prompt: contentBlocks && contentBlocks.length > 0
    ? buildSDKMessages(message, contentBlocks)
    : message,
  options: sdkOptions,
});
```

- [ ] **Step 4: Modify agent-service.ts — pass contentBlocks through**

The `AgentAdapter` interface needs updating. In `apps/server/src/lib/agent-adapter.ts`, modify the `sendMessage` signature:

Find the interface definition of `AgentAdapter` and update `sendMessage`:
```typescript
sendMessage(agentId: string, message: string, contentBlocks?: import('@harnesson/shared').ContentBlock[]): AsyncIterable<AgentStreamEvent>;
```

Then in `agent-service.ts`, modify the `sendMessage` method to accept and pass through image data:

Change the signature:
```typescript
async sendMessage(agentId: string, message: string, model?: string, extra?: { contentBlocks?: import('@harnesson/shared').ContentBlock[]; images?: import('@harnesson/shared').ImageAttachment[] }): Promise<void> {
```

Inside `sendMessage`, update the user message persistence:
```typescript
// Persist user message
await prisma.message.create({
  data: {
    agentId,
    role: 'user',
    content: message,
    images: extra?.images ? JSON.stringify(extra.images) : undefined,
    contentBlocks: extra?.contentBlocks ? JSON.stringify(extra.contentBlocks) : undefined,
  },
});
```

And update the adapter call inside `processStreamWithQuestions`:
```typescript
await this.processStreamWithQuestions(agentId, message, extra?.contentBlocks, (event) => {
  collectedEvents.push(event);
});
```

Update `processStreamWithQuestions` signature:
```typescript
private async processStreamWithQuestions(
  agentId: string,
  message: string,
  contentBlocks: import('@harnesson/shared').ContentBlock[] | undefined,
  onEvent: (event: AgentStreamEvent) => void,
): Promise<void> {
```

And the adapter call inside it:
```typescript
for await (const event of runtime.adapter.sendMessage(agentId, message, contentBlocks)) {
```

And the recursive call at the end:
```typescript
await this.processStreamWithQuestions(agentId, contextMsg, undefined, onEvent);
```

Also update the message loading in `getMessages` to parse the JSON fields:
```typescript
return messages.map((m) => ({
  ...m,
  images: m.images ? JSON.parse(m.images) : null,
  contentBlocks: m.contentBlocks ? JSON.parse(m.contentBlocks) : null,
  events: m.events ? JSON.parse(m.events) : null,
}));
```

- [ ] **Step 5: Modify routes/agents.ts — accept image data in message endpoint**

Update the message endpoint to pass image data through:

```typescript
// POST /api/agents/:id/message — send message to agent
agentsRoute.post('/api/agents/:id/message', async (c) => {
  const agentId = c.req.param('id');
  const agent = await agentService.getFromDB(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json() as SendMessageRequest;
  if (!body.message?.trim() && (!body.contentBlocks?.length)) {
    return c.json({ error: 'message is required' }, 400);
  }

  try {
    await agentService.sendMessage(agentId, body.message, body.model, {
      contentBlocks: body.contentBlocks,
      images: body.images,
    });
    return c.json({ status: 'accepted' }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('already processing') ? 409 : 500;
    return c.json({ error: message }, status);
  }
});
```

- [ ] **Step 6: Verify server TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/server && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/server/prisma/schema.prisma apps/server/src/lib/claude-code-adapter.ts apps/server/src/lib/agent-service.ts apps/server/src/lib/agent-adapter.ts apps/server/src/routes/agents.ts
git commit -m "feat: backend support for multimodal image messages via Claude SDK"
```

---

### Task 6: Frontend API & Store — Image Data Pipeline

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: Update sendAgentMessage in serverApi.ts**

```typescript
export async function sendAgentMessage(
  agentId: string,
  message: string,
  model?: string,
  extra?: { contentBlocks?: import('@harnesson/shared').ContentBlock[]; images?: import('@harnesson/shared').ImageAttachment[] },
): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      model,
      contentBlocks: extra?.contentBlocks,
      images: extra?.images,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to send message: ${res.status}`);
  }
}
```

- [ ] **Step 2: Update sendMessage in agentStore.ts**

Add `ImageAttachment` and `ContentBlock` to the import:
```typescript
import type { Agent, AgentPanelState, AgentStreamEvent, AgentMessage, TodoItem, ImageAttachment, ContentBlock } from '@harnesson/shared';
```

Update the `sendMessage` interface in `AgentState`:
```typescript
sendMessage: (agentId: string, text: string, model?: string, extra?: { contentBlocks?: ContentBlock[]; images?: ImageAttachment[] }) => Promise<void>;
```

Update the `sendMessage` implementation to include images in the user message and API call:
```typescript
sendMessage: async (agentId, text, model, extra) => {
  // Cancel pending completion timer
  if (completionTimers[agentId]) {
    clearTimeout(completionTimers[agentId]);
    delete completionTimers[agentId];
  }
  // Snapshot any active todos into message flow before starting new reply
  const currentTodos = get().todos[agentId] ?? [];
  if (currentTodos.length > 0) {
    const snapshotMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: '',
      timestamp: new Date().toISOString(),
      todoSnapshot: [...currentTodos],
    };
    set((s) => ({
      todos: { ...s.todos, [agentId]: [] },
      messages: {
        ...s.messages,
        [agentId]: [...(s.messages[agentId] ?? []), snapshotMsg],
      },
    }));
  }

  const userMsg: AgentMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    images: extra?.images,
    contentBlocks: extra?.contentBlocks,
    timestamp: new Date().toISOString(),
  };

  set((s) => ({
    messages: {
      ...s.messages,
      [agentId]: [...(s.messages[agentId] ?? []), userMsg],
    },
    isStreaming: { ...s.isStreaming, [agentId]: true },
  }));

  try {
    await api.sendAgentMessage(agentId, text, model, extra);
  } catch (err) {
    get().appendStreamEvent(agentId, {
      type: 'agent.error',
      message: err instanceof Error ? err.message : 'Failed to send message',
      code: 'SEND_ERROR',
    });
  }
},
```

Also update `activateAgent` to parse images/contentBlocks when loading messages from DB:
```typescript
const agentMessages: AgentMessage[] = msgs.map((m) => ({
  id: m.id,
  role: m.role as 'user' | 'agent',
  content: m.content,
  images: (m as { images?: string }).images ? JSON.parse((m as { images: string }).images) : undefined,
  contentBlocks: (m as { contentBlocks?: string }).contentBlocks ? JSON.parse((m as { contentBlocks: string }).contentBlocks) : undefined,
  timestamp: m.createdAt,
  events: m.events as AgentStreamEvent[] | undefined,
}));
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors in serverApi.ts or agentStore.ts.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/serverApi.ts apps/web/src/stores/agentStore.ts
git commit -m "feat: frontend API and store support for image message pipeline"
```

---

### Task 7: MessageRenderer — Render Inline Images in Chat

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx`

- [ ] **Step 1: Update UserMessage component to render images**

Add import for `ImagePreview`:
```typescript
import { useState } from 'react';
import type { AgentMessage, ImageAttachment, ContentBlock } from '@harnesson/shared';
import { ImagePreview } from './ImagePreview';
```

Update `MessageRenderer` to pass new props to `UserMessage`:
```typescript
if (message.role === 'user') {
  return <UserMessage content={message.content} images={message.images} contentBlocks={message.contentBlocks} />;
}
```

Replace the `UserMessage` function with image-aware rendering:
```typescript
function UserMessage({ content, images, contentBlocks }: { content: string; images?: ImageAttachment[]; contentBlocks?: ContentBlock[] }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const renderContent = () => {
    // Priority 1: structured content blocks with inline images
    if (contentBlocks?.length) {
      return contentBlocks.map((block, i) => {
        if (block.type === 'text') {
          return <span key={i}>{block.text}</span>;
        }
        if (block.image) {
          const src = `data:${block.image.mediaType};base64,${block.image.base64}`;
          return (
            <img
              key={i}
              src={src}
              alt={block.image.name ?? 'image'}
              className="inline max-h-[200px] max-w-[300px] rounded cursor-pointer align-middle"
              onClick={() => setPreviewSrc(src)}
            />
          );
        }
        return null;
      });
    }

    // Priority 2: images array without position info — show below text
    if (images?.length) {
      return (
        <>
          <span>{content}</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {images.map((img) => {
              const src = `data:${img.mediaType};base64,${img.base64}`;
              return (
                <img
                  key={img.id}
                  src={src}
                  alt={img.name ?? 'image'}
                  className="max-h-[200px] max-w-[300px] rounded cursor-pointer"
                  onClick={() => setPreviewSrc(src)}
                />
              );
            })}
          </div>
        </>
      );
    }

    // Priority 3: plain text (backward compatible)
    return content;
  };

  return (
    <>
      {previewSrc && <ImagePreview src={previewSrc} onClose={() => setPreviewSrc(null)} />}
      <div className="px-5 py-4 flex justify-start">
        <div
          className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-300"
          style={{ background: '#2a2a48', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: render inline images in chat user messages"
```

---

### Task 8: Wire Up NewSessionPage with RichTextInput

**Files:**
- Modify: `apps/web/src/pages/NewSessionPage.tsx`

- [ ] **Step 1: Replace textarea with RichTextInput**

This is a significant refactor of the input area. Replace the entire input block (from `<div className="w-full max-w-[700px]">` to the closing `</div>` of that div, roughly lines 115-190) with `RichTextInput`.

Replace imports — remove unused ones and add new:
```typescript
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { RichTextInput } from '@/components/chat/RichTextInput';
import type { ContentBlock, ImageAttachment } from '@harnesson/shared';
```

Remove these unused refs and hooks:
- `textareaRef`
- `overlayRef`
- All slash completion related hooks (now inside RichTextInput)
- `adjustHeight`, `handleKeyDown`, `handleTextareaChange`, `handleScroll`

Update `handleSend` to accept structured data from RichTextInput:
```typescript
const handleSend = async (data: { text: string; contentBlocks: ContentBlock[]; images: ImageAttachment[] }) => {
  const text = data.text.trim();
  if ((!text && data.images.length === 0) || !projectPath || isCreating) return;

  setIsCreating(true);
  try {
    await createAgent({
      cwd: projectPath,
      type: 'claude-code',
      model: selectedModel,
      taskTitle: text,
    });
    const agentId = useAgentStore.getState().activeAgentId;
    if (agentId) {
      await useAgentStore.getState().sendMessage(agentId, text, selectedModel, {
        contentBlocks: data.contentBlocks,
        images: data.images,
      });
    }
    navigate('/projects');
  } catch (err) {
    console.error('Failed to create agent:', err);
  } finally {
    setIsCreating(false);
  }
};
```

Replace the input area JSX (lines ~115-190) with:
```tsx
<div className="w-full max-w-[700px]">
  <RichTextInput
    placeholder={projectPath ? "Message Harnesson...  Type / for commands" : "请先选择或创建一个项目"}
    disabled={!projectPath || isCreating}
    commands={commands}
    modelValue={selectedModel}
    onModelChange={setSelectedModel}
    showBranchSelector
    branchName={branch}
    onSend={handleSend}
  />

  <div className="mt-2 flex justify-center gap-2">
    {quickActions.map(({ label, icon: Icon, prompt }) => (
      <button
        key={label}
        onClick={() => handleQuickAction(prompt)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-gray-400 transition-colors hover:border-harness-accent/30 hover:bg-harness-accent/[0.05] hover:text-harness-accent"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    ))}
  </div>
</div>
```

Note: quick action clicks set the text content of the RichTextInput. Since RichTextInput manages its own state internally, we need a different approach. Add a `useRef` for the editor and an imperative method, or simpler: just set text via a `key` reset or a `defaultText` prop. The simplest approach is to remove quick actions for now or have them just prepend to the clipboard. Actually, we can pass an `externalText` prop that resets the editor when changed.

Add this prop handling to RichTextInput later — for now, quick actions will set the `internalText` via a state lifted up. Let's keep it simple: keep a `defaultText` state in NewSessionPage and pass it as initial value.

Simpler approach: use a `useEffect` in RichTextInput that watches for an `externalText` prop change:

Add to RichTextInput props:
```typescript
externalText?: string;
```

Add useEffect in RichTextInput:
```typescript
useEffect(() => {
  if (externalText !== undefined && editorRef.current) {
    editorRef.current.textContent = externalText;
    setInternalText(externalText);
  }
}, [externalText]);
```

In NewSessionPage, add:
```typescript
const [quickActionText, setQuickActionText] = useState<string | undefined>(undefined);

const handleQuickAction = (prompt: string) => {
  setQuickActionText(prompt);
  // Reset after a tick so it can trigger again
  setTimeout(() => setQuickActionText(undefined), 100);
};
```

And pass to RichTextInput:
```tsx
externalText={quickActionText}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/NewSessionPage.tsx
git commit -m "feat: wire NewSessionPage with RichTextInput for image support"
```

---

### Task 9: Wire Up AgentPanel with RichTextInput

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`

- [ ] **Step 1: Replace textarea with RichTextInput in AgentPanel**

Similar to NewSessionPage refactor but for the ongoing conversation input.

Update imports — remove unused, add new:
```typescript
import { useState, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import type { Agent, AgentMessage, ContentBlock, ImageAttachment } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { parseSlashCommand } from '@/lib/slashCommandUtils';
import * as api from '@/lib/serverApi';
import { AgentContextHeader } from './AgentContextHeader';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ThinkingBar } from '@/components/chat/ThinkingBar';
import { TodoBar } from '@/components/chat/TodoBar';
import { AskUserQuestionPanel } from '../chat/AskUserQuestionPanel';
import { RichTextInput } from '@/components/chat/RichTextInput';
import { useAutoScroll } from '@/hooks/useAutoScroll';
```

Remove:
- `textareaRef`, `overlayRef`
- All slash completion hooks (now inside RichTextInput)
- `adjustHeight`, `handleKeyDown`, `handleTextareaChange`, `handleScroll`
- `DropdownItem` component (now built into RichTextInput)

Update `handleSend` to accept structured data:
```typescript
const handleSend = async (data: { text: string; contentBlocks: ContentBlock[]; images: ImageAttachment[] }) => {
  const text = data.text.trim();
  if ((!text && data.images.length === 0) || isStreaming) return;

  const parsed = parseSlashCommand(text, commands);
  if (parsed && parsed.command.type === 'builtin') {
    // Add user message first
    useAgentStore.setState((s) => ({
      messages: {
        ...s.messages,
        [agent.id]: [...(s.messages[agent.id] ?? []), {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: text,
          timestamp: new Date().toISOString(),
        }],
      },
    }));

    const result = await api.executeCommand(agent.id, parsed.command.name, parsed.args || undefined);
    const icon = result.success ? '✓' : '✗';
    appendStreamEvent(agent.id, {
      type: 'agent.text',
      text: `${icon} ${result.success ? result.message : result.error}`,
    });
    appendStreamEvent(agent.id, { type: 'agent.done' });

    if (result.success && parsed.command.name === 'model' && parsed.args) {
      updateAgent(agent.id, { model: parsed.args });
    }
    return;
  }

  await sendMessage(agent.id, text, agent.model, {
    contentBlocks: data.contentBlocks,
    images: data.images,
  });
};
```

Replace the input area JSX (the section inside the `!hasPendingQuestion` ternary, roughly lines 186-272) with:
```tsx
<div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
  <RichTextInput
    placeholder="Send a message..."
    commands={commands}
    modelValue={agent.model}
    onModelChange={(modelId) => updateAgent(agent.id, { model: modelId })}
    isStreaming={isStreaming}
    onAbort={handleAbort}
    onSend={handleSend}
  />
</div>
```

Remove the `DropdownItem` component at the bottom of the file (lines 278-285).

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: wire AgentPanel with RichTextInput for image support"
```

---

### Task 10: Integration Testing & Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full TypeScript check**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p packages/shared/tsconfig.json && npx tsc --noEmit -p apps/server/tsconfig.json && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -50`
Expected: Zero errors.

- [ ] **Step 2: Start the dev server and verify basic functionality**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npm run dev`
Then open the app in a browser and verify:
1. NewSessionPage input renders correctly with contentEditable
2. Ctrl+V paste of a screenshot inserts inline thumbnail
3. Drag & drop an image file shows inline thumbnail
4. Plus → Add Image file picker works
5. Send works for text-only messages (backward compat)
6. Send works for text + image messages
7. AgentPanel ongoing conversation input works the same way
8. Chat history renders inline images in user messages
9. Clicking image in chat opens preview overlay

- [ ] **Step 3: Fix any issues found during testing**

Address any TypeScript errors, rendering glitches, or functional issues discovered.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete chat image paste feature with inline preview and multimodal sending"
```
