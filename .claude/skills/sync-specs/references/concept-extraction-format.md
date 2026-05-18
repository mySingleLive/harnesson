# 概念提取格式规范

本文件定义 Stage 3（概念提取）的输出格式。仅在执行 Stage 3 时加载。

## 输出文件

| 文件 | 用途 |
|------|------|
| `.harnesson/All-Concepts.md` | 扁平概念列表（带引用） |

## All-Concepts.md 格式

文件头部为项目级元数据，后面是概念条目列表：

````markdown
# Concepts: {项目名}

> Total concepts: {N}
> Last synced: {ISO 8601} | Commit: {短 hash}
> Modules: {模块列表，逗号分隔}

---

## CONC-001: {概念名}

- **Type:** {domain|entity|feature|component|operation|interface}
- **Module:** {module-name} (→ [summaries/{module-name}.md](architecture/summaries/{module-name}.md))
- **Summary:** {1-2 句话描述，业务视角}
- **References:** [CONC-NNN {Name}], [CONC-NNN {Name}]
- **Source files:** {glob 模式或文件列表}
- **Last synced:** {ISO 8601} | Commit: {短 hash}

---

## CONC-002: {概念名}

{...}

---
````

## 概念 ID 规则

- 格式：`CONC-{NNN}`，三位数字，零填充
- 全局唯一，跨模块递增
- 增量更新时：新概念分配新 ID，现有概念保持 ID 不变
- 删除的概念 ID 不复用

## 固定类型集合

| Type | 含义 | 识别信号 | 树位置暗示 |
|------|------|---------|-----------|
| `domain` | 高层业务域 | 包含多个子功能的目录级模块，用户直接感知 | 顶层节点 (level 2) |
| `entity` | 业务实体/对象 | 数据模型定义、interface/type 定义 | 中层或叶子 |
| `feature` | 用户可见的功能 | 用户操作路径、页面/路由、use case | 中层或叶子 |
| `component` | UI 或技术组件 | React/Vue 组件、可复用 UI 单元 | 叶子 |
| `operation` | 用户操作或 API | 事件处理函数、API 端点、命令 | 叶子 |
| `interface` | 接口/契约 | API 契约、公共接口、类型导出 | 叶子 |

### 类型分配规则

1. 一个概念只属于一个类型
2. 优先从**业务视角**判断：用户如何理解这个东西？
3. 模糊时按优先级：`domain` > `feature` > `entity` > `operation` > `component` > `interface`
4. 如果一个东西既是 entity 又有操作行为 → 按**主要角色**归类

## 引用（References）规则

- 格式：`[CONC-NNN {Name}]`
- 引用表示**业务关联**，不是代码依赖
- 引用方向：从使用者指向被依赖者
- 引用是可选的 — 概念可以无引用
- 不要创建循环引用（A → B → A）

### 何时添加引用

- 功能 A 使用了实体 B → A 引用 B
- 功能 C 是功能 D 的子操作 → C 引用 D
- 组件 E 显示实体 F 的数据 → E 引用 F
- 域 G 包含功能 H → G 引用 H

## 提取逻辑

### 从架构文档提取

1. 读取 Architecture.md 的 Module Map → 每个模块提取 `domain` 类型概念
2. 读取受影响模块的 summaries/*.md：
   - Summary 段 → 提取 `feature` 类型概念
   - Key Files 中的模型/类型定义 → 提取 `entity` 类型概念
   - Key Files 中的 API 路由 → 提取 `operation` 类型概念
   - Exports 中的接口定义 → 提取 `interface` 类型概念

### 从源代码补充

对于架构文档未覆盖的细节：
- 扫描 sourceFiles 中的 React/Vue 组件文件 → 提取 `component` 类型概念
- 扫描事件处理和 API 调用 → 提取 `operation` 类型概念
- 扫描类型定义文件 → 提取 `entity` 和 `interface` 类型概念

## 增量更新规则

1. 读取现有 All-Concepts.md 中每个概念的 sourceFiles
2. 将 Stage 1 的变更文件列表与概念的 sourceFiles 取交集
3. 交集非空的概念 → 标记为受影响
4. 对受影响概念所属的模块 → 重新执行提取逻辑
5. 比对结果：
   - 新发现的概念 → 分配新 CONC-NNN，追加到列表
   - 不再存在的概念 → 从列表删除（ID 不复用）
   - 内容变化的概念 → 更新条目
6. 未受影响的概念 → 保持不变
7. 引用可能因概念增删而变化 → 检查受影响概念的引用并更新
8. 更新文件头部元数据（Total concepts、Last synced、Commit）
