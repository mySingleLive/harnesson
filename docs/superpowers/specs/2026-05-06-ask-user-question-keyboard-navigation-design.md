# AskUserQuestion 键盘导航与视觉增强

## Overview

为 AskUserQuestion 面板添加键盘导航、选项高亮、鼠标悬停反馈和自定义回答输入框自动聚焦功能。通过抽取 `useKeyboardNavigation` 自定义 Hook 实现可复用的导航逻辑。

## 需求

1. **聚焦高亮**：当前被键盘选中的选项有明显紫色高亮（边框 + 外发光）
2. **键盘导航**：`↑`、`↓`、`Ctrl+P`、`Ctrl+N` 在选项间移动焦点
3. **鼠标悬停**：悬停时显示更柔和的高亮（不覆盖键盘聚焦态）
4. **自定义回答导航**：键盘可导航到自定义回答项，输入框自动获得焦点
5. **单选点击行为**：点击选项先高亮，300ms 延迟后提交（提供视觉反馈）
6. **多选键盘支持**：多选模式也支持键盘导航，`Space` 切换勾选

## 新增文件

### `apps/web/src/hooks/useKeyboardNavigation.ts`

```typescript
interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onToggle?: (index: number) => void;
  wrap?: boolean;
}

interface UseKeyboardNavigationReturn {
  focusedIndex: number;
  isFocused: (index: number) => boolean;
  containerProps: {
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  itemProps: (index: number) => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}
```

**行为规则：**

- `focusedIndex` 初始为 -1（无聚焦）
- 首次按 `↓` 时聚焦到第一项（index 0），按 `↑` 时聚焦到最后一项
- `wrap=true` 时循环导航：在最后一项按 `↓` 回到第一项，反之亦然
- `Escape` 重置为 -1

**键盘映射：**

| 按键 | 行为 |
|------|------|
| `ArrowUp` / `Ctrl+P` | 聚焦上一项 |
| `ArrowDown` / `Ctrl+N` | 聚焦下一项 |
| `Enter` | 单选：`onSelect(focusedIndex)`；多选：无操作 |
| `Space` | 多选：`onToggle(focusedIndex)`；单选：同 Enter |
| `Escape` | 取消聚焦 |

## 修改文件

### `apps/web/src/components/chat/AskUserQuestionPanel.tsx`

**主要改动：**

1. **引入 hook**：调用 `useKeyboardNavigation`，`itemCount = options.length + 1`（选项 + 自定义回答）

2. **选项列表统一**：选项和自定义回答构成一个连续的可导航列表，自定义回答为最后一项（index = options.length）

3. **三种视觉状态的 CSS 类：**

```
普通态:     border-[#2a2a4e] bg-[#1a1a2e]
聚焦态:     border-harness-accent bg-[#1e1e3a] shadow-[0_0_0_2px_rgba(139,92,246,0.25)]
悬停态:     border-[#3a3a5c] bg-[#1c1c32]
选中态(多选): border-harness-accent bg-[#1e1e3a]
```

**状态组合优先级：**
- 选中 + 聚焦 → 选中背景色 + 聚焦边框发光
- 聚焦 + 悬停 → 聚焦样式优先（悬停不覆盖）
- 选中 + 悬停 → 选中背景色 + 悬停边框

4. **单选点击流程改造：**

```
点击选项
  → 设置 focusedIndex 为该项
  → 渲染高亮
  → 300ms 后调用 onSubmit(label)
```

通过 `setTimeout` 实现，组件卸载时清除。

5. **自定义回答聚焦：**

当 `focusedIndex === options.length` 时，通过 `useRef` + `useEffect` 自动聚焦到 input 元素。用户可直接输入，Enter 提交。

6. **容器事件绑定：**

```tsx
<div {...containerProps} className="...">
  {options.map((opt, i) => (
    <OptionItem
      key={opt.label}
      focused={isFocused(i)}
      hovered={hoveredIndex === i}
      selected={...}
      onSelect={() => handleSelect(i)}
      {...itemProps(i)}
    />
  ))}
  {/* 自定义回答区域 */}
  <CustomAnswer focused={isFocused(options.length)} inputRef={inputRef} ... />
</div>
```

### `OptionItem` 组件改动

新增 props：
- `focused: boolean` — 键盘聚焦态
- `hovered: boolean` — 鼠标悬停态（由父组件通过 state 管理）

样式计算：
```typescript
const className = clsx(
  'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
  focused && 'border-harness-accent bg-[#1e1e3a] shadow-[0_0_0_2px_rgba(139,92,246,0.25)]',
  !focused && hovered && 'border-[#3a3a5c] bg-[#1c1c32]',
  !focused && !hovered && selected && 'border-harness-accent bg-[#1e1e3a]',
  !focused && !hovered && !selected && 'border-[#2a2a4e] bg-[#1a1a2e]',
);
```

### `PreviewLayout` 组件改动

同样接入 `useKeyboardNavigation`，聚焦选项时同步更新预览内容。

## 交互流程

### 单选模式

```
渲染 → focusedIndex = -1，无高亮
  ↓ 用户按 ↓ 或鼠标悬停
聚焦第一项（紫色发光边框）
  ↓ ↑/↓/Ctrl+P/Ctrl+N 移动聚焦
  ↓ Enter → 提交当前聚焦选项
  ↓ 或 鼠标点击 → 高亮 300ms → 提交
  ↓ 或 ↓ 导航到自定义回答
输入框自动获得焦点
  ↓ 用户输入 + Enter
提交自定义回答
```

### 多选模式

```
渲染 → focusedIndex = -1
  ↓ ↑/↓ 移动聚焦
  ↓ Space 切换当前聚焦项的勾选
  ↓ 鼠标点击也切换勾选
聚焦态与勾选态独立（可同时显示）
  ↓ 点击「确认」按钮
提交所有勾选项
```

## 依赖

- `clsx`（如已安装）用于条件 CSS 类名拼接，否则使用模板字符串
- 无新增外部依赖
