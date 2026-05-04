# Thinking Animation Design

## Overview

Upgrade the agent "thinking" indicator from a simple pulsing dot + static text to a rich animated experience with bouncing dots, text pulse, and rotating status words. The indicator appears in two locations: next to the agent name badge and as a floating bar above the input area.

## Components

### ThinkingIndicator

Core animation component placed in `components/chat/ThinkingIndicator.tsx`.

- Three purple dots (`h-1.5 w-1.5`, `bg-purple-400`) with staggered bounce animation (0.15s delay between each, 0.6s cycle)
- Rotating status text: `thinking` → `reasoning` → `analyzing` → `processing` (cycles every 3s)
- Text styled at `text-[11px]` in `text-purple-400` with opacity pulse animation (0.5→1→0.5, 2s cycle)
- State rotation driven by `useState` + `useEffect` timer
- Props: `size?: 'sm' | 'md'` — `sm` for inline (agent name), `md` for floating bar

### ThinkingBar

Floating bar component placed in `components/chat/ThinkingBar.tsx`.

- Positioned above the input area in AgentPanel
- Reuses ThinkingIndicator with `size="md"`
- Semi-transparent background (`bg-harness-chat/80`) with pulse-glow border
- Fade-in/fade-out transition when streaming starts/stops
- Height ~28px

## Placement

1. **Agent name badge** (`MessageRenderer.tsx`, line 40-44): Replace existing `animate-pulse` dot + static "thinking..." with `<ThinkingIndicator size="sm" />`
2. **Input area** (`AgentPanel.tsx`): Insert `<ThinkingBar />` between message scroll area and input container, visible only when `isStreaming` is true

## Animation Details

| Element       | Animation                          | CSS Class / Keyframe  |
| ------------- | ---------------------------------- | --------------------- |
| Bouncing dots | translateY bounce, staggered 0.15s | `@keyframes bounce-dot` |
| Text pulse    | opacity 0.5→1→0.5, 2s cycle        | `animate-pulse` (Tailwind) |
| Status rotate | text swap every 3s                 | React state timer     |
| Bar glow      | border pulse glow                  | `@keyframes pulse-glow` |

## CSS Additions (globals.css)

- `@keyframes bounce-dot` — single dot bounce (translateY -4px → 0, ease-in-out)
- `@keyframes pulse-glow` — box-shadow pulse for floating bar

## Dependencies

None. Pure CSS animations + React state. Consistent with existing animation patterns in the project.
