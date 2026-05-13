# sync-specs: testCases 分组与节点状态系统设计

## 概述

对 `sync-specs` skill 的节点 schema 进行两项变更：testCases 从扁平数组改为按类型分组，status 从二元状态扩展为 8 态生命周期。

## 变更 1：testCases 按类型分组

### 变更前

```json
"testCases": [
  { "level": "p0", "type": "e2e", "given": "...", "when": "...", "then": "..." },
  { "level": "p1", "type": "unit", "given": "...", "when": "...", "then": "..." }
]
```

### 变更后

```json
"testCases": {
  "unit-test": [
    { "level": "p1", "given": "...", "when": "...", "then": "..." }
  ],
  "end-to-end": [
    { "level": "p0", "given": "...", "when": "...", "then": "..." }
  ],
  "script-test": []
}
```

### 规则

- 固定三个分组键：`unit-test`、`end-to-end`、`script-test`，不可自定义
- 每个用例不再有 `type` 字段（由分组键隐含）
- `level` (p0-p3) 保留在每个用例内
- 允许某个分组为空数组（该节点无此类测试）
- 三个分组键必须始终存在，即使为空

## 变更 2：节点状态系统

### 完整状态枚举（8 个，固定）

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

### Agent 自动检测规则

用户审核通过后，按优先级从高到低匹配，命中第一条即停止：

1. 代码在 main/master 分支 + 所有测试通过 → `released`
2. 测试脚本存在但未全部通过 → `testing`
3. 代码部分实现 或 仅在功能分支上（非 main） → `in-progress`
4. 代码中存在 TODO/FIXME 注解标记该功能 → `backlog`

### 流转规则

- `draft` → 任意非 draft 状态（用户审核通过时，Agent 按规则自动赋值）
- 其余状态间允许回退（如 `testing` → `in-progress`）
- `todo`、`review`、`dev-done` 由用户手动设置，Agent 不自动赋值这三个状态

## 影响范围

需更新的文件：

- `.claude/skills/sync-specs/SKILL.md` — 节点 Schema 示例、Step 3 生成规则、Step 4 校验规则
- `.claude/skills/sync-specs/references/node-schema.md` — testCase 结构定义、status 字段定义、新增自动检测规则说明

## 涉及的现有节点文件

已有的 `.harnesson/specs/` 下的 JSON 文件需要迁移：
- `testCases` 从扁平数组改为分组对象
- `status` 从 `published`/`draft` 映射到新的状态值（`published` → `released`，`draft` 保持不变）
