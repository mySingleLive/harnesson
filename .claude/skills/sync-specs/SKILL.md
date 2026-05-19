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

1. `.harnesson/.sync-meta.json` 不存在 → **全量模式**
2. `.harnesson/.sync-meta.json` 存在但 `.harnesson/specs/` 目录不存在或为空（有同步历史但数据文件丢失）→ **全量模式**
3. 用户传入 `--full` → **全量模式**
4. 否则 → **增量模式**

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
1. 检查 `.harnesson/specs/` 目录是否存在且非空，若不存在或为空 → 提示数据文件丢失，切换为**全量模式**
2. 读取 `.harnesson/.sync-meta.json` 获取 `lastSyncCommit`
3. 执行 `git diff --name-only <lastSyncCommit>..HEAD`
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

**展开规则（步骤 3d 执行时必须遵守）：**

- **组件目录展开**：当 sourceFiles 包含一个组件目录（如 `components/chat/tool-cards/`）时，必须扫描目录下每个独立组件文件（如 `BashCard.tsx`、`ReadCard.tsx`），为每个用户可感知的组件提取独立的 `component` 概念。**禁止**将多个独立组件文件合并为一个概念。
- **API 操作展开**：当 sourceFiles 包含一个 API 路由文件（如 `routes/projects.ts`）时，必须为该文件中的每个独立 HTTP 端点（GET/POST/PUT/DELETE）提取独立的 `operation` 概念。**禁止**将多个 API 端点合并为一个概念。
- **UI 页面展开**：当 sourceFiles 包含一个页面级目录（如 `components/graph/`）且目录下有多个独立视图组件时，为每个用户可独立使用的视图提取独立的 `component` 概念。
- **多功能组件展开**：当一个组件的 sourceFiles 包含多个独立 hook/辅助文件（如 `useSlashCompletion.ts`、`useImageInput.ts`、`useEmacsKeybindings.ts`），且这些 hook 各自对应一个独立的用户功能（斜杠命令补全、图片上传、快捷键），必须为每个 hook 对应的用户功能提取独立的 `component` 概念。父组件作为中间概念（`feature` 或 `component`），各 hook 对应的功能作为子概念。

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

**粒度下限规则**（在叶子判定前先检查）：
如果一个概念的 sourceFiles 包含 3 个以上独立的用户可感知组件文件或 API 端点，则该概念**不能**映射为叶子节点，必须作为中间节点，每个组件/端点对应一个子概念并映射为独立叶子。

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

sourceFiles 为空且 level>1 → 检查该节点是否为非叶子节点（isLeaf=false）。如果是非叶子节点且有 goals 或 acceptanceCriteria，仍然生成 design.md（内容聚焦业务域概述）。仅当非叶子且无实质内容时才跳过，`design` 设为 null。

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

写入 `.harnesson/.sync-meta.json`：

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
