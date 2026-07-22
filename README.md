# 简历编辑器 (Resume Editor)

网页版简历编辑器，支持多模板实时预览、PDF 精确导出、版本历史管理和智能一页纸压缩。

## 功能特性

- 📝 **简历编辑** — 个人信息、工作经历、项目经历、教育背景、技能专长、证书、语言
- 👁️ **实时预览** — 编辑即所见，模拟 A4 纸张尺寸
- 🎨 **多模板** — Classic（经典）/ Modern（现代）/ Compact（紧凑）三种布局，一键切换
- 📄 **PDF 导出** — Puppeteer 服务端渲染，与预览保持精确一致
- 💾 **版本历史** — 每次保存自动创建快照，支持创建命名版本和恢复任意历史版本
- 📏 **智能一页纸** — 检测内容是否超出一页，自动应用压缩策略：
  - **紧凑**：缩小边距、行距、字号
  - **精简**：缩短描述文本（保留前 3 条亮点）
  - **隐藏**：按优先级隐藏证书和语言模块
- 🎨 **主题色** — 自定义主题颜色，预览和导出实时生效
- 📸 **照片上传** — 支持 JPG/PNG，自动裁剪预览

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS + Zustand |
| 后端 | Express.js + Puppeteer + EJS 模板 |
| 存储 | JSON 文件系统 (`server/data/`) |
| PDF 渲染 | EJS 模板 + Puppeteer（无头 Chrome） |

## 快速开始

```bash
# 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 启动开发模式（前后端同时）
npm run dev

# 或分别启动：
npm run dev:server   # 后端 → http://localhost:3001
npm run dev:client   # 前端 → http://localhost:5173
```

浏览器打开 `http://localhost:5173` 即可使用。

## 项目结构

```
├── client/                  # React 前端
│   └── src/
│       ├── api/             # API 调用封装
│       ├── components/
│       │   ├── editor/      # 编辑器组件
│       │   ├── preview/     # 模板预览（3套）
│       │   └── ui/          # 通用 UI 组件（压缩弹窗等）
│       ├── hooks/           # 自定义 hooks（溢出检测、自动保存）
│       ├── pages/           # 页面组件（Dashboard, Editor）
│       ├── stores/          # Zustand 状态管理
│       └── types/           # TypeScript 类型定义
├── server/
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑（存储、版本管理、PDF）
│   │   └── index.js         # 入口
│   ├── data/
│   │   ├── resumes/         # 简历 JSON 数据
│   │   ├── templates/       # PDF 导出模板（EJS + CSS）
│   │   └── versions/        # 版本历史快照
│   └── uploads/             # 头像上传
└── docs/
    └── superpowers/         # 设计文档和计划
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/resumes` | 简历列表 |
| POST | `/api/resumes` | 新建简历 |
| GET | `/api/resumes/:id` | 简历详情 |
| PUT | `/api/resumes/:id` | 全量保存 |
| PATCH | `/api/resumes/:id` | 局部更新 |
| DELETE | `/api/resumes/:id` | 删除简历 |
| POST | `/api/resumes/:id/pdf` | 导出 PDF |
| POST | `/api/resumes/:id/check-overflow` | 检测内容溢出 |
| GET | `/api/resumes/:id/versions` | 版本历史列表 |
| POST | `/api/resumes/:id/versions` | 创建命名版本 |
| POST | `/api/resumes/:id/versions/:vid/restore` | 恢复版本 |
| DELETE | `/api/resumes/:id/versions/:vid` | 删除版本 |
| POST | `/api/photo/upload` | 上传照片 |
| GET | `/api/templates` | 模板列表 |
