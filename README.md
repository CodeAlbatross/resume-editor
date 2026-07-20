# 简历自动生成系统

网页版简历编辑器，支持实时预览、多模板切换、智能一页纸压缩、PDF 导出。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS + Zustand |
| 后端 | Express.js + Puppeteer |
| 存储 | JSON 文件系统 |
| PDF 渲染 | EJS 模板 + Puppeteer (无头 Chrome) |

## 快速启动

```bash
# 安装依赖
cd server && npm install && cd ../client && npm install && cd ..
npm install

# 启动（前后端同时）
npm run dev

# 或分别启动：
npm run dev:server   # 后端 → http://localhost:3001
npm run dev:client   # 前端 → http://localhost:5173
```

## 功能

- 📝 **简历编辑** — 个人信息、工作经历、项目经历、教育背景、技能、证书、语言
- 📸 **照片上传** — 支持 JPG/PNG，自动裁剪预览，5MB 限制
- 👁️ **实时预览** — 编辑即预览，模拟 A4 纸张尺寸
- 🎨 **多模板** — 经典/现代/紧凑三种布局，一键切换
- 📄 **智能一页纸** — 三种压缩策略：
  - **紧凑**：缩小边距、行距、字号
  - **精简**：缩短描述文本，保留关键亮点
  - **隐藏**：按优先级隐藏次要模块
- 💾 **自动保存** — 每 30 秒自动保存编辑内容
- ⬇️ **PDF 导出** — Puppeteer 精确渲染，所见即所得

## 项目结构

```
resume-system/
├── client/              ← React 前端
│   ├── src/
│   │   ├── pages/       ← 页面 (Dashboard, Editor)
│   │   ├── components/  ← 组件 (编辑器, 预览, 模板)
│   │   ├── hooks/       ← 自定义 Hooks (autoSave, overflowCheck)
│   │   ├── stores/      ← Zustand 状态管理
│   │   ├── api/         ← API 客户端
│   │   └── types/       ← TypeScript 类型定义
│   └── ...
├── server/              ← Express 后端
│   ├── src/
│   │   ├── routes/      ← API 路由
│   │   ├── services/    ← 业务逻辑 (存储, 模板, PDF)
│   │   └── middleware/  ← 中间件 (文件上传)
│   └── data/            ← 运行时数据
│       ├── resumes/     ← 简历 JSON
│       ├── photos/      ← 照片
│       └── templates/   ← PDF 模板 (EJS+CSS)
└── docs/                ← 文档
```

## API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/resumes` | 简历列表 |
| POST | `/api/resumes` | 新建简历 |
| GET | `/api/resumes/:id` | 简历详情 |
| PUT | `/api/resumes/:id` | 全量更新 |
| PATCH | `/api/resumes/:id` | 局部更新 |
| DELETE | `/api/resumes/:id` | 删除简历 |
| POST | `/api/photo/upload` | 上传照片 |
| DELETE | `/api/photo/:filename` | 删除照片 |
| GET | `/api/templates` | 模板列表 |
| POST | `/api/pdf/generate` | 生成 PDF |
| POST | `/api/pdf/check-overflow` | 检测内容溢出 |
