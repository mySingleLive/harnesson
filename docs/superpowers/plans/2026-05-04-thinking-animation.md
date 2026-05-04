# Thinking Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple pulsing dot + static "thinking..." text with a rich animated indicator featuring bouncing dots, rotating status words, and a floating bar above the input area.

**Architecture:** Two new React components (`ThinkingIndicator`, `ThinkingBar`) plus two CSS keyframes in `globals.css`. Pure CSS animations + React state timer for status rotation. No new dependencies.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add CSS keyframes to globals.css

**Files:**
- Modify: `apps/web/src/globals.css` (append after existing keyframes)

- [ ] **Step 1: Add `bounce-dot` keyframe**

Append after the existing `fade-slide-in` keyframe at line 73:

```css
/* Thinking animation — bouncing dots */
@keyframes bounce-dot {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
}

/* Thinking bar — pulse glow border */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
  }
  50% {
    box-shadow: 0 0 8px 1px rgba(139, 92, 246, 0.15);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/globals.css
git commit -m "feat: add bounce-dot and pulse-glow keyframes for thinking animation"
```

---

### Task 2: Create ThinkingIndicator component

**Files:**
- Create: `apps/web/src/components/chat/ThinkingIndicator.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/chat/ThinkingIndicator.tsx`:

```tsx
import { useState, useEffect } from 'react';

const STATUS_WORDS = ['thinking', 'reasoning', 'analyzing', 'processing'];

interface ThinkingIndicatorProps {
  size?: 'sm' | 'md';
}

export function ThinkingIndicator({ size = 'sm' }: ThinkingIndicatorProps) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((i) => (i + 1) % STATUS_WORDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`inline-block rounded-full bg-purple-400 ${dotSize}`}
            style={{
              animation: 'bounce-dot 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <span className={`${textSize} text-purple-400 animate-pulse`}>
        {STATUS_WORDS[wordIndex]}...
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/ThinkingIndicator.tsx
git commit -m "feat: add ThinkingIndicator component with bouncing dots and rotating status"
```

---

### Task 3: Create ThinkingBar component

**Files:**
- Create: `apps/web/src/components/chat/ThinkingBar.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/chat/ThinkingBar.tsx`:

```tsx
import { ThinkingIndicator } from './ThinkingIndicator';

export function ThinkingBar() {
  return (
    <div
      className="flex items-center justify-center border-t border-purple-500/20 bg-harness-chat/80 px-4 py-1.5"
      style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
    >
      <ThinkingIndicator size="md" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/ThinkingBar.tsx
git commit -m "feat: add ThinkingBar floating indicator component"
```

---

### Task 4: Integrate ThinkingIndicator into MessageRenderer

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx:40-44`

- [ ] **Step 1: Add import and replace inline thinking indicator**

Replace line 4 (import) and lines 40-44 in `MessageRenderer.tsx`.

Current line 4:
```tsx
import type { AgentMessage } from '@harnesson/shared';
```

Add after it:
```tsx
import { ThinkingIndicator } from './ThinkingIndicator';
```

Replace lines 40-44:
```tsx
        {isStreaming && (
          <span className="flex items-center gap-1 text-[11px] text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            thinking...
          </span>
        )}
```

With:
```tsx
        {isStreaming && <ThinkingIndicator size="sm" />}
```

- [ ] **Step 2: Verify no visual regressions**

Run: `cd apps/web && npm run dev`

Open the app, send a message to an agent, verify:
- Three bouncing purple dots appear next to agent name during streaming
- Status text rotates every 3s: thinking → reasoning → analyzing → processing
- When streaming ends, indicator disappears
- Existing message rendering, tool cards, markdown are unaffected

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: replace static thinking text with animated ThinkingIndicator"
```

---

### Task 5: Integrate ThinkingBar into AgentPanel

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx:8,89-91`

- [ ] **Step 1: Add import**

At line 8, after the existing import:
```tsx
import { useAutoScroll } from '@/hooks/useAutoScroll';
```

Add:
```tsx
import { ThinkingBar } from '@/components/chat/ThinkingBar';
```

- [ ] **Step 2: Insert ThinkingBar between scroll area and input area**

Between line 89 (`</div>` closing the scroll area) and line 91 (`<div className={`px-3 pb-3...`}`), insert:

```tsx
      {isStreaming && <ThinkingBar />}
```

The result should look like:
```tsx
      </div>

      {isStreaming && <ThinkingBar />}

      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
```

- [ ] **Step 3: Verify in browser**

Run: `cd apps/web && npm run dev`

Send a message to an agent, verify:
- A floating bar appears above the input area during streaming
- Bar shows bouncing dots + rotating status text
- Bar has subtle purple glow pulse on the border
- Bar disappears when streaming ends
- Input area, send button, and abort button all still work correctly
- Scroll-to-bottom button unaffected

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: add ThinkingBar floating indicator above input area"
```

---

### Task 6: Final visual verification

- [ ] **Step 1: Full end-to-end test**

Run: `cd apps/web && npm run dev`

1. Open the app, select a project and agent
2. Send a message
3. Verify both indicators appear simultaneously:
   - Inline: next to agent name badge in the message
   - Floating: bar above input area
4. Verify status words rotate in sync
5. Verify both disappear when agent response completes
6. Verify no console errors or layout shifts
7. Resize panel (maximize/restore) — bar should adapt

- [ ] **Step 2: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: polish thinking animation edge cases"
```
