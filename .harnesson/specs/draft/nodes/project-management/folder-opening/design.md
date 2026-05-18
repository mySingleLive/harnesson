# Folder Opening

## 前端设计
- Topbar 和 ProjectsPage 中的打开文件夹按钮
- 调用 POST /api/open-folder 触发系统原生对话框

## 后端设计
- POST /api/open-folder
- native-dialog 模块调用平台特定对话框
- 支持 Windows, macOS, Linux
