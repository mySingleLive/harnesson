# sync-specs testCases 分组与状态系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 sync-specs skill 的 testCases 从扁平数组改为按类型分组，status 从二元状态扩展为 8 态生命周期。

**Architecture:** 修改两个 skill 定义文件（SKILL.md 和 node-schema.md），更新节点 schema 示例、生成规则、校验规则和状态定义。纯文档变更，无运行时代码。

**Tech Stack:** Markdown, JSON schema 定义

---

### Task 1: 更新 node-schema.md — testCase 结构

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-schema.md`

- [ ] **Step 1: 替换 testCase 结构定义**

将 `node-schema.md` 中 `### testCase 结构` 部分替换为：

```markdown
### testCases 结构

testCases 为一个对象，包含三个固定分组键，每个分组值为用例数组：

| 字段 | 类型 | 说明 |
|------|------|------|
| unit-test | array[object] | 单元测试用例。可为空数组。 |
| end-to-end | array[object] | 端到端测试用例。可为空数组。 |
| script-test | array[object] | 脚本测试用例。可为空数组。 |

每个分组键必须始终存在，即使为空数组。

用例对象结构（在各分组内）：

| 字段 | 类型 | 说明 |
|------|------|------|
| level | string | 优先级：`p0`（验收标准级）、`p1`（分支覆盖）、`p2`（边界条件）、`p3`（兼容性/环境）。 |
| given | string | Given/When/Then 格式的前置条件。 |
| when | string | Given/When/Then 格式的操作/触发条件。 |
| then | string | Given/When/Then 格式的预期结果。 |

用例不再包含 `type` 字段（由分组键隐含）。
```

- [ ] **Step 2: 更新中间节点示例中的 testCases**

将中间节点示例（`agent-management`）中的 testCases 从：

```json
"testCases": [
  {
    "level": "p0",
    "type": "e2e",
    "given": "侧边栏已加载 Agent 列表",
    "when": "右键点击 Agent 卡片",
    "then": "出现上下文菜单，包含所有预期操作项"
  }
]
```

替换为：

```json
"testCases": {
  "unit-test": [],
  "end-to-end": [
    {
      "level": "p0",
      "given": "侧边栏已加载 Agent 列表",
      "when": "右键点击 Agent 卡片",
      "then": "出现上下文菜单，包含所有预期操作项"
    }
  ],
  "script-test": []
}
```

- [ ] **Step 3: 更新叶子节点示例中的 testCases**

将叶子节点示例（`chat-input`）中的 testCases 从：

```json
"testCases": [
  {
    "level": "p0",
    "type": "e2e",
    "given": "聊天面板已打开",
    "when": "输入 'hello' 并按 Enter",
    "then": "消息发送成功，输入框清空"
  },
  {
    "level": "p1",
    "type": "unit",
    "given": "输入框组件已挂载",
    "when": "输入为空时按 Enter",
    "then": "不触发发送操作"
  },
  {
    "level": "p2",
    "type": "unit",
    "given": "输入框有大量文本（10000+ 字符）",
    "when": "按 Enter 发送",
    "then": "正常发送，不截断"
  }
]
```

替换为：

```json
"testCases": {
  "unit-test": [
    {
      "level": "p1",
      "given": "输入框组件已挂载",
      "when": "输入为空时按 Enter",
      "then": "不触发发送操作"
    },
    {
      "level": "p2",
      "given": "输入框有大量文本（10000+ 字符）",
      "when": "按 Enter 发送",
      "then": "正常发送，不截断"
    }
  ],
  "end-to-end": [
    {
      "level": "p0",
      "given": "聊天面板已打开",
      "when": "输入 'hello' 并按 Enter",
      "then": "消息发送成功，输入框清空"
    }
  ],
  "script-test": []
}
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/references/node-schema.md
git commit -m "feat(sync-specs): update node-schema testCase structure to grouped format"
```

---

### Task 2: 更新 node-schema.md — status 字段

**Files:**
- Modify: `.claude/skills/sync-specs/references/node-schema.md`

- [ ] **Step 1: 替换 status 字段定义**

将必填字段表中 `status` 行从：

```markdown
| status | string | 节点状态：`published`（已发布）或 `draft`（草稿）。 |
```

替换为：

```markdown
| status | string | 节点状态，固定枚举值，见下方状态定义。 |
```

- [ ] **Step 2: 在 syncMeta 结构之后新增状态定义段落**

在 `### syncMeta 结构` 表格之后、`### testCase 结构` 之前，插入：

```markdown
### status 状态定义

节点 status 为固定枚举，共 8 个值：

| 状态 | 含义 | 设置方式 |
|------|------|----------|
| `draft` | 规格节点未通过用户审核 | Skill 流程自动设置 |
| `backlog` | 已提议，未计划做 | Agent 自动检测 |
| `todo` | 计划要做，未开始 | 用户手动 |
| `in-progress` | 正在实施中 | Agent 自动检测 |
| `review` | 审核阶段 | 用户手动 |
| `testing` | 测试阶段（非 unit test，而是 script/e2e 等） | Agent 自动检测 |
| `dev-done` | 开发完成 | 用户手动 |
| `released` | 已发布 | Agent 自动检测 |

#### Agent 自动检测规则

用户审核通过后（Step 5 确认通过时），Agent 按以下优先级从高到低匹配，命中第一条即停止：

1. 代码在 main/master 分支 + 所有测试通过 → `released`
2. 测试脚本存在但未全部通过 → `testing`
3. 代码部分实现 或 仅在功能分支上（非 main） → `in-progress`
4. 代码中存在 TODO/FIXME 注解标记该功能 → `backlog`

#### 流转规则

- `draft` → 任意非 draft 状态（用户审核通过时，Agent 按规则自动赋值）
- 其余状态间允许回退（如 `testing` → `in-progress`）
- `todo`、`review`、`dev-done` 由用户手动设置，Agent 不自动赋值这三个状态
```

- [ ] **Step 3: 更新中间节点示例的 status**

将 `agent-management` 示例中：

```json
"status": "published",
```

替换为：

```json
"status": "released",
```

- [ ] **Step 4: 更新叶子节点示例的 status**

将 `chat-input` 示例中：

```json
"status": "published",
```

替换为：

```json
"status": "released",
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sync-specs/references/node-schema.md
git commit -m "feat(sync-specs): add 8-state status lifecycle to node-schema"
```

---

### Task 3: 更新 SKILL.md — schema 示例和生成规则

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 更新核心字段速览中的 testCases**

将 SKILL.md 中 `### 节点 Schema` 下核心字段速览的 testCases 从：

```json
"testCases": [
    { "level": "p0", "type": "e2e", "given": "...", "when": "...", "then": "..." }
],
```

替换为：

```json
"testCases": {
    "unit-test": [],
    "end-to-end": [
        { "level": "p0", "given": "...", "when": "...", "then": "..." }
    ],
    "script-test": []
},
```

- [ ] **Step 2: 更新核心字段速览中的 status**

将核心字段速览中的：

```json
"status": "published",
```

替换为：

```json
"status": "released",
```

- [ ] **Step 3: 更新 Step 3 生成规则中的 testCases 规则**

将 Step 3 中 `testCases` 生成规则从：

```markdown
- `testCases`：p0 从验收标准直接转换；p1 从代码分支逻辑补充；p2 从边界条件补充；p3 从兼容性场景补充
```

替换为：

```markdown
- `testCases`：对象格式，包含 `unit-test`、`end-to-end`、`script-test` 三个固定分组键，不可自定义。p0 从验收标准直接转换；p1 从代码分支逻辑补充；p2 从边界条件补充；p3 从兼容性场景补充。用例不再包含 `type` 字段
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): update SKILL.md schema examples and generation rules"
```

---

### Task 4: 更新 SKILL.md — Step 4 校验规则

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 在格式校验中新增 testCases 结构校验**

在 Step 4 的 `1. 格式校验` 中，在 `syncMeta 包含 ...` 之后添加一条：

```markdown
   - testCases 为对象，包含 `unit-test`、`end-to-end`、`script-test` 三个固定键，每个值为数组；用例不含 `type` 字段
```

- [ ] **Step 2: 在格式校验中更新 status 校验**

将 Step 4 的 `1. 格式校验` 中关于 status 的描述更新。找到 `status` 相关校验行，确保包含：

```markdown
   - status 为以下枚举值之一：draft, backlog, todo, in-progress, review, testing, dev-done, released
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): update Step 4 validation rules for grouped testCases and status enum"
```

---

### Task 5: 更新 SKILL.md — Step 5 用户审核后状态自动检测

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: 在 Step 5 中添加状态自动检测说明**

在 Step 5 的 `**确认通过** → 进入 Step 6` 之前，添加状态自动检测步骤。将 Step 5 内容更新为：

```markdown
### Step 5：用户审核

1. 展示同步计划摘要（来自 Step 2）
2. 展示校验结果摘要（来自 Step 4）
3. 对每个变更节点，展示草稿与现有文件的 diff（新增节点展示完整内容）
4. 等待用户确认

用户可能：
- **确认通过** → 按以下规则设置每个节点的 status，然后进入 Step 6
  - 代码在 main/master 分支 + 所有测试通过 → `released`
  - 测试脚本存在但未全部通过 → `testing`
  - 代码部分实现 或 仅在功能分支上（非 main） → `in-progress`
  - 代码中存在 TODO/FIXME 注解标记该功能 → `backlog`
- **要求修改** → 修改草稿，回到 Step 4 重新校验
- **拒绝** → 终止流程，保留草稿供参考
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): add auto-detection status rules in Step 5 user review"
```
