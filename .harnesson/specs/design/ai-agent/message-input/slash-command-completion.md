# 斜杠命令补全 — 全栈设计

## 架构概览

用户输入 `/` 触发前端命令补全弹窗。前端从缓存命令列表实时过滤匹配项，通过键盘或鼠标选择命令。后端提供命令发现 API，扫描内置命令、插件技能和项目技能。

```
用户输入 / → useSlashCompletion → filterCommands (本地过滤) 
→ SlashCommandPopup 弹窗 → 选中命令 → 执行或插入

命令来源: GET /api/slash-commands → slash-commands.ts → 扫描 plugins/skills 目录
```

## 前端设计

**组件**：`SlashCommandPopup` — 浮动在输入框上方的命令列表弹窗，显示命令名称、描述和类型标签（builtin/skill/plugin）。

`useSlashCompletion` hook 管理弹窗状态：
- 检测 `/` 触发符，提取当前斜杠片段
- 从 `slashCommandStore` 获取缓存的命令列表
- 使用 `filterCommands` 进行大小写不敏感的 includes 匹配

**交互方式**：
- 键盘导航：ArrowUp/ArrowDown 移动焦点，Enter 选中，Escape 关闭
- 鼠标悬停高亮选项，点击选中
- 内置命令直接执行（如 `/model` 切换模型），技能命令插入文本到输入框
- 失焦或输入非斜杠上下文时自动关闭

**状态管理**：`slashCommandStore`（Zustand）缓存命令列表，TTL 5 分钟，按 working directory 缓存。

## 后端设计

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/slash-commands?cwd=<path>` | 获取可用命令列表 |

`slash-commands.ts` 模块扫描三类命令来源：
1. 内置命令：`/clear`、`/compact`、`/model`、`/help`
2. 插件技能：扫描 `~/.claude/plugins/cache/` 下含 `SKILL.md` 的目录
3. 项目技能：扫描项目 `.claude/skills/` 目录

技能命令的 `SKILL.md` 文件需包含 frontmatter（`---` 分隔的 YAML）解析。

## Specification Details

### Parameters

- 弹窗最大显示命令数：无硬性限制（由滚动处理）
- 命令缓存 TTL：5 分钟，按 working directory 缓存
- 命令列表包含 `type`（builtin/skill）、`name`、`description`、`plugin` 字段
- 键盘导航：ArrowUp/ArrowDown 移动，Enter 选中，Escape 关闭
- 过滤匹配算法：大小写不敏感的 includes 匹配

## Constraints

- 命令列表需要后端服务可用（fetch `/api/slash-commands`）
- 后端不可用时不显示错误，返回空命令列表
- 技能命令的 SKILL.md 解析依赖 frontmatter 格式（--- 分隔的 YAML）
- 命令弹窗在失焦时自动关闭
