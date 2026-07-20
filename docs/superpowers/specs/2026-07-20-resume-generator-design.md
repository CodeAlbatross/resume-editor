# 简历自动生成系统 — 设计文档

> 日期：2026-07-20
> 状态：已批准

---

## 1. 概述

构建一个网页版简历自动生成系统。用户通过浏览器输入个人信息、项目经历、照片等，实时预览并导出为 PDF 格式简历。支持局部调整、多模板切换、智能一页纸压缩等功能。

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端框架 | React + Vite + TypeScript | SPA 单页应用 |
| UI 样式 | TailwindCSS | 原子化 CSS |
| 后端 | Express.js (Node.js) | REST API 服务，端口 3001 |
| PDF 生成 | Puppeteer | 无头 Chrome 渲染 HTML → PDF |
| 模板引擎 | EJS / Handlebars | 服务端 HTML 模板渲染 |
| 存储 | JSON 文件 + 文件系统 | 轻量无数据库 |
| 状态管理 | Zustand 或 React Context | 轻量级状态方案 |

---

## 3. 整体架构

```
┌──────────────────────────────────────────────┐
│               浏览器 (React SPA)               │
│  ┌────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ 编辑页  │ │ 预览页   │ │ 模板选择/管理  │   │
│  └────┬───┘ └────┬─────┘ └───────┬───────┘   │
│       │          │               │           │
│  ┌────┴──────────┴───────────────┴───────┐   │
│  │         API Client (axios)            │   │
│  └────────────────┬──────────────────────┘   │
└───────────────────┼──────────────────────────┘
                    │ HTTP REST (:3001)
┌───────────────────┼──────────────────────────┐
│  ┌────────────────┴──────────────────────┐   │
│  │       Express.js 服务器                 │   │
│  │  ┌────────┐ ┌──────────┐ ┌─────────┐  │   │
│  │  │数据API │ │PDF生成API│ │照片上传 │  │   │
│  │  └───┬────┘ └────┬─────┘ └────┬────┘  │   │
│  │      │           │            │        │   │
│  │  ┌───┴───────────┴────────────┴────┐   │   │
│  │  │    Puppeteer (无头 Chrome)       │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  存储: /data/                                  │
│  ├── resumes/{id}.json    ← 简历数据          │
│  ├── photos/{id}.ext      ← 用户照片          │
│  └── templates/           ← HTML/CSS 模板     │
└────────────────────────────────────────────────┘
```

---

## 4. 数据模型

每个简历存为一个 JSON 文件：

```json
{
  "id": "a1b2c3d4-uuid",
  "name": "张三",
  "title": "高级前端工程师",
  "updatedAt": "2026-07-20T12:00:00Z",
  "template": "classic",
  "compressSettings": {
    "compact": false,
    "trim": false,
    "hide": false
  },
  "sectionOrder": ["personal", "summary", "experience", "projects", "education", "skills", "certificates", "languages"],
  "sections": {
    "personal": {
      "name": "张三",
      "email": "zhangsan@email.com",
      "phone": "138-0000-0000",
      "address": "北京市朝阳区",
      "title": "高级前端工程师",
      "website": "https://zhangsan.dev",
      "photo": "photo_a1b2c3d4.jpg"
    },
    "summary": {
      "content": "8 年前端开发经验，专注于 React 生态…"
    },
    "experience": [
      {
        "company": "字节跳动",
        "position": "高级前端工程师",
        "startDate": "2022-03",
        "endDate": "至今",
        "description": "负责核心业务前端架构",
        "highlights": [
          "主导前端架构升级",
          "性能优化 40%"
        ]
      }
    ],
    "projects": [
      {
        "name": "简历生成系统",
        "role": "全栈开发者",
        "technologies": ["React", "Node.js", "Puppeteer"],
        "description": "自动生成 PDF 简历的网页系统",
        "highlights": ["支持智能一页纸", "多种模板"],
        "link": "https://github.com/xxx"
      }
    ],
    "education": [
      {
        "school": "北京大学",
        "degree": "本科",
        "major": "计算机科学与技术",
        "startDate": "2014-09",
        "endDate": "2018-06",
        "gpa": "3.8/4.0"
      }
    ],
    "skills": [
      { "category": "前端", "items": ["React", "TypeScript", "Vue"] },
      { "category": "后端", "items": ["Node.js", "Express"] }
    ],
    "certificates": [
      { "name": "PMP", "issuer": "PMI", "date": "2023-06" }
    ],
    "languages": [
      { "name": "中文", "level": "母语" },
      { "name": "英语", "level": "CET-6" }
    ]
  }
}
```

---

## 5. API 设计

### 5.1 简历 CRUD

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/resumes` | 获取所有简历列表 |
| POST | `/api/resumes` | 新建简历 (创建空白模板) |
| GET | `/api/resumes/:id` | 获取单个简历详情 |
| PUT | `/api/resumes/:id` | 更新简历全部数据 |
| PATCH | `/api/resumes/:id` | 局部更新简历 |
| DELETE | `/api/resumes/:id` | 删除简历 |
| GET | `/api/resumes/:id/preview` | 获取简历 HTML 预览 |
| POST | `/api/resumes/:id/check-overflow` | 检测是否超过一页 |

### 5.2 照片管理

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/photo/upload` | 上传照片 (multipart) |
| DELETE | `/api/photo/:filename` | 删除照片 |
| GET | `/api/photo/:filename` | 获取照片 (静态文件) |

### 5.3 PDF 生成

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/pdf/generate` | 生成 PDF 并返回文件流 |
| POST | `/api/pdf/generate-with-compress` | 按压缩策略生成一页 PDF |

请求体示例：
```json
{
  "resumeId": "a1b2c3d4",
  "template": "classic",
  "compress": {
    "compact": true,
    "trim": false,
    "hide": false
  }
}
```

### 5.4 模板管理

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/templates` | 获取所有可用模板列表 |

---

## 6. 模板系统

每个模板包含三个文件：

```
/data/templates/classic/
├── template.html    ← HTML 骨架（含 EJS 占位符）
├── style.css        ← 样式（屏幕 + 打印）
└── template.json    ← 模板元数据
```

**模板元数据示例：**
```json
{
  "id": "classic",
  "label": "经典模板",
  "description": "左右分栏布局，信息密集",
  "photoPosition": "top-left",
  "photoSize": { "width": 100, "height": 100 },
  "pageMargin": "15mm",
  "primaryColor": "#2563eb"
}
```

**初始三套模板：**

| 模板 | 风格 | 照片位置 | 定位 |
|---|---|---|---|
| Classic | 经典左右分栏 | 左上角 | 信息密集，适合技术岗 |
| Modern | 现代简约 | 右侧边栏 | 清爽留白，适合管理/产品岗 |
| Compact | 紧凑型 | 顶部居中 | 天生省空间，适合一页纸强需求 |

---

## 7. PDF 生成流程

```
用户点击"导出 PDF"
       │
       ▼
POST /api/pdf/generate { resumeId, template, compress? }
       │
       ▼
1. 读取 resume.json 和模板文件
2. EJS 渲染完整 HTML（照片转为 base64 嵌入）
3. Puppeteer 打开 HTML 页面
   ├─ 设置 A4 页面 (210mm × 297mm)
   └─ 应用 @page CSS
4. 若 compress 有值 → 执行智能压缩
   └─ page.evaluate() 检测溢出 → 应用策略 → 重试
5. page.pdf() 生成 PDF Buffer
6. 返回 PDF 给前端下载
```

---

## 8. 智能一页纸

### 8.1 检测
Puppeteer 注入脚本检测：
```js
page.evaluate(() => {
  const h = document.documentElement.scrollHeight
  const A4_HEIGHT_MM = 297
  const pxPerMm = 96 / 25.4  // CSS 像素 / 毫米
  return h / pxPerMm > A4_HEIGHT_MM
})
```

### 8.2 三种压缩策略（用户可多选）

| 策略 | 实现方式 | 效果 |
|---|---|---|
| **紧凑 (compact)** | 缩小边距、行距、字号 | 内容不变，排版变密 |
| **精简 (trim)** | 每个经历/项目保留前 3 条 highlights | 内容减少但关键信息保留 |
| **隐藏 (hide)** | 按优先级隐藏次要模块 | 部分模块不可见 |

### 8.3 模块优先级（用户可调整顺序）

1. 个人信息（不可隐藏）
2. 工作经历
3. 项目经历
4. 教育背景
5. 技能
6. 个人摘要
7. 证书
8. 语言

### 8.4 用户交互

```
用户点击"智能一页纸"
       │
       ▼
弹窗: 内容超出 N 行，请选择策略
  ☑ 紧凑模式     ← 默认勾选
  ☐ 精简模式
  ☐ 隐藏次要模块
  [应用] [取消]
       │
       ▼
应用策略 → 实时预览
  └─ 仍然溢出 → 自动补充更强策略
  └─ 缩过头了 → 用户可微调
```

---

## 9. 前端页面结构

```
App
├── 首页 /dashboard
│   ├── 简历列表（卡片式）
│   │   ├── 简历卡片（名称、更新时间、模板缩略图）
│   │   └── 操作：编辑 / 删除 / 导出
│   └── 新建简历按钮
│
├── 简历编辑页 /editor/:id
│   ├── 左侧面板：可拖拽模块列表
│   │   ├── 个人信息编辑（含照片上传 + 裁剪）
│   │   ├── 个人摘要编辑
│   │   ├── 工作经历编辑（增删条目）
│   │   ├── 项目经历编辑（增删条目）
│   │   ├── 教育背景编辑
│   │   ├── 技能编辑
│   │   ├── 证书编辑
│   │   └── 语言编辑
│   │
│   ├── 右侧面板：实时 A4 预览
│   │   ├── 模板切换
│   │   ├── 智能一页纸按钮
│   │   └── 导出 PDF 按钮
│   │
│   └── 顶部工具栏：保存 / 撤销 / 重做 / 导出
│
└── 设置页 /settings
    └── 数据导入/导出 / 默认模板
```

---

## 10. 错误处理策略

| 场景 | 处理方式 |
|---|---|
| Puppeteer 启动失败 | 返回 503，提示用户检查 Chrome 安装 |
| 照片上传超限 | 前端限制 5MB，后端校验，返回 413 |
| 简历数据损坏 | 加载时 JSON.parse 异常 → 提示修复或删除 |
| PDF 生成超时 | 设置 15s 超时，返回 504 |
| 模板文件缺失 | 降级到默认模板 |
| 内容溢出 | 提示用户启用智能一页纸 |

---

## 11. 项目目录结构

```
resume-system/
├── client/                    ← React 前端
│   ├── src/
│   │   ├── components/        ← 通用 UI 组件
│   │   ├── pages/             ← 页面组件
│   │   ├── hooks/             ← 自定义 hooks
│   │   ├── api/               ← API 调用封装
│   │   ├── stores/            ← 状态管理
│   │   ├── types/             ← TypeScript 类型定义
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                    ← Express 后端
│   ├── src/
│   │   ├── routes/            ← API 路由
│   │   ├── services/          ← 业务逻辑
│   │   │   ├── pdfService.js  ← PDF 生成
│   │   │   └── templateService.js
│   │   ├── middleware/        ← 中间件
│   │   └── index.js
│   └── package.json
│
├── data/                      ← 运行时数据
│   ├── resumes/
│   ├── photos/
│   └── templates/
│
├── docs/                      ← 文档
│   └── superpowers/specs/
│
└── package.json               ← 根级 workspace 脚本
```
