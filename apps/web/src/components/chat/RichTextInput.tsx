import { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, StopCircle, ImageIcon, FileText, Terminal, Wrench, Network } from 'lucide-react';
import type { ImageAttachment, ContentBlock, SlashCommand } from '@harnesson/shared';
import { useImageInput, type PendingImage } from '@/hooks/useImageInput';
import { useSlashCompletion } from '@/hooks/useSlashCompletion';
import { useEmacsKeybindings } from '@/hooks/useEmacsKeybindings';
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
  span.style.padding = '2px';
  span.style.background = 'rgba(255,255,255,0.15)';
  span.style.borderRadius = '6px';
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
    container.normalize();
  };

  span.appendChild(img);
  span.appendChild(del);

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (container.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  }

  container.appendChild(span);
}

function extractContentBlocks(container: HTMLElement, images: PendingImage[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const imageMap = new Map(images.map((img) => [img.id, img]));

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text) {
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

// ---- Props ----

interface RichTextInputProps {
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  commands: SlashCommand[];
  cwd?: string;
  modelValue?: string;
  onModelChange?: (model: string) => void;
  showModelSelector?: boolean;
  showBranchSelector?: boolean;
  branchName?: string;
  showTypeSelector?: boolean;
  typeName?: string;
  externalText?: string;
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
  cwd,
  modelValue,
  onModelChange,
  showModelSelector = true,
  showBranchSelector = false,
  branchName = 'main',
  showTypeSelector = true,
  typeName = 'Claude Code',
  externalText,
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

  // Compat textarea ref for useSlashCompletion
  const compatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
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
      const editor = editorRef.current;
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.deleteContents();
      const textNode = document.createTextNode(val);
      range.insertNode(textNode);
      range.setStart(textNode, val.length);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, compatTextareaRef as React.RefObject<HTMLTextAreaElement>, cwd);

  // Sync editor text to internalText state
  const syncText = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText ?? '';
    setInternalText(text);
    return text;
  }, []);

  // Emacs-style inline editing keybindings
  const { handleEmacsKeyDown } = useEmacsKeybindings({
    editorRef,
    isComposing,
    onTextChange: syncText,
  });

  // External text injection (for quick actions)
  useEffect(() => {
    if (externalText !== undefined && editorRef.current) {
      editorRef.current.textContent = externalText;
      setInternalText(externalText);
    }
  }, [externalText]);

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
    } else {
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        e.preventDefault();
        document.execCommand('insertText', false, text);
      }
    }
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

    // Emacs-style inline editing shortcuts (Ctrl+A/E/B/F/P/N/D/H/W/K/U/Y)
    if (handleEmacsKeyDown(e)) return;

    const text = editorRef.current?.textContent ?? '';
    const sel = window.getSelection();
    const cursorPos = sel?.focusOffset ?? 0;

    if (compatTextareaRef.current) {
      compatTextareaRef.current.value = text;
      compatTextareaRef.current.selectionStart = cursorPos;
    }

    if (handleCompletionKeyDown(e)) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      // Check if character before cursor is '\' → insert newline instead of sending
      const sel = window.getSelection();
      const focusNode = sel?.focusNode;
      const focusOffset = sel?.focusOffset ?? 0;
      let shouldNewline = false;
      if (focusNode?.nodeType === Node.TEXT_NODE && focusOffset > 0) {
        shouldNewline = focusNode.textContent?.[focusOffset - 1] === '\\';
      }

      if (shouldNewline) {
        e.preventDefault();
        const range = document.createRange();
        range.setStart(focusNode!, focusOffset - 1);
        range.setEnd(focusNode!, focusOffset);
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand('delete');
        document.execCommand('insertLineBreak');
        syncText();
      } else {
        e.preventDefault();
        handleSendInternal();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComposing, handleEmacsKeyDown, handleCompletionKeyDown]);

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
        className={`relative rounded-2xl border transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)] ${isDragOver ? 'border-harness-accent border-dashed' : 'border-white/10'}`}
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
          className="min-h-[24px] max-h-[140px] w-full resize-none overflow-y-auto no-scrollbar bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none text-gray-300 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600"
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
        <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">⌘V</kbd> 粘贴图片 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Ctrl+A/E</kbd> 行首/行尾 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Ctrl+W</kbd> 删词 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Ctrl+K/U</kbd> 删至行尾/行首 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Ctrl+Y</kbd> 粘贴
      </div>
    </>
  );
}
