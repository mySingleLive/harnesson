# 架构文档格式规范

本文件定义 Stage 2（架构文档生成）的输出格式。仅在执行 Stage 2 时加载。

## 输出文件

| 文件 | 用途 |
|------|------|
| `.harnesson/architecture/Architecture.md` | 项目架构总览 |
| `.harnesson/architecture/summaries/{module-name}.md` | 每个目录级模块的摘要 |

## Architecture.md 格式

````markdown
# Architecture: {项目名}

> Last synced: {ISO 8601} | Commit: {短 hash}

## Module Map

| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|
| AI Agent | src/ai-agent/ | AgentController.ts, SessionManager.ts | AI 对话核心模块 |
| ... | ... | ... | ... |

## Dependency Graph

{Mermaid 图或文字描述模块间依赖关系}
````

## 模块摘要格式

每个 `summaries/{module-name}.md` 遵循以下结构：

````markdown
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
````

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
