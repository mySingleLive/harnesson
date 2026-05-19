# 测试用例: sync-specs (业务导向规格树重组)

## 测试摘要

修改 sync-specs skill 的 Stage 4a 组织规则，从技术/代码结构导向改为业务/Feature 导向的规格树节点归类，然后通过全量同步验证生成的规格树满足两个核心要求：(1) 节点按业务域归类，不按技术类型归类；(2) 纯技术节点不包含有业务含义的子节点。

## 测试的 Skill

- **名称**: sync-specs
- **位置**: `c:\Projects\harnesson\.claude\skills\sync-specs`
- **描述**: 扫描项目代码，通过4阶段管线（代码扫描→架构文档→概念提取→规格树）同步生成标准化的 JSON 规格树。支持增量同步（默认）和全量同步（--full）。

## 测试目标

1. 规格树节点按业务/Feature 角度归类，而非技术/代码结构角度归类（如不把所有 pages 放在同一个 pages 节点下）
2. 纯技术节点（底层组件/工具类/框架模块等）可以单独归类，但不得包含有业务含义的子节点

## 测试数据

- **目标项目**: `c:\Projects\harnesson`（当前项目）
- **执行命令**: `/sync-specs --full`
- **当前已知问题节点**（修改前快照）:
  - `app-shell.pages` — 按技术类型"页面"归类，子节点含 new-session-page, projects-page, graph-page, tasks-page, files-page, git-page
  - `app-shell.layout-components` — 混合了纯技术组件（main-layout, resizable-divider）和有业务含义的组件（agent-status-dot）
  - `app-shell.agent-panel` — 实际是 AI Agent 对话面板，有业务含义但放在 app-shell 下
- **预期重组方向**:
  - projects-page → 归入 project-management 域
  - graph-page → 归入 graph-specs 域
  - new-session-page → 归入 ai-agent 域
  - git-page → 归入 project-management 域（Git 分支操作）
  - agent-panel → 归入 ai-agent 域
  - 纯技术组件（main-layout, confirm-dialog, resizable-divider）可保留在技术类节点下

## 测试用例

### TC-001: 修改后全量同步无报错完成 — ⏳

- **目标**: 前置验证
- **优先级**: P0
- **Given**: SKILL.md Stage 4a 已增加业务导向的组织规则约束
- **When**: 执行 `/sync-specs --full` 触发全量同步
- **Then**:
  1. 4 个阶段全部完成，无报错中断
  2. 生成了 `.harnesson/specs/` 目录及其中所有预期产物
  3. 校验通过

### TC-002: 不存在按技术类型归类的 pages 节点 — ⏳

- **目标**: 1
- **优先级**: P0
- **Given**: TC-001 已通过，规格树已重新生成
- **When**: 遍历规格树所有节点，检查是否存在以技术类型命名的中间节点（如 pages、routes、components、hooks）且该节点下包含来自不同业务域的子节点
- **Then**:
  1. 不存在 `pages` 节点将 projects-page、graph-page、git-page 等不同业务域的页面聚合在一起
  2. 不存在类似 `routes` 节点将不同业务域的 API 路由聚合在一起
  3. 如果存在同名节点（如 pages），其子节点必须属于同一业务域

### TC-003: 有业务含义的页面归入对应业务域 — ⏳

- **目标**: 1
- **优先级**: P0
- **Given**: TC-001 已通过
- **When**: 检查以下业务页面的父节点归属
- **Then**:
  1. projects-page（或等效节点）的父节点属于 project-management 域（直接或间接）
  2. graph-page（或等效节点）的父节点属于 graph-specs 域（直接或间接）
  3. new-session-page（或等效节点）的父节点属于 ai-agent 域（直接或间接）
  4. git-page（或等效节点）的父节点属于 project-management 域（直接或间接）

### TC-004: 纯技术节点不包含有业务含义的子节点 — ⏳

- **目标**: 2
- **优先级**: P0
- **Given**: TC-001 已通过
- **When**: 识别所有被归类为"纯技术"的节点（如 app-shell、layout、infrastructure、architecture 等），检查其子节点
- **Then**:
  1. 纯技术节点的子节点不包含有明确业务含义的节点（如 git-page、tasks-page、agent-status-dot）
  2. 纯技术节点只包含纯 UI 框架组件（如 main-layout、confirm-dialog、resizable-divider、404-page、error-page）
  3. agent-status-dot（AI Agent 状态指示器）不在纯技术节点下，而应在 ai-agent 域下

### TC-005: Agent 面板归入 AI Agent 业务域 — ⏳

- **目标**: 1
- **优先级**: P1
- **Given**: TC-001 已通过
- **When**: 检查 agent-panel（或等效的 Agent 聊天面板节点）的父节点链
- **Then**:
  1. agent-panel 的父节点链经过或属于 ai-agent 域
  2. agent-panel 不在 app-shell 等纯技术节点下

### TC-006: 统一校验通过 — ⏳

- **目标**: 前置验证
- **优先级**: P1
- **Given**: TC-001 已通过
- **When**: 运行 `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --root .harnesson/specs`
- **Then**:
  1. 校验返回全部通过
  2. 无错误或警告

### TC-007: 已有业务域不发生退化 — ⏳

- **目标**: 1
- **优先级**: P1
- **Given**: TC-001 已通过
- **When**: 检查已有的三个业务域（ai-agent、project-management、graph-specs）下的节点结构
- **Then**:
  1. ai-agent 域仍包含 agent-session、message-exchange、tool-cards 等核心功能节点（可能重组但未丢失）
  2. project-management 域仍包含 project-crud、project-ui 等核心功能节点
  3. graph-specs 域仍包含 specs-visualization、sync-workflow 等核心功能节点
  4. 各域的叶子节点数量不减少

### TC-008: 规格树节点总数合理 — ⏳

- **目标**: 1
- **优先级**: P2
- **Given**: TC-001 已通过
- **When**: 统计规格树所有节点总数
- **Then**:
  1. 节点总数 >= 之前的 90 个（重组不应减少节点数量）
  2. 根节点 children 仍为多个业务域

---

## 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|

---

## 测试总结

（待执行后填写）
