# Sync-Specs Pipeline Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the sync-specs skill's AI instruction layer into a 4-stage pipeline (code scan → architecture docs → concept extraction → spec tree) with sourceFiles-based incremental updates.

**Architecture:** Linear pipeline with dirty-check short-circuiting. Each stage produces intermediate artifacts (Architecture.md, All-Concepts.md) that feed the next stage. Only the AI instruction files change; TypeScript scripts remain unchanged.

**Tech Stack:** Markdown skill files, TypeScript CLI scripts (unchanged, used as tools)

**Design Spec:** `docs/superpowers/specs/2026-05-18-sync-specs-pipeline-refactor-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `.claude/skills/sync-specs/references/architecture-doc-format.md` | Create | Architecture doc format spec for Stage 2 |
| `.claude/skills/sync-specs/references/concept-extraction-format.md` | Create | Concept extraction format spec for Stage 3 |
| `.claude/skills/sync-specs/SKILL.md` | Rewrite | Main skill file with 4-stage pipeline |
| `.claude/skills/sync-specs/references/node-identification-examples.md` | Modify | Add concept-to-node mapping examples |

Unchanged files:
- `references/design-doc-templates.md` — still used by Stage 4 for design doc generation
- `references/node-schema.md` — still used for node JSON structure
- `scripts/*` — all TypeScript scripts unchanged

---

### Task 1: Create architecture-doc-format.md

**Files:**
- Create: `.claude/skills/sync-specs/references/architecture-doc-format.md`

- [ ] **Step 1: Write the architecture doc format reference file**

```markdown
# 架构文档格式规范

本文件定义 Stage 2（架构文档生成）的输出格式。仅在执行 Stage 2 时加载。

## 输出文件

| 文件 | 用途 |
|------|------|
| `.harnesson/architecture/Architecture.md` | 项目架构总览 |
| `.harnesson/architecture/summaries/{module-name}.md` | 每个目录级模块的摘要 |

## Architecture.md 格式

```markdown
# Architecture: {项目名}

> Last synced: {ISO 8601} | Commit: {短 hash}

## Module Map

| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|
| AI Agent | src/ai-agent/ | AgentController.ts, SessionManager.ts | AI 对话核心模块 |
| ... | ... | ... | ... |

## Dependency Graph

{Mermaid 图或文字描述模块间依赖关系}
```

## 模块摘要格式

每个 `summaries/{module-name}.md` 遵循以下结构：

```markdown
# Module: {模块名}

> Source files: {glob 模式列表}
> Last synced: {ISO 8601} | Commit: {短 hash}

## Summary

{2-3 句话概述模块的功能和职责，从代码结构角度描述}

## Key Files

### {filename}
{该文件的用途、核心职责、关键导出}

### {filename}
{...}

## Exports

- {SymbolName} ({type}: class/interface/function/const)
- {...}

## Dependencies

- → {module-name} ({依赖原因})
- {...}
```

## 关键文件识别规则

以下类型的文件视为"关键文件"，在模块摘要中单独列出：

1. **入口文件**：`index.ts`、`main.ts`、`app.ts`、`server.ts`
2. **命名模式**：文件名包含 `controller`、`manager`、`service`、`handler`、`router`、`store`、`provider`
3. **大量导出**：导出 5 个以上符号的文件
4. **目录级配置**：目录下存在 `package.json` 时，其 `main`/`exports` 字段指向的文件

## 模块划分规则

- 每个 `src/` 下的**一级子目录**为一个模块
- 如果一级子目录下有明显独立的子域（子目录数 ≥ 3 且各有独立职责），子域也可作为独立模块
- 模块名称使用 kebab-case，与目录名一致
- 共享工具目录（如 `utils/`、`shared/`、`common/`）作为一个"共享基础设施"模块

## 增量更新规则

1. 读取现有 Architecture.md 和 summaries/ 中的 sourceFiles 元数据
2. 将 Stage 1 的变更文件列表与各模块的 sourceFiles 取交集
3. 交集非空的模块 → 重新生成其摘要
4. 交集为空的模块 → 保持不变
5. 检查目录结构是否有变化（新增/删除目录）→ 如有，更新 Architecture.md 的 Module Map
6. 所有受影响模块重新生成后，更新 Architecture.md 的整体元数据（Last synced、Commit）
```

- [ ] **Step 2: Verify the file references match the design spec**

Check that:
- Output paths (`.harnesson/architecture/...`) match the design spec Section "File Layout"
- Module summary structure matches design spec Section "Stage 2: Architecture Docs"
- Incremental update rules match design spec Section "Stage 2: Incremental update"

- [ ] **Step 3: Commit**

```bash
cd C:/Projects/harnesson
git add .claude/skills/sync-specs/references/architecture-doc-format.md
git commit -m "docs(sync-specs): add architecture doc format reference for Stage 2"
```

---

### Task 2: Create concept-extraction-format.md

**Files:**
- Create: `.claude/skills/sync-specs/references/concept-extraction-format.md`

- [ ] **Step 1: Write the concept extraction format reference file**

```markdown
# 概念提取格式规范

本文件定义 Stage 3（概念提取）的输出格式。仅在执行 Stage 3 时加载。

## 输出文件

| 文件 | 用途 |
|------|------|
| `.harnesson/All-Concepts.md` | 扁平概念列表（带引用） |

## All-Concepts.md 格式

文件头部为项目级元数据，后面是概念条目列表：

```markdown
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
```

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
```

- [ ] **Step 2: Verify the file references match the design spec**

Check that:
- Fixed type set matches design spec Section "Stage 3: Fixed type set" exactly (6 types: domain, entity, feature, component, operation, interface)
- Concept entry format matches design spec Section "Stage 3: Concept entry format"
- Incremental update rules match design spec Section "Stage 3: Incremental update"

- [ ] **Step 3: Commit**

```bash
cd C:/Projects/harnesson
git add .claude/skills/sync-specs/references/concept-extraction-format.md
git commit -m "docs(sync-specs): add concept extraction format reference for Stage 3"
```

---

### Task 3: Rewrite SKILL.md

This is the core task. The entire SKILL.md is rewritten to implement the 4-stage pipeline.

**Files:**
- Rewrite: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: Read current SKILL.md to confirm no content is missed**

Read `.claude/skills/sync-specs/SKILL.md` and checklist:
- [ ] Node identification principles → preserved in Stage 4
- [ ] Leaf node rules → preserved in Stage 4
- [ ] CLI commands → preserved in "脚本工具" section
- [ ] Storage structure → updated with new layout
- [ ] Status detection rules → preserved in Stage 4
- [ ] Incremental mode logic → restructured into per-stage dirty checks

- [ ] **Step 2: Write the new SKILL.md**

The complete new content for `.claude/skills/sync-specs/SKILL.md`:

```markdown
---
name: sync-specs
description: 扫描项目代码，通过4阶段管线（代码扫描→架构文档→概念提取→规格树）同步生成标准化的 JSON 规格树。支持增量同步（默认）和全量同步（--full）。当用户输入 /sync-specs、/sync-specs --full，或要求同步项目规格、生成功能规格、更新规格树时触发。
---

# Sync Specs

将项目代码分析结果通过4阶段管线同步为标准化的 JSON 规格树。

## 触发

- `/sync-specs` → 自动判断模式
- `/sync-specs --full` → 强制全量

## 模式判断

1. `.sync-meta.json` 不存在 → **全量模式**
2. 用户传入 `--full` → **全量模式**
3. 否则 → **增量模式**

## 流程总览

```
Stage 1: 代码扫描 → Stage 2: 架构文档 → Stage 3: 概念提取 → Stage 4: 规格树生成
```

每个阶段通过 sourceFiles 脏检查确定是否需要执行。某阶段输入无变更 → 跳过。Stage 1 无变更文件 → 整个 sync 提前结束。

严格按以下步骤顺序执行。

---

## Stage 1: 代码扫描

**此步骤不修改任何文件。**

**全量模式：**
1. 读取 `package.json`、`tsconfig.json`（或等效配置）理解项目结构
2. 扫描全部源文件，按以下规则过滤：
   - Include: `**/*.{ts,tsx,js,jsx,vue,py,go,java,rs}`
   - Exclude: `**/node_modules/**`、`**/.harnesson/**`、`**/*.test.*`、`**/*.spec.*`、`**/*.d.ts`
3. 标记所有后续阶段为需要执行

**增量模式：**
1. 读取 `.sync-meta.json` 获取 `lastSyncCommit`
2. 执行 `git diff --name-only <lastSyncCommit>..HEAD`
3. 按 Stage 1 全量模式的 Include/Exclude 规则过滤变更文件
4. 过滤后无变更文件 → 输出"无变更，sync 完成"并结束
5. 输出变更文件列表，传递给后续阶段

---

## Stage 2: 架构文档生成

**详细格式规范：** `references/architecture-doc-format.md`（按需加载）

**脏检查（增量模式）：**
1. 读取现有 `.harnesson/architecture/summaries/*.md` 中每个模块的 `Source files` 元数据
2. 将 Stage 1 的变更文件列表与各模块的 sourceFiles 取交集
3. 无交集的模块 → 跳过，保持不变
4. 全量模式 → 所有模块都需要生成

**生成流程：**

1. 确定模块划分（按 `references/architecture-doc-format.md` 中的模块划分规则）
2. 对每个需要生成的模块：
   a. 读取模块目录下的源文件
   b. 识别关键文件（入口文件、命名模式匹配、大量导出）
   c. 生成模块摘要：Summary、Key Files、Exports、Dependencies
   d. 写入 `.harnesson/architecture/summaries/{module-name}.md`
3. 生成或更新 `.harnesson/architecture/Architecture.md`：
   - 更新 Module Map 表格
   - 更新 Dependency Graph
   - 更新 `Last synced` 和 `Commit` 元数据
4. 确保 `architecture/` 目录结构存在

**增量更新：** 只重新生成受影响模块的摘要。检查目录结构是否有新增/删除 → 如有，更新 Architecture.md。

---

## Stage 3: 概念提取

**详细格式规范：** `references/concept-extraction-format.md`（按需加载）

**脏检查（增量模式）：**
1. 读取现有 `.harnesson/All-Concepts.md` 中每个概念的 `Source files`
2. 将 Stage 1 的变更文件列表与概念的 sourceFiles 取交集
3. 交集非空的概念 → 受影响，需要重新提取
4. 全量模式 → 所有概念都需要提取

**提取流程：**

1. 读取 `.harnesson/architecture/Architecture.md` 的 Module Map
2. 读取受影响模块的 summaries/*.md
3. 按以下顺序提取概念（详细规则见 `references/concept-extraction-format.md`）：
   a. 从 Module Map 提取 `domain` 类型概念（每个模块 → 一个 domain 概念）
   b. 从模块 Summary 提取 `feature` 类型概念
   c. 从 Key Files 提取 `entity`（数据模型）和 `interface`（API 契约）类型概念
   d. 从源代码补充 `component`（UI 组件）和 `operation`（事件/API）类型概念
4. 为每个概念分配：
   - ID（`CONC-NNN` 格式，增量时新概念用新 ID）
   - Type（固定6种：domain/entity/feature/component/operation/interface）
   - Module（所属模块，链接到 summaries）
   - Summary（1-2 句业务视角描述）
   - References（相关概念的引用）
   - Source files（对应的源文件列表）
5. 写入 `.harnesson/All-Concepts.md`

**增量更新：** 只重新提取受影响模块的概念。新概念追加到列表末尾，删除的概念移除，已有概念更新内容。更新引用关系和文件头部元数据。

---

## Stage 4: 规格树生成

**节点识别原则和叶子判定规则：** `references/node-identification-examples.md`（按需加载）
**节点 JSON Schema：** `references/node-schema.md`（按需加载）
**设计文档模板：** `references/design-doc-templates.md`（按需加载）

### 4a — 概念到节点的映射

读取 `.harnesson/All-Concepts.md`，按概念类型映射到规格树层级：

| 概念 Type | 树位置 | Level |
|-----------|-------|-------|
| `domain` | 顶层业务域节点 | 2 |
| `feature` / `entity` | 中层功能/实体节点 | 3+ |
| `component` / `operation` / `interface` | 叶子节点 | 最终层 |

**AI 组织决策：**
1. `domain` 概念直接映射为 level 2 节点
2. `feature`/`entity` 概念根据 References 归属到对应 domain 下
3. `component`/`operation`/`interface` 概念根据 References 归属到对应 feature/entity 下
4. 引用关系不明确时，根据 Module 归属推断位置
5. 一个概念恰好对应一个节点（1:1 映射）

**叶子节点判定**（映射完成后对每个候选叶子验证）：

**前端（UI）叶子** — 满足任一即为叶子：
1. 一次对后端或外部接口的调用 → 同时产生前端叶子 + 后端叶子，共享父节点
2. 一次用户事件触发的功能，且内部不含外部接口调用（展开/收起、本地过滤、拖拽排序）
3. 不包含条件 1 和 2 的纯渲染组件

**后端叶子** — 满足任一即为叶子：
1. 由 API 触发的一个业务功能
2. 可被外部触发的功能（定时任务、Hooks、AI Function Call、Skills 等）

**无法确定时**：假定为非叶子，继续拆解；若无法再拆解 → 判定为叶子。

### 4b — 增量更新（增量模式）

1. 运行 `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-tree --root .harnesson/specs` 读取现有规格树
2. 比对新旧 All-Concepts.md 的差异：
   - 新增概念 → 创建新节点（运行 `create-node`）
   - 删除概念 → 删除对应节点（运行 `delete-node`）
   - 修改概念 → 更新对应节点（运行 `update-node`）
3. 父节点的 `children` 数组级联更新
4. 未受影响的节点保持不变

### 4c — 生成节点内容

对每个需要生成/更新的节点：

1. 从概念获取基础信息：summary、sourceFiles、module
2. **生成描述性字段**（基于源代码分析）：
   - `summary`：用户视角，1-3 句
   - `goals`：用户目标列表
   - `specDetail`（叶子节点）：description + parameters（string[]）
   - `constraints`（叶子节点）：string[]，≥3 条
3. **生成验收标准**：基于 goals + specDetail + constraints，至少 1 条 Given/When/Then
4. 运行脚本写入节点 JSON：
   ```bash
   echo '<节点数据 JSON>' | node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts create-node --root .harnesson/specs/draft
   ```
   节点数据必须包含 `_nodePath` 字段。返回 `{ok: false}` → 根据错误修复 → 重试。

**补全操作（仅增量）：**
运行 `read-node` → 仅生成缺失字段 → 运行 `update-node`。

### 4d — 生成设计文档

对每个 sourceFiles 非空或 level=1 的节点：
1. 按 `references/design-doc-templates.md` 选择模板并填充
2. 若有 specDetail → 追加 "## Specification Details"
3. 若有 constraints → 追加 "## Constraints"
4. 写入 `draft/design/{path}.md`
5. 节点 JSON 中 `design` 设为相对路径

sourceFiles 为空且 level>1 → `design` 设为 null，跳过。

### 4e — 统一校验

```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --root .harnesson/specs/draft
```

6 项校验：格式、版本、内容、唯一性、设计文档、覆盖度。失败 → 修复 → 重新校验。

### 4f — 用户审核

1. 展示变更摘要和校验结果
2. 运行 `read-tree --root .harnesson/specs/draft` 展示完整节点
3. 等待用户确认

确认后设置 status（按 `references/node-schema.md` 中的自动检测规则）。

### 4g — 转正

```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts promote-draft --root .harnesson/specs
```

### 4h — 更新同步元数据

写入 `.sync-meta.json`：

```json
{
  "lastSyncCommit": "{当前 HEAD commit hash}",
  "branch": "{当前分支名}",
  "stages": {
    "scan": { "completedAt": "{ISO 8601}", "changedFiles": {N} },
    "architecture": { "completedAt": "{ISO 8601}", "affectedModules": ["..."] },
    "concepts": { "completedAt": "{ISO 8601}", "affectedConcepts": ["CONC-NNN", "..."] },
    "specTree": { "completedAt": "{ISO 8601}", "nodesCreated": {N}, "nodesUpdated": {N}, "nodesDeleted": {N} }
  }
}
```

---

## 存储结构

```
.harnesson/
├── .sync-meta.json                   # 同步元数据
├── architecture/
│   ├── Architecture.md               # 项目架构总览
│   └── summaries/                    # 模块摘要
│       └── {module-name}.md          # 每个模块一个文件
├── All-Concepts.md                   # 扁平概念列表
├── specs/
│   ├── project.json                  # 根节点（level 1）
│   ├── nodes/                        # 非根节点
│   │   └── {id}/                     # 每个节点一个文件夹
│   │       ├── node.json             # 节点数据
│   │       ├── design.md             # 设计文档（可选）
│   │       └── {child-id}/           # 子节点，递归
│   ├── draft/                        # 草稿（审核中，结构同上）
│   │   ├── README.md                 # 变更清单
│   │   └── nodes/
│   └── sync-plans/                   # 历史同步计划（保留，不再新增）
```

## 节点 Schema

所有节点共享统一 JSON 结构。详细字段说明见 `references/node-schema.md`（按需加载）。

核心字段：id, name, level, parent, children, isLeaf, summary, goals, design, acceptanceCriteria, specDetail, constraints, status, syncMeta

根节点额外字段：treeDepth（整数）、treeScenario（single/flat/multi-functional/multi-domain）

## 脚本工具

本 skill 使用 TypeScript CLI 脚本处理所有 JSON 文件的读写和校验操作，确保格式正确性。

**运行方式：** `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts <command> [options]`

**命令：**
- `init-tree --root <path>` — 初始化规格目录结构
- `read-tree [--node <id>] [--root <path>]` — 读取规格树
- `read-node <nodePath> [--root <path>]` — 读取单个节点
- `create-node` (stdin JSON, 含 `_nodePath`) — 创建节点
- `update-node <nodePath>` (stdin JSON) — 更新节点
- `delete-node <nodePath>` — 删除节点
- `validate [--root <path>] [--fix]` — 校验规格树
- `promote-draft [--root <path>]` — 草稿转正
```

- [ ] **Step 3: Verify cross-references in the new SKILL.md**

Check that:
- `references/architecture-doc-format.md` is referenced in Stage 2 → created in Task 1
- `references/concept-extraction-format.md` is referenced in Stage 3 → created in Task 2
- `references/node-identification-examples.md` is referenced in Stage 4 → exists, will be updated in Task 4
- `references/node-schema.md` is referenced → exists, unchanged
- `references/design-doc-templates.md` is referenced → exists, unchanged
- CLI command paths are correct: `.claude/skills/sync-specs/scripts/specs-cli.ts`
- All file paths (`.harnesson/architecture/`, `.harnesson/All-Concepts.md`, `.harnesson/.sync-meta.json`) are consistent with design spec

- [ ] **Step 4: Delete the old SKILL.md and write the new one**

Since this is a complete rewrite, replace the entire file content. Use the content from Step 2 above.

- [ ] **Step 5: Commit**

```bash
cd C:/Projects/harnesson
git add .claude/skills/sync-specs/SKILL.md
git commit -m "refactor(sync-specs): rewrite SKILL.md with 4-stage pipeline architecture"
```

---

### Task 4: Update node-identification-examples.md

Add concept-to-node mapping examples to help AI understand how Stage 3 concepts map to Stage 4 nodes.

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-identification-examples.md`

- [ ] **Step 1: Append concept-to-node mapping section**

Append the following content to the end of `references/node-identification-examples.md`:

```markdown

## 概念到节点的映射示例

以下示例展示 Stage 3 提取的概念如何映射到 Stage 4 的规格树节点。

### 映射规则

| 概念 Type | 节点 Level | isLeaf | 说明 |
|-----------|-----------|--------|------|
| domain | 2 | false | 顶层业务域 |
| feature | 3+ | 视子概念而定 | 用户可见功能 |
| entity | 3+ | 视子概念而定 | 业务实体 |
| component | 最终层 | true | UI/技术组件 |
| operation | 最终层 | true | 用户操作/API |
| interface | 最终层 | true | 接口/契约 |

### 完整映射示例

**概念列表（All-Concepts.md 片段）：**

- CONC-001: AI Agent (domain, module: ai-agent)
- CONC-002: Message Exchange (feature, module: ai-agent, refs: [CONC-001])
- CONC-003: Message Input (component, module: ai-agent, refs: [CONC-002])
- CONC-004: Send Message (operation, module: ai-agent, refs: [CONC-002, CONC-003])
- CONC-005: Response Display (component, module: ai-agent, refs: [CONC-002])
- CONC-006: Session Management (feature, module: ai-agent, refs: [CONC-001])
- CONC-007: Create Session (operation, module: ai-agent, refs: [CONC-006])
- CONC-008: Delete Session (operation, module: ai-agent, refs: [CONC-006])

**映射后的规格树：**

```
project (level 1)
└── ai-agent (level 2, ← CONC-001 domain)
    ├── message-exchange (level 3, ← CONC-002 feature)
    │   ├── message-input (level 4, ← CONC-003 component, isLeaf: true)
    │   ├── send-message (level 4, ← CONC-004 operation, isLeaf: true)
    │   └── response-display (level 4, ← CONC-005 component, isLeaf: true)
    └── session-management (level 3, ← CONC-006 feature)
        ├── create-session (level 4, ← CONC-007 operation, isLeaf: true)
        └── delete-session (level 4, ← CONC-008 operation, isLeaf: true)
```

### 跨前后端映射示例

**概念：**
- CONC-010: Submit Form (operation, refs: [CONC-011 Form UI])
- CONC-011: Form UI (component, refs: [CONC-010])

**映射：** operation 命中前端叶子条件1（API 调用），拆为前端叶子 + 后端叶子：

```
form-management (level 3)
├── form-ui (level 4, ← CONC-011, 前端叶子)
└── form-submit-api (level 4, ← CONC-010, 后端叶子)
```

### 实体映射示例

**概念：**
- CONC-020: Project Settings (entity, refs: [CONC-001])
- CONC-021: Settings Name Field (component, refs: [CONC-020])
- CONC-022: Save Settings (operation, refs: [CONC-020])

**映射：** entity 作为中层节点，其子操作和组件作为叶子：

```
ai-agent (level 2)
└── project-settings (level 3, ← CONC-020 entity)
    ├── settings-name-field (level 4, ← CONC-021 component, isLeaf: true)
    └── save-settings (level 4, ← CONC-022 operation, isLeaf: true)
```
```

- [ ] **Step 2: Verify the appended section is consistent**

Check that:
- Mapping rules table matches the design spec's tree hierarchy rules
- Examples use the same concept ID format (CONC-NNN)
- Example output follows existing node tree format

- [ ] **Step 3: Commit**

```bash
cd C:/Projects/harnesson
git add .claude/skills/sync-specs/references/node-identification-examples.md
git commit -m "docs(sync-specs): add concept-to-node mapping examples for Stage 4"
```

---

### Task 5: Integration verification

- [ ] **Step 1: Read all changed files and verify consistency**

Read the following files and verify:
1. `.claude/skills/sync-specs/SKILL.md` — check all cross-references point to existing files
2. `.claude/skills/sync-specs/references/architecture-doc-format.md` — check format matches SKILL.md Stage 2 description
3. `.claude/skills/sync-specs/references/concept-extraction-format.md` — check format matches SKILL.md Stage 3 description
4. `.claude/skills/sync-specs/references/node-identification-examples.md` — check new section is consistent

Cross-reference checks:
- [ ] Fixed type set (6 types) is identical across SKILL.md, concept-extraction-format.md, and node-identification-examples.md
- [ ] File paths (`.harnesson/architecture/`, `.harnesson/All-Concepts.md`, `.harnesson/.sync-meta.json`) are consistent everywhere
- [ ] CLI command syntax is identical to current SKILL.md (no changes to script paths)
- [ ] Node JSON structure references match `references/node-schema.md` (unchanged)

- [ ] **Step 2: Verify existing scripts are not broken**

Confirm that the SKILL.md references the exact same CLI commands as before:
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts <command> [options]
```
Commands used: read-tree, read-node, create-node, update-node, delete-node, validate, promote-draft
These must match the existing CLI interface in `scripts/specs-cli.ts`.

- [ ] **Step 3: Final commit if any fixes were needed**

If fixes were applied during verification:
```bash
git add -A
git commit -m "fix(sync-specs): address integration verification findings"
```

If no fixes needed, skip this step.
