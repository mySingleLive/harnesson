# Slash Commands

## 前端设计
- useSlashCompletion hook 处理自动补全逻辑
- 输入 / 触发弹出菜单
- 上/下箭头导航, Enter/Tab 选择, Escape 关闭

## 后端设计
- GET /api/slash-commands: 返回命令列表
- POST /api/agents/:id/command: 执行命令
- 命令来源: 内置 (clear, compact, model, help), 插件技能, 项目技能
- 解析 SKILL.md frontmatter 获取描述
