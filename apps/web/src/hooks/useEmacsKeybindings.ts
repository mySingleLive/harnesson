import { useCallback } from 'react';

/**
 * Emacs-style keybindings for contentEditable editors.
 *
 * Implements Readline-compatible inline editing shortcuts:
 *   Ctrl+A  beginning-of-line      Ctrl+E  end-of-line
 *   Ctrl+B  backward-char           Ctrl+F  forward-char
 *   Ctrl+P  previous-line           Ctrl+N  next-line
 *   Ctrl+D  delete-char             Ctrl+H  delete-backward-char
 *   Ctrl+W  backward-kill-word      Ctrl+K  kill-line
 *   Ctrl+U  unix-line-discard       Ctrl+Y  yank
 *
 * Kill ring is shared across all instances (like Emacs).
 */

// ── Kill ring (global, persists across component lifecycle) ──────────

const killRing: string[] = [];
const MAX_KILL_RING_SIZE = 10;

function pushKill(text: string) {
  if (text) {
    killRing.unshift(text);
    if (killRing.length > MAX_KILL_RING_SIZE) killRing.pop();
  }
}

function popKill(): string | null {
  return killRing.length > 0 ? killRing[0] : null;
}

// ── Types ────────────────────────────────────────────────────────────

interface UseEmacsKeybindingsOptions {
  editorRef: React.RefObject<HTMLElement | null>;
  isComposing: boolean;
  onTextChange?: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useEmacsKeybindings({
  editorRef,
  isComposing,
  onTextChange,
}: UseEmacsKeybindingsOptions) {
  /**
   * Handle Emacs-style keyboard shortcuts.
   * Returns `true` if the event was handled (caller should stop processing).
   */
  const handleEmacsKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // Only handle Ctrl (not Cmd/Meta, not Alt)
      if (!e.ctrlKey || e.metaKey || e.altKey) return false;
      if (isComposing) return false;

      const editor = editorRef.current;
      if (!editor) return false;

      // Ensure the selection is inside our editor
      const sel = window.getSelection();
      if (!sel || !editor.contains(sel.anchorNode)) return false;

      const key = e.key.toLowerCase();

      switch (key) {
        // ── Cursor movement ───────────────────────────────────

        case 'a': { // beginning-of-line
          e.preventDefault();
          sel.modify('move', 'backward', 'lineboundary');
          return true;
        }

        case 'e': { // end-of-line
          e.preventDefault();
          sel.modify('move', 'forward', 'lineboundary');
          return true;
        }

        case 'b': { // backward-char
          e.preventDefault();
          sel.modify('move', 'backward', 'character');
          return true;
        }

        case 'f': { // forward-char
          e.preventDefault();
          sel.modify('move', 'forward', 'character');
          return true;
        }

        case 'p': { // previous-line
          e.preventDefault();
          sel.modify('move', 'backward', 'line');
          return true;
        }

        case 'n': { // next-line
          e.preventDefault();
          sel.modify('move', 'forward', 'line');
          return true;
        }

        // ── Deletion (no kill ring) ───────────────────────────

        case 'd': { // delete-char (forward)
          e.preventDefault();
          sel.modify('extend', 'forward', 'character');
          sel.deleteFromDocument();
          onTextChange?.();
          return true;
        }

        case 'h': { // delete-backward-char
          e.preventDefault();
          sel.modify('extend', 'backward', 'character');
          sel.deleteFromDocument();
          onTextChange?.();
          return true;
        }

        // ── Kill & yank (with kill ring) ──────────────────────

        case 'w': { // backward-kill-word
          e.preventDefault();
          sel.modify('extend', 'backward', 'word');
          pushKill(sel.toString());
          sel.deleteFromDocument();
          onTextChange?.();
          return true;
        }

        case 'k': { // kill-line (cursor → end of line)
          e.preventDefault();
          sel.modify('extend', 'forward', 'lineboundary');
          const killed = sel.toString();
          if (killed) {
            pushKill(killed);
            sel.deleteFromDocument();
          } else {
            // At end of line — also kill the newline character
            sel.modify('extend', 'forward', 'character');
            const nl = sel.toString();
            if (nl) {
              pushKill(nl);
              sel.deleteFromDocument();
            }
          }
          onTextChange?.();
          return true;
        }

        case 'u': { // unix-line-discard (beginning of line → cursor)
          e.preventDefault();
          sel.modify('extend', 'backward', 'lineboundary');
          const killed = sel.toString();
          if (killed) {
            pushKill(killed);
            sel.deleteFromDocument();
          }
          onTextChange?.();
          return true;
        }

        case 'y': { // yank (paste from kill ring)
          e.preventDefault();
          const text = popKill();
          if (text) {
            document.execCommand('insertText', false, text);
            onTextChange?.();
          }
          return true;
        }

        default:
          return false;
      }
    },
    [editorRef, isComposing, onTextChange],
  );

  return { handleEmacsKeyDown };
}
