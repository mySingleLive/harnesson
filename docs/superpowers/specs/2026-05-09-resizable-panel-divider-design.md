# Resizable Panel Divider Design

Date: 2026-05-09

## Overview

Add a draggable divider between the Main Content area and the AgentPanel, allowing users to dynamically resize the AgentPanel by dragging. The Sidebar remains fixed-width (220px) but supports existing collapse/expand behavior.

## Requirements

- Divider between Main Content and AgentPanel supports mouse drag to resize
- Hover near divider: cursor changes to `col-resize`, divider highlights (thicker + accent color)
- Drag to resize AgentPanel width in real-time
- Each panel has a minimum width; when below minimum, panel collapses to a narrow edge
- Panel width persists across sessions via localStorage

## Architecture

### Component Structure

```
MainLayout
├── Topbar
├── flex container (horizontal)
│   ├── Sidebar (fixed 220px, collapsible)
│   ├── <main> (flex-1, min-width: 300px)
│   ├── <ResizableDivider>          ← NEW
│   └── AgentPanel (dynamic width)
```

### New Component: ResizableDivider

A presentational + interaction component that renders the divider line and handles drag events.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `side` | `'left' \| 'right'` | Which side the controlled panel is on (affects drag direction) |
| `minWidth` | `number` | Minimum width of the controlled panel (320px) |
| `maxWidth` | `number` | Maximum width of the controlled panel (container - sidebar - mainMinWidth - divider) |
| `currentWidth` | `number` | Current panel width |
| `onResize(width: number)` | function | Real-time callback during drag |
| `onResizeEnd(width: number)` | function | Callback when drag ends |
| `onCollapse()` | function | Called when width drops below minWidth |
| `onExpand()` | function | Called when dragging out from collapsed state |
| `isCollapsed` | `boolean` | Whether the panel is collapsed |

**Visual States:**

| State | Divider Style | Cursor |
|-------|--------------|--------|
| Default | 1px, `border-harness-border` | default |
| Hover | 3px, `border-harness-accent`, transition animation | col-resize |
| Dragging | 3px, `border-harness-accent`, body cursor locked to col-resize | col-resize |
| Collapsed | 6px narrow edge, `bg-harness-border`, accent on hover | ew-resize |

### State Management

**Zustand store changes (`agentStore`):**

New fields:
- `panelWidth: number` — current panel width, default 440
- `panelCollapsed: boolean` — whether collapsed, default false

New actions:
- `setPanelWidth(width: number)` — update width during drag
- `setPanelCollapsed(collapsed: boolean)` — toggle collapsed state

**Persistence:** Use existing Zustand `persist` middleware to store `panelWidth` and `panelCollapsed` in localStorage.

## MainLayout Integration

**Before:**
```
<Sidebar w-[220px] />  <main flex-1 />  <AgentPanel w-[440px] />
```

**After:**
```
<Sidebar w-[220px] />  <main flex-1 min-w-[300px] />
<ResizableDivider />   <AgentPanel style={{ width: panelWidth, flexShrink: 0 }} />
```

- `<main>` changes from `flex-1` to `flex-1 min-w-[300px]`
- `AgentPanel` changes from fixed `w-[440px]` to dynamic width via inline style
- Maximize mode logic unchanged (AgentPanel becomes `flex-1`, main hidden)

## Drag Logic

### Normal Drag

```
mousedown → record startX and currentWidth
mousemove → newWidth = currentWidth + (startX - clientX)
            if newWidth < 320 → trigger onCollapse()
            if newWidth >= 320 → call onResize(newWidth)
mouseup   → call onResizeEnd(finalWidth), remove listeners
```

- Add `mousemove`/`mouseup` listeners to `document` on mousedown
- Add `user-select: none` to body during drag to prevent text selection
- Remove listeners on mouseup

### Collapsed State Drag-Out

- Mousedown on the 6px narrow edge
- First mousemove with delta > 10px: expand panel to last remembered width, then continue normal drag
- If mouseup before 10px delta: stay collapsed (prevents accidental expand)

### Maximize Threshold

```
maxWidth = containerWidth - sidebarWidth(220) - mainMinWidth(300) - dividerWidth(4)
if dragging causes main area < 300px → trigger existing maximize logic
```

## Edge Cases

- **Window resize:** If stored `panelWidth` exceeds available space, auto-clamp to max allowed value
- **Initial load:** If stored width > `windowWidth - 520`, fall back to default 440px
- **Maximize button:** Maximizing sets full width but does not overwrite `panelWidth`. Un-maximize restores `panelWidth`.
- **Close panel:** Closing preserves `panelWidth`. Reopening restores it.
- **Sidebar collapse:** Collapsing sidebar increases available space, `maxWidth` increases accordingly.

## Out of Scope

- Double-click divider to reset to default width
- Keyboard-based panel resizing
- Smooth animation of panel content during resize (only divider highlight transitions)
