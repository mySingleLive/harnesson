# Sync-Specs 生成顺序优化设计

## 背景

sync-specs 的 Step 2a 当前将所有字段（summary, goals, acceptanceCriteria, testCases, specDetail, constraints）在一个平面列表中生成，无依赖顺序。这导致：
1. acceptanceCriteria 无法引用 specDetail.parameters 和 constraints 中的具体条件
2. testCases 的 p0 用例无法准确从 acceptanceCriteria 转换

## 变更

### 1. Step 2a：引入生成阶段依赖链

**当前：** 所有字段在一个无序列表中生成。

**优化后：** 明确 3 个生成阶段，每阶段标注依赖：

```
阶段 1 — 描述性字段（基于源代码分析）：
  summary, goals, specDetail, constraints

阶段 2 — 验收标准（基于阶段 1 输出）：
  acceptanceCriteria，应引用 specDetail.parameters 和 constraints 中的具体条件

阶段 3 — 设置元信息：
  design 字段设为设计文档相对路径（实际内容由 Step 2b 生成）
```

同一节点仍由 LLM 单次处理，但指令结构强制生成顺序。LLM 在生成 acceptanceCriteria 时，specDetail 和 constraints 刚刚生成完毕，仍在上下文中。

### 2. 完全移除 testCases

**理由：**
- testCases 的质量严重依赖 acceptanceCriteria（p0）和 specDetail/constraints（p1/p2），但它是"第三层依赖"，在单次生成中难以保证
- testCases 的生成消耗大量 token（每个节点 3 个分组 × 多个用例），但对规格同步的核心价值有限
- 移除后，依赖链从 3 层简化为 2 层，方案 A（重组指令）成为明确最优解

**影响范围：**
- Step 2a：移除 testCases 生成规则
- Step 3 校验项 1（格式校验）：移除 testCases 检查
- Step 3 校验项 6（覆盖度审查）：移除 testCases 覆盖检查，简化为 acceptanceCriteria 覆盖 goals
- 节点 Schema 核心字段列表：移除 testCases
- `references/node-schema.md`：保留 testCases 定义作为参考，不影响主流程

### 3. Step 3 校验调整

**校验项 1（格式校验）** — 移除：
- testCases 含 unit-test/end-to-end/script-test 三个固定键
- 用例不含 type 字段

**校验项 6（覆盖度审查）** — 简化为：
- 验收标准覆盖所有 goals 的关键场景
- acceptanceCriteria 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件
- 叶子节点再次检查：是否包含 2+ 个独立子功能

## 不变更的部分

- Step 1（扫描与变更分析）
- Step 2b（生成设计文档）
- Step 4（用户审核）
- Step 5（转正）
- `references/node-schema.md` 中的 testCases 定义（保留作为参考）
- `references/design-doc-templates.md`
- `references/node-identification-examples.md`
