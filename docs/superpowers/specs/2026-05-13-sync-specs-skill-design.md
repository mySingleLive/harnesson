# sync-specs Skill 设计

## 概述

重新设计 `sync-specs` skill，用于将项目代码分析结果同步为标准化的规格树。采用纯 Agent 驱动方案，Skill 定义流程和输出格式，Agent 在运行时完成所有扫描、分析、生成工作。

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 方案 | 纯 Agent 驱动 | 规格同步核心价值在于 Agent 对代码的理解，确定性部分用规则约束即可 |
| 替换现有 | 替换 `.claude/skills/sync-specs/` | 功能重合，新设计更统一 |
| 存储格式 | JSON（根文件 + 分文件） | 结构化、易解析、支持引用关系 |
| 存储位置 | `.harnesson/specs/` | 项目级配置空间 |
| 树结构 | 单棵统一树 | 不分业务/技术，统一视图 |
| 节点内容 | 所有非根节点都可完整 | 中间节点也需要描述 |
| 同步策略 | 增量为主 + `--full` 可选 | 增量高效，全量兜底 |
| 草稿机制 | `.harnesson/specs/draft/` 临时文件 | 不影响正式数据，审核通过后转正 |
| 同步计划 | Markdown，存于 `.harnesson/plans/` | 人类可读，便于审核 |
| 语言 | 跟随项目语言 | 从代码注释、README、现有文档检测 |

## 存储结构

### 文件布局

```
.harnesson/
├── specs/
│   ├── project.json                          # L1 根节点（项目描述）
│   └── nodes/                                # 所有非根节点
│       ├── {kebab-case-name}.json           # L2 域/功能节点
│       ├── {kebab-case-name}/               # 有子节点时用目录组织
│       │   ├── index.json                   # 自身节点
│       │   ├── {child-name}.json           # 子节点
│       │   └── {child-name}/               # 更深层级
│       └── ...
└── plans/                                    # 同步计划（Markdown）
    └── {YYYY-MM-DD}-{mode}-sync-plan.md
```

草稿文件写入 `.harnesson/specs/draft/`，结构同上。

### 统一节点 Schema

所有节点共享同一 JSON 结构，字段按需填充：

```json
{
  "id": "agent-chat-panel",
  "name": "Agent Chat Panel",
  "level": 2,
  "parent": "project",
  "children": ["chat-input", "message-list"],
  "isLeaf": false,
  "summary": "提供 Agent 对话的交互面板...",
  "goals": [
    "支持用户与 Agent 的实时对话",
    "展示工具调用结果和代码变更"
  ],
  "design": {
    "overview": "采用 React 组件化设计...",
    "flow": "用户输入 -> SSE 流式传输 -> 消息渲染"
  },
  "acceptanceCriteria": [
    {
      "given": "用户在聊天面板输入消息",
      "when": "发送消息给 Agent",
      "then": "消息以流式方式逐字显示回复"
    }
  ],
  "testCases": [
    {
      "level": "p0",
      "type": "e2e",
      "given": "聊天面板已打开",
      "when": "输入消息并点击发送",
      "then": "看到 Agent 的流式回复"
    },
    {
      "level": "p1",
      "type": "unit",
      "given": "消息发送请求",
      "when": "网络超时",
      "then": "显示错误提示并允许重试"
    }
  ],
  "status": "published",
  "syncMeta": {
    "lastSyncAt": "2026-05-13T10:00:00Z",
    "baseCommit": "e270401",
    "baseCommitMessage": "fix: prevent SSE connections from exhausting browser connection pool",
    "branch": "feature/agent-chat-panel",
    "sourceFiles": [
      "apps/web/src/components/chat/"
    ]
  }
}
```

### 根节点特有字段

`project.json` 额外包含：

```json
{
  "id": "project",
  "level": 1,
  "parent": null,
  "treeDepth": 3,
  "treeScenario": "multi-domain",
  "children": ["agent-management", "code-sync"],
  "isLeaf": false,
  "summary": "Harnesson - Visual AI Coding Management Platform",
  "syncMeta": { ... }
}
```

`treeScenario` 取值：`single`（一层）/ `flat`（二层）/ `multi-functional`（多层-功能细化）/ `multi-domain`（多层-多领域）

### 测试用例级别定义

| 级别 | 含义 | 来源 |
|------|------|------|
| p0 | 验收标准级，最高优先级 | 从 acceptanceCriteria 直接转换 |
| p1 | 分支覆盖 | 分析代码分支逻辑 |
| p2 | 边界条件 | 识别输入边界、极端情况 |
| p3 | 兼容性/环境 | 跨浏览器、不同环境场景 |

测试类型：`unit` / `integration` / `e2e`

## 同步流程

### 流程总览

```
/sync-specs [--full]

Step 1: 扫描项目
  ├─ 读取现有规格树（如有）
  ├─ 扫描项目目录结构和关键源文件
  └─ 通过 git diff 识别变更（增量模式）

Step 2: 生成同步计划
  ├─ 对比现有规格树与代码变更
  ├─ 列出需要 新增/更新/删除/不变 的节点
  └─ 输出 Markdown 同步计划到 .harnesson/plans/

Step 3: 生成草稿
  ├─ 按同步计划逐节点生成/更新
  ├─ 代码分析提取功能描述
  └─ 草稿写入 .harnesson/specs/draft/

Step 4: 自动校验（循环直到通过）
  ├─ 格式校验：JSON 格式、必填字段、id/name 命名规范、层级一致性
  ├─ 版本校验：syncMeta.baseCommit 与实际 git 版本是否匹配
  ├─ 内容校验：规格描述是否与代码实际实现一致
  ├─ 结构校验：领域/模块划分是否合理、是否存在功能重叠
  ├─ 唯一性校验：同层节点是否存在重复的 name 或 summary
  ├─ 如发现问题 → 修改草稿并重新校验（循环）
  └─ 全部通过 → 进入用户审核

Step 5: 用户审核
  ├─ 展示同步计划摘要和校验结果
  ├─ 展示每个变更节点的 diff
  └─ 用户确认/修改/拒绝

Step 6: 转正发布
  ├─ 将 draft/ 内容移到正式目录
  ├─ 清理 draft/
  └─ 更新根节点 syncMeta
```

### 增量 vs 全量

| | 增量模式（默认） | 全量模式（--full） |
|---|---|---|
| 触发条件 | `project.json` 存在 | `project.json` 不存在 或 `--full` |
| 扫描范围 | git diff 变更文件 | 全部源文件 |
| 节点处理 | 只处理受影响的节点 | 重建整棵树 |
| 草稿范围 | 仅变更部分 | 全部节点 |

### 同步计划格式

同步计划为 Markdown 文件，保存到 `.harnesson/plans/{YYYY-MM-DD}-{mode}-sync-plan.md`：

```markdown
# 同步计划 - 2026-05-13

## 模式
增量同步

## 基准版本
- Commit: e270401
- Message: fix: prevent SSE connections from exhausting browser connection pool
- Branch: feature/agent-chat-panel

## 变更概览

| 节点 | 操作 | 原因 |
|------|------|------|
| chat-input | 更新 | 相关源文件有变更 |
| message-list | 不变 | 无相关变更 |

## 详细变更

### chat-input (更新)
- 关联文件: apps/web/src/components/chat/ChatInput.tsx
- 变更原因: 新增了文件上传功能
- 预计影响: summary, goals, acceptanceCriteria 需更新

## 新增节点
(无)

## 删除节点
(无)
```

## Skill 文件结构

```
.claude/skills/sync-specs/
├── SKILL.md                    # Skill 定义（流程 + 规则 + 输出格式）
└── references/
    └── node-schema.md          # 节点 JSON Schema 详细说明（按需加载）
```

### Agent 行为规则

| 阶段 | 必须做 | 不能做 |
|------|--------|--------|
| 扫描 | 读取 tsconfig/package.json 理解项目结构 | 不修改任何文件 |
| 计划 | 生成 Markdown 同步计划到 .harnesson/plans/ | 不跳过用户确认 |
| 草稿 | 所有输出写到 .harnesson/specs/draft/ | 不写入正式目录 |
| 校验 | 逐项检查格式/版本/内容/结构/唯一性，发现问题立即修复并重新校验 | 不带问题进入用户审核 |
| 审核 | 展示同步计划摘要、校验结果和完整 diff | 不自动转正 |
| 转正 | 移动草稿到正式目录，清理 draft/ | 不删除用户手动编辑的内容 |

### 唯一性规则

- 同一层级内不允许重复 name 和 summary
- 跨层级允许相似描述（不同抽象层次）
- Agent 需检查并报告重复

### 节点内容生成规则

- summary：从代码注释、README、组件名提取
- goals：从功能行为推断
- design：仅在有明确设计模式时生成
- acceptanceCriteria：每个功能至少 1 个 Given/When/Then
- testCases：p0 从验收标准生成，p1+ 从代码分支/边界条件补充

### 语言规则

- 检测项目主要语言（代码注释、README、现有文档）
- 规格内容跟随项目语言
