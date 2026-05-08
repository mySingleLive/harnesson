# Resizable Panel Divider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a draggable divider between Main Content and AgentPanel that allows users to resize the AgentPanel by dragging, with collapse-to-edge behavior and persistent width.

**Architecture:** A standalone `ResizableDivider` component handles all drag interaction and visual states. `MainLayout` manages the panel width state via the existing Zustand `agentStore` (new fields: `panelWidth`, `panelCollapsed`). `AgentPanel` receives width via inline style instead of a fixed Tailwind class. Width persists via localStorage.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Vitest + @testing-library/react

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web/src/components/layout/ResizableDivider.tsx` | Divider component with drag logic and visual states |
| Create | `apps/web/src/components/layout/__tests__/ResizableDivider.test.tsx` | Tests for the divider component |
| Modify | `apps/web/src/stores/agentStore.ts` | Add `panelWidth`, `panelCollapsed`, actions, localStorage persistence |
| Modify | `apps/web/src/components/layout/MainLayout.tsx` | Integrate ResizableDivider, pass width state |
| Modify | `apps/web/src/components/layout/AgentPanel.tsx` | Accept dynamic width prop instead of hardcoded `w-[440px]` |

---

### Task 1: Add panel width state to agentStore

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: Add new fields and actions to AgentState interface**

In `apps/web/src/stores/agentStore.ts`, add to the `AgentState` interface (after `pendingQuestion` line ~16):

```ts
panelWidth: number;
panelCollapsed: boolean;

setPanelWidth: (width: number) => void;
setPanelCollapsed: (collapsed: boolean) => void;
```

- [ ] **Step 2: Add initial state and actions to the store**

In the store definition (after `pendingQuestion: {},` around line 54), add initial state:

```ts
panelWidth: parseInt(localStorage.getItem('agentPanelWidth') ?? '440', 10),
panelCollapsed: localStorage.getItem('agentPanelCollapsed') === 'true',
```

Add the actions (after `setActiveAgent` around line 102):

```ts
setPanelWidth: (width) => {
  localStorage.setItem('agentPanelWidth', String(width));
  set({ panelWidth: width });
},

setPanelCollapsed: (collapsed) => {
  localStorage.setItem('agentPanelCollapsed', String(collapsed));
  set({ panelCollapsed: collapsed });
},
```

- [ ] **Step 3: Verify the store compiles**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to agentStore

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat: add panelWidth and panelCollapsed state to agentStore"
```

---

### Task 2: Create ResizableDivider component

**Files:**
- Create: `apps/web/src/components/layout/ResizableDivider.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/layout/ResizableDivider.tsx`:

```tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const COLLAPSED_WIDTH = 6;
const HOVER_HIT_AREA = 8;

interface ResizableDividerProps {
  minWidth: number;
  currentWidth: number;
  isCollapsed: boolean;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  onCollapse: () => void;
  onExpand: () => void;
}

export function ResizableDivider({
  minWidth,
  currentWidth,
  isCollapsed,
  onResize,
  onResizeEnd,
  onCollapse,
  onExpand,
}: ResizableDividerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    expanded: boolean;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = isCollapsed ? 0 : currentWidth;

      dragRef.current = { startX, startWidth, expanded: false };
      setIsDragging(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [currentWidth, isCollapsed],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - e.clientX;

      if (isCollapsed) {
        if (delta > 10 && !dragRef.current.expanded) {
          dragRef.current.expanded = true;
          onExpand();
        }
        return;
      }

      const newWidth = dragRef.current.startWidth + delta;
      if (newWidth < minWidth) {
        onCollapse();
        dragRef.current = null;
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        return;
      }
      onResize(newWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current && !isCollapsed) {
        const finalWidth = dragRef.current.startWidth + (dragRef.current.startX - e.clientX);
        if (finalWidth >= minWidth) {
          onResizeEnd(finalWidth);
        }
      }
      dragRef.current = null;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isCollapsed, minWidth, onResize, onResizeEnd, onCollapse, onExpand]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex-shrink-0 transition-colors duration-150',
        isCollapsed
          ? `w-[${COLLAPSED_WIDTH}px] cursor-ew-resize`
          : isDragging
            ? 'w-[3px] cursor-col-resize bg-harness-accent'
            : isHovered
              ? 'w-[3px] cursor-col-resize bg-harness-accent'
              : 'w-px cursor-default bg-harness-border',
        isCollapsed && isHovered && 'bg-harness-accent',
      )}
      style={isCollapsed ? { width: COLLAPSED_WIDTH } : undefined}
    />
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/ResizableDivider.tsx
git commit -m "feat: add ResizableDivider component with drag logic"
```

---

### Task 3: Write tests for ResizableDivider

**Files:**
- Create: `apps/web/src/components/layout/__tests__/ResizableDivider.test.tsx`

- [ ] **Step 1: Write the test file**

Create `apps/web/src/components/layout/__tests__/ResizableDivider.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ResizableDivider } from '../ResizableDivider';

describe('ResizableDivider', () => {
  const defaultProps = {
    minWidth: 320,
    currentWidth: 440,
    isCollapsed: false,
    onResize: vi.fn(),
    onResizeEnd: vi.fn(),
    onCollapse: vi.fn(),
    onExpand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a thin divider by default', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const divider = container.firstElementChild as HTMLElement;
    expect(divider).toBeTruthy();
    expect(divider.className).toContain('w-px');
  });

  it('shows accent color and wider width on hover', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const divider = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(divider);
    expect(divider.className).toContain('bg-harness-accent');
    expect(divider.className).toContain('w-[3px]');
  });

  it('calls onResize during drag', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onResize={onResize} />);
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 460 });
    expect(onResize).toHaveBeenCalledWith(480);
  });

  it('calls onCollapse when dragged below minWidth', () => {
    const onCollapse = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onCollapse={onCollapse} />);
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 700 });
    expect(onCollapse).toHaveBeenCalled();
  });

  it('renders collapsed state with wider width', () => {
    const { container } = render(<ResizableDivider {...defaultProps} isCollapsed={true} />);
    const divider = container.firstElementChild as HTMLElement;
    expect(divider.style.width).toBe('6px');
    expect(divider.className).toContain('cursor-ew-resize');
  });

  it('calls onExpand when dragging out from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 485 });
    expect(onExpand).toHaveBeenCalled();
  });

  it('does not expand on small drag from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 495 });
    expect(onExpand).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run src/components/layout/__tests__/ResizableDivider.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/__tests__/ResizableDivider.test.tsx
git commit -m "test: add ResizableDivider component tests"
```

---

### Task 4: Update AgentPanel to accept dynamic width

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`

- [ ] **Step 1: Add width prop to AgentPanelProps**

In `apps/web/src/components/layout/AgentPanel.tsx`, update the interface at line 16:

```ts
interface AgentPanelProps {
  agent: Agent;
  messages: AgentMessage[];
  isMaximized: boolean;
  width?: number;
  onToggleMaximize: () => void;
  onClose: () => void;
}
```

Update the destructuring at line 24:

```ts
export function AgentPanel({ agent, messages, isMaximized, width, onToggleMaximize, onClose }: AgentPanelProps) {
```

- [ ] **Step 2: Replace fixed width with dynamic width**

Replace line 37:

```ts
const width = isMaximized ? 'flex-1' : 'w-[440px] flex-shrink-0';
```

With:

```ts
const widthStyle = isMaximized
  ? 'flex-1'
  : 'flex-shrink-0';
const widthProp = isMaximized ? {} : { style: { width: `${width ?? 440}px` } };
```

Update the outer div at line 83 to use `widthProp`:

```tsx
<div className={`relative flex h-full flex-col border-r border-harness-border bg-harness-chat ${widthStyle}`} {...widthProp}>
```

- [ ] **Step 3: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: AgentPanel accepts dynamic width prop"
```

---

### Task 5: Integrate ResizableDivider into MainLayout

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: Add imports and read new store state**

In `apps/web/src/components/layout/MainLayout.tsx`, add import at the top (after line 6):

```ts
import { ResizableDivider } from './ResizableDivider';
```

Update the destructuring of `useAgentStore` (line 12) to include new fields:

```ts
const { agents, activeAgentId, setActiveAgent, updatePanelState, messages, isStreaming, loadAgents, activateAgent, panelWidth, panelCollapsed, setPanelWidth, setPanelCollapsed } = useAgentStore();
```

- [ ] **Step 2: Replace the panel rendering section**

Replace lines 67-79 (the `{showPanel && (...)}` block and the main content block) with:

```tsx
{showPanel && panelCollapsed && (
  <ResizableDivider
    minWidth={320}
    currentWidth={panelWidth}
    isCollapsed={true}
    onResize={() => {}}
    onResizeEnd={() => {}}
    onCollapse={() => {}}
    onExpand={() => setPanelCollapsed(false)}
  />
)}
{showPanel && !panelCollapsed && (
  <>
    <ResizableDivider
      minWidth={320}
      currentWidth={panelWidth}
      isCollapsed={false}
      onResize={setPanelWidth}
      onResizeEnd={setPanelWidth}
      onCollapse={() => setPanelCollapsed(true)}
      onExpand={() => setPanelCollapsed(false)}
    />
    <AgentPanel
      agent={activeAgent}
      messages={messages[activeAgent.id] ?? []}
      isMaximized={activeAgent.panelState.isMaximized}
      width={panelWidth}
      onToggleMaximize={handleToggleMaximize}
      onClose={handleClose}
    />
  </>
)}
{!(showPanel && activeAgent?.panelState.isMaximized) && (
  <main className="flex-1 overflow-auto bg-harness-content" style={{ minWidth: 300 }}>
    <Outlet />
  </main>
)}
```

Note: The collapsed divider appears *without* the AgentPanel. The uncollapsed state shows both divider and panel. The `<main>` element now has `minWidth: 300` inline style instead of just `flex-1`.

- [ ] **Step 2: Verify compilation and run all tests**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat: integrate ResizableDivider into MainLayout"
```

---

### Task 6: Manual QA in browser

- [ ] **Step 1: Start dev server**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npm run dev`

- [ ] **Step 2: Verify default state**

- Open the app in browser
- Open/create an agent session so AgentPanel is visible
- AgentPanel should show at 440px width by default
- Divider should be a thin 1px line between main content and panel

- [ ] **Step 3: Verify hover state**

- Move mouse to the divider area
- Divider should change to 3px width with accent color
- Cursor should change to col-resize

- [ ] **Step 4: Verify drag resize**

- Click and drag the divider left (AgentPanel grows)
- AgentPanel should resize in real-time
- Release mouse — width should persist
- Refresh page — width should be restored from localStorage

- [ ] **Step 5: Verify collapse behavior**

- Drag the divider to the right until AgentPanel width < 320px
- AgentPanel should collapse to a 6px narrow edge
- Hover over the narrow edge — it should highlight with accent color
- Drag from the narrow edge to the left (>10px) — panel should expand back to last remembered width

- [ ] **Step 6: Verify maximize interaction**

- Click the maximize button in AgentPanel header
- Panel should go full-width (existing behavior)
- Click maximize again to un-maximize
- Panel should return to the width set by dragging (not default 440px)

- [ ] **Step 7: Verify close/reopen**

- Close the AgentPanel
- Reopen by clicking an agent in the sidebar
- Panel should restore to the width from last drag session
