# Projects Page Design

## Overview

Projects 页面为用户提供项目管理的入口。支持两种互斥状态：空状态（无项目）和列表状态（有项目）。用户可通过打开文件夹、克隆 Git 仓库、创建新项目三种方式添加项目。

## Architecture

采用单页面双状态方案：一个 `ProjectsPage` 组件根据 `projects.length === 0` 切换 `EmptyState` 和 `ProjectList` 两个子视图。

### Component Tree

```
ProjectsPage
├── EmptyState              (无项目时)
│   ├── WelcomeHeader
│   └── ActionCards         三张操作卡片（横排，视觉突出）
│
└── ProjectList             (有项目时)
    ├── ListHeader          标题 + 搜索 + 布局切换 + "添加项目"按钮
    ├── ProjectContent
    │   ├── CardGrid        卡片布局
    │   └── RowList         列表布局
    └── AddProjectDropdown  "添加项目"下拉菜单
```

### File Structure

- `apps/web/src/pages/ProjectsPage.tsx` — 主页面（改造现有）
- `apps/web/src/components/projects/` — 子组件目录（新建）
  - `EmptyState.tsx`
  - `ActionCard.tsx`
  - `ProjectList.tsx`
  - `ProjectCard.tsx`
  - `ProjectRow.tsx`
  - `ProjectDetailModal.tsx`
  - `CloneRepoModal.tsx`
  - `CreateProjectModal.tsx`
- `apps/web/src/hooks/useProjectActions.ts` — 添加项目逻辑 hook

---

## EmptyState 空状态页面

**布局**：页面垂直水平居中。

**内容**：
- 标题："Harnesson"，大号白色字体
- 副标题："开始你的第一个项目"，中号灰色字体
- 三张等宽卡片横排：
  1. 打开文件夹 — 图标 `FolderOpen`，描述"选择本地项目文件夹"
  2. 克隆仓库 — 图标 `GitClone`，描述"从远程 Git 仓库克隆"
  3. 创建项目 — 图标 `Plus`，描述"创建一个新的空项目"

**视觉风格**：
- 背景：`--color-harness-content` (#16162a)
- 卡片背景：`--color-harness-sidebar` (#1e1e32)
- 卡片 hover：边框变为 `--color-harness-accent` (#8b5cf6)，`translateY(-2px)` + 阴影加深

### 拖拽支持

- 整个 EmptyState 区域作为 drop zone
- 使用 HTML5 Drag & Drop API（`dragenter` / `dragover` / `dragleave` / `drop`）
- 拖入时：页面边框变为 accent 虚线 + 半透明紫色遮罩 + 三张卡片 opacity 0.3 + 中央提示"释放以打开项目文件夹"
- 仅接受文件夹，拒绝文件拖入
- 松开后：读取路径，执行与"打开文件夹"相同的逻辑
- 拖拽状态用局部 `useState` 管理

---

## ProjectList 有项目页面

### ListHeader

- 左侧：标题"项目" + 项目数量 badge
- 右侧依次：搜索输入框、布局切换按钮组（卡片 `LayoutGrid` / 列表 `List`）、"添加项目"按钮（`Plus` 图标 + 文字）

### 布局切换

- Store 中 `projectViewMode: 'card' | 'list'`，默认卡片模式
- 用户选择持久化到 localStorage

### 搜索

- 客户端过滤，按项目名称和路径模糊匹配
- 实时过滤，无防抖

### 卡片模式（CardGrid）

- 网格：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- 每张卡片：
  - 顶部：`FolderKanban` 图标 + 项目名称
  - 中部：路径（截断显示）
  - 底部：更新时间 + 更多菜单（查看详情 / 打开文件夹 / 移除）
- 点击卡片主体 → 打开项目

### 列表模式（RowList）

- 表格式，每行：图标 + 项目名 + 路径 + 更新时间 + 操作按钮
- 行 hover 背景变亮
- 点击行 → 打开项目

### 操作行为

- **打开项目**：调用 `projectStore.switchProject(id, branch)`，branch 优先使用项目记录的最近分支，无记录时默认 "main"
- **查看详情**：弹出 `ProjectDetailModal`
- **打开文件夹**：调用后端 API 在系统文件管理器中打开
- **移除项目**：inline confirm（红色"确认移除？" + "取消"，3 秒自动恢复），确认后从列表移除，不删除实际文件

### "添加项目"下拉菜单

- 点击按钮弹出 Popover，三个选项与 EmptyState 相同
- 点击外部自动关闭

---

## 添加项目流程

### 1. 打开文件夹

- 触发后端 API 打开系统原生文件夹选择对话框
- 用户选择后后端返回 `{ name, path }`
- 前端检查是否已在列表：已存在 → 提示"该项目已添加"；不存在 → 调用创建 API 添加
- 拖拽打开走同样逻辑，跳过选择对话框

### 2. 克隆 Git 仓库

弹出 Modal：
- 仓库 URL 输入框（必填）
- 本地存放路径输入框（默认从设置或 home 目录推导）
- 克隆按钮

流程：
- 显示进度状态（spinner + "克隆中..."）
- 完成 → 自动添加到列表 + 切换为活跃项目
- 失败 → 显示错误信息，保持在 Modal 中允许重试

### 3. 创建新项目

弹出 Modal：
- 项目名称输入框（必填）
- 项目路径输入框（可浏览选择）
- 描述输入框（选填）
- 初始化选项：git init（默认勾选）
- 创建按钮

流程：
- 后端创建目录 + 可选 git init
- 完成 → 添加到列表 + 切换为活跃项目

### 公共逻辑

- 统一通过 `useProjectActions` hook 封装
- 所有 Modal 共享暗色样式（背景 `--color-harness-sidebar`）

---

## 项目详情弹窗

```
┌──────────────────────────────┐
│  项目详情               [✕]  │
├──────────────────────────────┤
│  名称    my-project          │
│  路径    /Users/x/proj       │
│  来源    本地文件夹           │
│  描述    项目描述...          │
│  Agent   3 个活跃            │
│  创建    2026-04-20          │
│  更新    2026-04-24          │
├──────────────────────────────┤
│         [打开项目]  [删除]    │
└──────────────────────────────┘
```

- key-value 行排列，label 灰色，value 白色
- 来源映射：local → "本地文件夹"，clone → "Git 克隆"，create → "手动创建"
- Agent 数量：0 个显示灰色"无活跃 Agent"
- 底部："打开项目"（accent 色主按钮）+ "删除"（红色文字按钮）

---

## Data Layer

### API Endpoints (Mock)

```
GET    /api/projects              获取项目列表
GET    /api/projects/:id          获取项目详情
DELETE /api/projects/:id          移除项目
POST   /api/projects/open-folder  打开文件夹选择对话框并添加项目
POST   /api/projects/clone        克隆仓库并添加项目
POST   /api/projects/create       创建新项目并添加项目
POST   /api/projects/:id/reveal   在文件管理器中打开
```

三个添加接口各自完成操作并返回创建的 Project 对象，无需单独的 `POST /api/projects`。

### Project Type

```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  source: 'local' | 'clone' | 'create';
  agentCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Store Extension

```typescript
interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  // actions
  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
}
```

- `viewMode` 持久化到 localStorage
- 搜索过滤在组件层通过 selector 实现

---

## Interaction & Animation

### Page Transitions
- EmptyState ↔ ProjectList：`opacity + translateY` 过渡（200ms ease）
- 列表加载时使用骨架屏

### Cards & Rows
- 卡片 hover：accent 边框 + `translateY(-2px)` + 阴影
- 列表行 hover：背景变亮
- 列表项出现：stagger 动画（每项延迟 50ms）

### Drag & Drop (EmptyState)
- `dragenter`：accent 虚线边框 + 紫色遮罩
- `dragleave`：恢复原样
- `drop`：遮罩消失 → loading 态

### Modals
- 弹出：backdrop fade-in（150ms）+ Modal `scale(0.95→1)` + fade-in（200ms）
- 关闭：反向动画
- 克隆进度：spinner + "克隆中..."

### Layout Switch
- 卡片 ↔ 列表：内容区 `opacity` 过渡（150ms）

### Remove Confirm
- Inline confirm：按钮变红色"确认移除？" + "取消"，3 秒自动恢复原状
