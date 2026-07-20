# 简历自动生成系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建网页版简历编辑器，支持输入个人信息、项目经历、照片等，实时预览并导出 PDF。

**Architecture:** React SPA + Express REST API + Puppeteer PDF 渲染。前端负责编辑和预览，后端负责数据持久化、模板渲染和 PDF 生成。数据以 JSON 文件存储。

**Tech Stack:** React 18 + TypeScript + Vite + TailwindCSS / Express.js / Puppeteer / Zustand

## Global Constraints

- Node.js >= 18.x
- Puppeteer 自动下载 Chromium
- 照片上传限制 5MB，支持 jpg/png
- 端口：前端 5173 (Vite 默认)，后端 3001
- TailwindCSS 用于前端样式，无额外 UI 库
- 数据存储路径：`server/data/`

---

### Task 1: 项目脚手架 & 配置

**Files:**
- Create: `package.json` (根 workspace)
- Create: `.gitignore`
- Create: `server/package.json`
- Create: `server/src/index.js`
- Create: `client/package.json`
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`
- Create: `client/index.html`
- Create: `client/postcss.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/index.css`

**Interfaces:**
- Consumes: 无
- Produces: monorepo 基础结构，前后端可独立启动

- [ ] **Step 1: 创建根 package.json 和 .gitignore**

```json
{
  "name": "resume-system",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "install:all": "cd server && npm install && cd ../client && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

```gitignore
node_modules/
dist/
server/data/photos/*
server/data/resumes/*
!server/data/photos/.gitkeep
!server/data/resumes/.gitkeep
.DS_Store
*.log
```

- [ ] **Step 2: 创建 server/package.json**

```json
{
  "name": "resume-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0",
    "ejs": "^3.1.9",
    "puppeteer": "^22.0.0"
  }
}
```

- [ ] **Step 3: 创建 Express 入口 server/src/index.js**

```javascript
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态文件 - 照片
app.use('/photo', express.static(path.join(__dirname, '../data/photos')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 4: 创建 client/package.json**

```json
{
  "name": "resume-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 5: 创建 Vite + TypeScript + Tailwind 配置**

`client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/photo': 'http://localhost:3001',
    }
  }
})
```

`client/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

`client/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`client/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>简历生成系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建入口文件和 CSS**

`client/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

`client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@page { margin: 15mm; size: A4; }

body {
  @apply bg-gray-50 text-gray-900;
}
```

`client/src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/editor/:id" element={<Editor />} />
    </Routes>
  )
}
```

- [ ] **Step 7: 创建 data 目录结构并验证**

```bash
mkdir -p server/data/resumes server/data/photos server/data/templates
touch server/data/resumes/.gitkeep server/data/photos/.gitkeep
cd server && npm install
cd ../client && npm install
cd ..
npm install
echo "Scaffold complete!"
```

---

### Task 2: 后端 — 存储服务 + 简历 CRUD API

**Files:**
- Create: `server/src/services/storage.js`
- Create: `server/src/routes/resumes.js`
- Modify: `server/src/index.js` (注册路由)

**Interfaces:**
- Produces: `storage.readResume(id)`, `storage.writeResume(id, data)`, `storage.listResumes()`, `storage.deleteResume(id)`
- Produces: `GET/POST/PUT/DELETE /api/resumes` 路由

- [ ] **Step 1: 创建 storage.js — JSON 文件读写**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data/resumes');

export async function listResumes() {
  const files = await fs.readdir(DATA_DIR);
  const resumes = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf-8'));
      resumes.push({
        id: data.id,
        name: data.name || '未命名',
        title: data.title || '',
        template: data.template || 'classic',
        updatedAt: data.updatedAt,
      });
    }
  }
  return resumes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function readResume(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function writeResume(id, data) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

export async function createResume() {
  const id = uuidv4();
  const now = new Date().toISOString();
  const blank = {
    id,
    name: '',
    title: '',
    updatedAt: now,
    template: 'classic',
    compressSettings: { compact: false, trim: false, hide: false },
    sectionOrder: ['personal', 'summary', 'experience', 'projects', 'education', 'skills', 'certificates', 'languages'],
    sections: {
      personal: { name: '', email: '', phone: '', title: '', photo: '' },
      summary: { content: '' },
      experience: [],
      projects: [],
      education: [],
      skills: [],
      certificates: [],
      languages: [],
    },
  };
  await writeResume(id, blank);
  return blank;
}

export async function deleteResume(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: 创建 resumes.js 路由**

```javascript
import { Router } from 'express';
import * as storage from '../services/storage.js';

const router = Router();

// 列表
router.get('/', async (req, res) => {
  try {
    const list = await storage.listResumes();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 新建
router.post('/', async (req, res) => {
  try {
    const resume = await storage.createResume();
    res.status(201).json(resume);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 详情
router.get('/:id', async (req, res) => {
  const resume = await storage.readResume(req.params.id);
  if (!resume) return res.status(404).json({ error: 'not found' });
  res.json(resume);
});

// 更新（全量覆盖）
router.put('/:id', async (req, res) => {
  const existing = await storage.readResume(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const updated = await storage.writeResume(req.params.id, { ...existing, ...req.body, id: req.params.id });
  res.json(updated);
});

// 局部更新
router.patch('/:id', async (req, res) => {
  const existing = await storage.readResume(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const merged = JSON.parse(JSON.stringify(existing));
  for (const key of Object.keys(req.body)) {
    if (key === 'sections') {
      for (const sectionKey of Object.keys(req.body.sections)) {
        merged.sections[sectionKey] = req.body.sections[sectionKey];
      }
    } else {
      merged[key] = req.body[key];
    }
  }
  const saved = await storage.writeResume(req.params.id, merged);
  res.json(saved);
});

// 删除
router.delete('/:id', async (req, res) => {
  const ok = await storage.deleteResume(req.params.id);
  res.json({ deleted: ok });
});

export default router;
```

- [ ] **Step 3: 注册路由到 server/src/index.js**

```javascript
import resumesRouter from './routes/resumes.js';
// 在 app.use(express.json(...)) 之后添加：
app.use('/api/resumes', resumesRouter);
```

- [ ] **Step 4: 验证 CRUD API**

```bash
curl -s http://localhost:3001/api/health
# 预期: {"status":"ok","time":"..."}

# 新建简历
RESUME=$(curl -s -X POST http://localhost:3001/api/resumes)
echo $RESUME | head
ID=$(echo $RESUME | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")
echo "ID=$ID"

# 获取列表
curl -s http://localhost:3001/api/resumes | head

# 获取详情
curl -s http://localhost:3001/api/resumes/$ID | head

# 更新
curl -s -X PUT http://localhost:3001/api/resumes/$ID \
  -H 'Content-Type: application/json' \
  -d '{"name":"测试简历","sections":{"personal":{"name":"张三","email":"test@test.com"}}}'

# 删除
# curl -s -X DELETE http://localhost:3001/api/resumes/$ID
```

---

### Task 3: 后端 — 照片上传 API

**Files:**
- Create: `server/src/middleware/upload.js`
- Create: `server/src/routes/photos.js`
- Modify: `server/src/index.js` (注册路由)

**Interfaces:**
- Produces: `POST /api/photo/upload` → `{ filename }`
- Produces: `DELETE /api/photo/:filename` → `{ deleted }`
- Produces: `GET /api/photo/:filename` (静态文件，已配置)

- [ ] **Step 1: 创建 upload.js — Multer 中间件**

```javascript
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(__dirname, '../../data/photos');

const storage = multer.diskStorage({
  destination: PHOTO_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 jpg/png 格式'));
  }
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
```

- [ ] **Step 2: 创建 photos.js 路由**

```javascript
import { Router } from 'express';
import upload from '../middleware/upload.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(__dirname, '../../data/photos');

const router = Router();

router.post('/upload', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: '文件大小不能超过 5MB' });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    res.json({ filename: req.file.filename });
  });
});

router.delete('/:filename', async (req, res) => {
  try {
    await fs.unlink(path.join(PHOTO_DIR, req.params.filename));
    res.json({ deleted: true });
  } catch {
    res.status(404).json({ error: '文件未找到' });
  }
});

export default router;
```

- [ ] **Step 3: 注册照片路由**

```javascript
import photosRouter from './routes/photos.js';
// 在 app.use('/api/resumes', ...) 之后：
app.use('/api/photo', photosRouter);
```

- [ ] **Step 4: 验证照片上传**

```bash
# 创建一个测试图片（1x1 像素 PNG）
echo -ne '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/test.png

curl -s -X POST http://localhost:3001/api/photo/upload \
  -F "photo=@/tmp/test.png"
# 预期: {"filename":"xxxx-xxxx.png"}
```

---

### Task 4: 后端 — 模板服务 + PDF 生成

**Files:**
- Create: `server/data/templates/classic/template.ejs`
- Create: `server/data/templates/classic/style.css`
- Create: `server/data/templates/classic/template.json`
- Create: `server/data/templates/modern/template.ejs`
- Create: `server/data/templates/modern/style.css`
- Create: `server/data/templates/modern/template.json`
- Create: `server/data/templates/compact/template.ejs`
- Create: `server/data/templates/compact/style.css`
- Create: `server/data/templates/compact/template.json`
- Create: `server/src/services/templateService.js`
- Create: `server/src/services/pdfService.js`
- Create: `server/src/routes/templates.js`
- Create: `server/src/routes/pdf.js`
- Modify: `server/src/index.js` (注册路由)

**Interfaces:**
- Consumes: `storage.readResume(id)`
- Produces: `templateService.listTemplates()`, `templateService.render(resumeId, templateId, compress?)`
- Produces: `pdfService.generatePDF(html)` → Buffer
- Produces: `GET /api/templates`, `POST /api/pdf/generate`, `POST /api/pdf/generate-with-compress`

- [ ] **Step 1: 创建经典模板文件**

`server/data/templates/classic/template.json`:
```json
{
  "id": "classic",
  "label": "经典模板",
  "description": "左右分栏布局，信息密集，适合技术岗",
  "photoPosition": "top-left",
  "photoSize": { "width": 100, "height": 100 },
  "pageMargin": "15mm",
  "primaryColor": "#2563eb"
}
```

`server/data/templates/classic/style.css`:
```css
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; font-size: 11pt; color: #333; line-height: 1.5; }

/* 紧凑模式 */
body.compact { font-size: 10pt; line-height: 1.3; }
body.compact .section { margin-bottom: 8px; }
body.compact .header { padding: 15px 0; }

/* 隐藏模式 */
body.hide .section-certificates { display: none; }
body.hide .section-languages { display: none; }

.header { display: flex; align-items: center; gap: 20px; padding: 20px 0; border-bottom: 3px solid #2563eb; margin-bottom: 16px; }
.header .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #2563eb; }
.header .info { flex: 1; }
.header .name { font-size: 24pt; font-weight: 700; color: #1e293b; }
.header .title { font-size: 12pt; color: #2563eb; margin-top: 4px; }
.header .contact { font-size: 9pt; color: #64748b; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 12px; }

.section { margin-bottom: 14px; }
.section-title { font-size: 13pt; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
.section-title .primary { color: #2563eb; }

.item { margin-bottom: 10px; }
.item-header { display: flex; justify-content: space-between; align-items: baseline; }
.item-name { font-weight: 600; font-size: 11pt; }
.item-sub { color: #2563eb; }
.item-date { font-size: 9pt; color: #94a3b8; white-space: nowrap; }
.item-desc { font-size: 10pt; color: #475569; margin-top: 2px; }
.item-highlights { margin-top: 4px; padding-left: 18px; font-size: 10pt; color: #475569; }
.item-highlights li { margin-bottom: 1px; }

.skills { display: flex; flex-wrap: wrap; gap: 6px; }
.skills .tag { background: #eff6ff; color: #2563eb; padding: 2px 10px; border-radius: 12px; font-size: 9pt; }
.skills .category { width: 100%; font-weight: 600; font-size: 10pt; color: #334155; margin-top: 4px; }
```

`server/data/templates/classic/template.ejs`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style><%- style %></style>
</head>
<body class="<%= compressClass %>">
  <div class="header">
    <% if (photoBase64) { %>
      <img class="photo" src="<%= photoBase64 %>" alt="photo" />
    <% } %>
    <div class="info">
      <div class="name"><%= data.sections.personal.name || '姓名' %></div>
      <% if (data.sections.personal.title) { %>
        <div class="title"><%= data.sections.personal.title %></div>
      <% } %>
      <div class="contact">
        <% if (data.sections.personal.email) { %><span>✉ <%= data.sections.personal.email %></span><% } %>
        <% if (data.sections.personal.phone) { %><span>📞 <%= data.sections.personal.phone %></span><% } %>
        <% if (data.sections.personal.website) { %><span>🌐 <%= data.sections.personal.website %></span><% } %>
      </div>
    </div>
  </div>

  <% if (data.sections.summary && data.sections.summary.content) { %>
  <div class="section">
    <div class="section-title"><span class="primary">个人</span>摘要</div>
    <p style="font-size:10pt;color:#475569"><%= data.sections.summary.content %></p>
  </div>
  <% } %>

  <div class="section">
    <div class="section-title"><span class="primary">工作</span>经历</div>
    <% data.sections.experience.forEach(function(exp) { %>
    <div class="item">
      <div class="item-header">
        <div><span class="item-name"><%= exp.company %></span> · <span class="item-sub"><%= exp.position %></span></div>
        <div class="item-date"><%= exp.startDate %> ~ <%= exp.endDate %></div>
      </div>
      <% if (exp.description) { %><div class="item-desc"><%= exp.description %></div><% } %>
      <% if (exp.highlights && exp.highlights.length) { %>
      <ul class="item-highlights">
        <% exp.highlights.forEach(function(h) { %><li><%= h %></li><% }) %>
      </ul>
      <% } %>
    </div>
    <% }) %>
  </div>

  <div class="section">
    <div class="section-title"><span class="primary">项目</span>经历</div>
    <% data.sections.projects.forEach(function(proj) { %>
    <div class="item">
      <div class="item-header">
        <div><span class="item-name"><%= proj.name %></span> · <span class="item-sub"><%= proj.role %></span></div>
        <div class="item-date"><%= proj.technologies ? proj.technologies.join(', ') : '' %></div>
      </div>
      <% if (proj.description) { %><div class="item-desc"><%= proj.description %></div><% } %>
      <% if (proj.highlights && proj.highlights.length) { %>
      <ul class="item-highlights">
        <% proj.highlights.forEach(function(h) { %><li><%= h %></li><% }) %>
      </ul>
      <% } %>
    </div>
    <% }) %>
  </div>

  <div class="section">
    <div class="section-title"><span class="primary">教育</span>背景</div>
    <% data.sections.education.forEach(function(edu) { %>
    <div class="item">
      <div class="item-header">
        <div><span class="item-name"><%= edu.school %></span> · <span class="item-sub"><%= edu.major %></span> · <%= edu.degree %></div>
        <div class="item-date"><%= edu.startDate %> ~ <%= edu.endDate %></div>
      </div>
      <% if (edu.gpa) { %><div class="item-desc">GPA: <%= edu.gpa %></div><% } %>
    </div>
    <% }) %>
  </div>

  <div class="section section-skills">
    <div class="section-title"><span class="primary">技能</span>专长</div>
    <div class="skills">
      <% data.sections.skills.forEach(function(skill) { %>
        <span class="category"><%= skill.category %></span>
        <% skill.items.forEach(function(item) { %>
          <span class="tag"><%= item %></span>
        <% }) %>
      <% }) %>
    </div>
  </div>

  <div class="section section-certificates">
    <div class="section-title"><span class="primary">证书</span></div>
    <% data.sections.certificates.forEach(function(cert) { %>
    <div class="item">
      <div class="item-header">
        <div><span class="item-name"><%= cert.name %></span> · <span class="item-sub"><%= cert.issuer %></span></div>
        <div class="item-date"><%= cert.date %></div>
      </div>
    </div>
    <% }) %>
  </div>

  <div class="section section-languages">
    <div class="section-title"><span class="primary">语言</span></div>
    <div class="skills">
      <% data.sections.languages.forEach(function(lang) { %>
        <span class="tag"><%= lang.name %> · <%= lang.level %></span>
      <% }) %>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: 创建 Modern 和 Compact 模板（精简版）**

Modern 模板文件 (`server/data/templates/modern/template.json`):
```json
{
  "id": "modern",
  "label": "现代模板",
  "description": "简约设计，右侧边栏，适合设计/产品岗",
  "photoPosition": "right-top",
  "photoSize": { "width": 90, "height": 90 },
  "pageMargin": "12mm",
  "primaryColor": "#0891b2"
}
```

Modern 模板 CSS (`server/data/templates/modern/style.css`) — 简约风格，主色调青色：
```css
@page { size: A4; margin: 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; font-size: 10.5pt; color: #334155; line-height: 1.5; }

body.compact { font-size: 9.5pt; line-height: 1.3; }
body.compact .section { margin-bottom: 8px; }
body.hide .section-certificates { display: none; }
body.hide .section-languages { display: none; }

.layout { display: flex; gap: 24px; }
.sidebar { width: 180px; background: #ecfeff; padding: 16px; border-radius: 4px; }
.main { flex: 1; }

.header-photo { text-align: center; margin-bottom: 16px; }
.header-photo img { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #0891b2; }
.sidebar-section { margin-bottom: 14px; }
.sidebar-section h3 { font-size: 9pt; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.sidebar-section p { font-size: 9pt; color: #475569; }

.main .name { font-size: 22pt; font-weight: 700; color: #0f172a; }
.main .title { font-size: 11pt; color: #0891b2; margin: 4px 0 8px; }
.section { margin-bottom: 14px; }
.section-title { font-size: 12pt; font-weight: 700; color: #0f172a; border-bottom: 2px solid #0891b2; padding-bottom: 3px; margin-bottom: 6px; }
.item { margin-bottom: 8px; }
.item-header { display: flex; justify-content: space-between; }
.item-name { font-weight: 600; }
.item-date { font-size: 9pt; color: #94a3b8; }
.item-desc { font-size: 9.5pt; color: #475569; margin-top: 2px; }
.item-highlights { padding-left: 16px; font-size: 9.5pt; margin-top: 2px; color: #475569; }

.skills-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.skills-tags span { background: #e0f2fe; color: #0891b2; padding: 1px 8px; border-radius: 4px; font-size: 8.5pt; }

.contact-info { font-size: 9pt; color: #475569; line-height: 1.8; }
```

Compact 模板文件 (`server/data/templates/compact/template.json`):
```json
{
  "id": "compact",
  "label": "紧凑模板",
  "description": "天生节省空间，适合一页纸强需求的场景",
  "photoPosition": "top-center",
  "photoSize": { "width": 80, "height": 80 },
  "pageMargin": "10mm",
  "primaryColor": "#7c3aed"
}
```

(Morden 和 Compact 的 template.ejs 结构和 classic 类似，布局样式不同。为节省篇幅，写作计划时不展开全部内容，但在实现时需完整写出。)

- [ ] **Step 3: 创建 templateService.js**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readResume } from './storage.js';
import ejs from 'ejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../../data/templates');

export async function listTemplates() {
  const dirs = await fs.readdir(TEMPLATES_DIR);
  const templates = [];
  for (const dir of dirs) {
    try {
      const meta = JSON.parse(
        await fs.readFile(path.join(TEMPLATES_DIR, dir, 'template.json'), 'utf-8')
      );
      templates.push(meta);
    } catch { /* 跳过无效目录 */ }
  }
  return templates;
}

export async function getTemplate(templateId) {
  const templates = await listTemplates();
  return templates.find(t => t.id === templateId) || null;
}

export async function renderResume(resumeId, templateId, compress = {}) {
  const data = await readResume(resumeId);
  if (!data) throw new Error('Resume not found');

  const templateDir = path.join(TEMPLATES_DIR, templateId);
  const templateStr = await fs.readFile(path.join(templateDir, 'template.ejs'), 'utf-8');
  const style = await fs.readFile(path.join(templateDir, 'style.css'), 'utf-8');

  // 处理照片 → base64
  let photoBase64 = '';
  if (data.sections.personal.photo) {
    try {
      const photoPath = path.join(__dirname, '../../data/photos', data.sections.personal.photo);
      const ext = path.extname(data.sections.personal.photo).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const buf = await fs.readFile(photoPath);
      photoBase64 = `data:${mime};base64,${buf.toString('base64')}`;
    } catch { /* 照片不存在则跳过 */ }
  }

  // 确定压缩 CSS 类名
  const compressClass = [];
  if (compress.compact) compressClass.push('compact');
  if (compress.trim || compress.hide) compressClass.push('hide');
  const compressClassStr = compressClass.join(' ');

  // 精简模式：每个 experience/project 只保留前 3 条 highlights
  if (compress.trim && data.sections.experience) {
    data.sections.experience = data.sections.experience.map(exp => ({
      ...exp,
      highlights: (exp.highlights || []).slice(0, 3),
      description: exp.description ? exp.description.split('。')[0] + '。' : '',
    }));
  }
  if (compress.trim && data.sections.projects) {
    data.sections.projects = data.sections.projects.map(proj => ({
      ...proj,
      highlights: (proj.highlights || []).slice(0, 3),
      description: proj.description ? proj.description.split('。')[0] + '。' : '',
    }));
  }

  const html = ejs.render(templateStr, { data, style, photoBase64, compressClass: compressClassStr });
  return html;
}
```

- [ ] **Step 4: 创建 pdfService.js**

```javascript
import puppeteer from 'puppeteer';

let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function generatePDF(html, options = {}) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 检测是否超出一页
    if (options.checkOverflow) {
      const overflow = await page.evaluate(() => {
        const body = document.body;
        const height = body.scrollHeight;
        const pxPerMm = 96 / 25.4;
        const pageHeightMm = 297 - 30; // A4 - margins
        return height / pxPerMm > pageHeightMm;
      });
      page.close();
      return { overflow };
    }

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      printBackground: true,
      preferCSSPageSize: true,
    });
    return { buffer: pdf, overflow: false };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

- [ ] **Step 5: 创建模板和 PDF 路由**

`server/src/routes/templates.js`:
```javascript
import { Router } from 'express';
import * as templateService from '../services/templateService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const list = await templateService.listTemplates();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

`server/src/routes/pdf.js`:
```javascript
import { Router } from 'express';
import * as templateService from '../services/templateService.js';
import * as pdfService from '../services/pdfService.js';

const router = Router();

// 生成 PDF
router.post('/generate', async (req, res) => {
  try {
    const { resumeId, template = 'classic', compress = {} } = req.body;
    const html = await templateService.renderResume(resumeId, template, compress);
    const result = await pdfService.generatePDF(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(result.buffer);
  } catch (e) {
    console.error('PDF generate error:', e);
    res.status(500).json({ error: e.message || 'PDF 生成失败' });
  }
});

// 检测是否超出一页
router.post('/check-overflow', async (req, res) => {
  try {
    const { resumeId, template = 'classic', compress = {} } = req.body;
    const html = await templateService.renderResume(resumeId, template, compress);
    const result = await pdfService.generatePDF(html, { checkOverflow: true });
    res.json({ overflow: result.overflow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

- [ ] **Step 6: 注册路由到 index.js**

```javascript
import templatesRouter from './routes/templates.js';
import pdfRouter from './routes/pdf.js';

app.use('/api/templates', templatesRouter);
app.use('/api/pdf', pdfRouter);
```

- [ ] **Step 7: 验证 PDF 生成**

```bash
# 先确保有一个简历数据存在
RESUME_ID=$(curl -s http://localhost:3001/api/resumes | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log(r[0]?.id||'')})")
echo "Using resume: $RESUME_ID"

# 生成 PDF
curl -s -o /tmp/test-resume.pdf -X POST http://localhost:3001/api/pdf/generate \
  -H 'Content-Type: application/json' \
  -d "{\"resumeId\":\"$RESUME_ID\",\"template\":\"classic\",\"compress\":{}}"

ls -la /tmp/test-resume.pdf
# 预期: 文件存在，大小 >1KB
```

---

### Task 5: 前端 — 类型定义 + API 客户端 + Zustand Store

**Files:**
- Create: `client/src/types/resume.ts`
- Create: `client/src/api/client.ts`
- Create: `client/src/stores/useResumeStore.ts`

**Interfaces:**
- Consumes: 后端 REST API
- Produces: TypeScript 类型 `ResumeData`, `ResumeSection`, `TemplateMeta`
- Produces: `apiClient` 实例 + 封装方法
- Produces: `useResumeStore` Zustand store

- [ ] **Step 1: 创建类型定义 client/src/types/resume.ts**

```typescript
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  title: string;
  website?: string;
  address?: string;
  photo: string;
}

export interface Summary {
  content: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface Project {
  name: string;
  role: string;
  technologies: string[];
  description: string;
  highlights: string[];
  link?: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface Certificate {
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface ResumeSections {
  personal: PersonalInfo;
  summary: Summary;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillCategory[];
  certificates: Certificate[];
  languages: Language[];
}

export interface CompressSettings {
  compact: boolean;
  trim: boolean;
  hide: boolean;
}

export interface ResumeData {
  id: string;
  name: string;
  title: string;
  updatedAt: string;
  template: string;
  compressSettings: CompressSettings;
  sectionOrder: string[];
  sections: ResumeSections;
}

export interface ResumeListItem {
  id: string;
  name: string;
  title: string;
  template: string;
  updatedAt: string;
}

export interface TemplateMeta {
  id: string;
  label: string;
  description: string;
  photoPosition: string;
  photoSize: { width: number; height: number };
  pageMargin: string;
  primaryColor: string;
}
```

- [ ] **Step 2: 创建 API 客户端 client/src/api/client.ts**

```typescript
import axios from 'axios';
import type { ResumeData, ResumeListItem, TemplateMeta } from '../types/resume';

const http = axios.create({ baseURL: '/api' });

export async function fetchResumes(): Promise<ResumeListItem[]> {
  const { data } = await http.get('/resumes');
  return data;
}

export async function fetchResume(id: string): Promise<ResumeData> {
  const { data } = await http.get(`/resumes/${id}`);
  return data;
}

export async function createResume(): Promise<ResumeData> {
  const { data } = await http.post('/resumes');
  return data;
}

export async function updateResume(id: string, payload: Partial<ResumeData>): Promise<ResumeData> {
  const { data } = await http.put(`/resumes/${id}`, payload);
  return data;
}

export async function patchResume(id: string, payload: Partial<ResumeData>): Promise<ResumeData> {
  const { data } = await http.patch(`/resumes/${id}`, payload);
  return data;
}

export async function deleteResume(id: string): Promise<void> {
  await http.delete(`/resumes/${id}`);
}

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await http.post('/photo/upload', form);
  return data.filename;
}

export async function deletePhoto(filename: string): Promise<void> {
  await http.delete(`/photo/${filename}`);
}

export async function fetchTemplates(): Promise<TemplateMeta[]> {
  const { data } = await http.get('/templates');
  return data;
}

export async function generatePdf(resumeId: string, template: string, compress: object): Promise<Blob> {
  const { data } = await http.post('/pdf/generate', { resumeId, template, compress }, {
    responseType: 'blob',
  });
  return data;
}

export async function checkOverflow(resumeId: string, template: string, compress: object): Promise<boolean> {
  const { data } = await http.post('/pdf/check-overflow', { resumeId, template, compress });
  return data.overflow;
}
```

- [ ] **Step 3: 创建 Zustand Store client/src/stores/useResumeStore.ts**

```typescript
import { create } from 'zustand';
import type { ResumeData, CompressSettings } from '../types/resume';

interface ResumeStore {
  // 当前编辑的简历
  resume: ResumeData | null;
  loading: boolean;
  error: string | null;
  // 压缩设置（临时，导出前）
  compressSettings: CompressSettings;

  setResume: (resume: ResumeData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCompressSettings: (s: Partial<CompressSettings>) => void;
  // 更新简历中的某个 section
  updateSection: <K extends keyof ResumeData['sections']>(
    section: K,
    value: ResumeData['sections'][K]
  ) => void;
  updateResumeMeta: (patch: Partial<Pick<ResumeData, 'name' | 'title' | 'template' | 'sectionOrder'>>) => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resume: null,
  loading: false,
  error: null,
  compressSettings: { compact: false, trim: false, hide: false },

  setResume: (resume) => set({ resume }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCompressSettings: (s) => set((st) => ({
    compressSettings: { ...st.compressSettings, ...s },
  })),

  updateSection: (section, value) => {
    const resume = get().resume;
    if (!resume) return;
    set({
      resume: {
        ...resume,
        sections: { ...resume.sections, [section]: value },
      },
    });
  },

  updateResumeMeta: (patch) => {
    const resume = get().resume;
    if (!resume) return;
    set({ resume: { ...resume, ...patch } });
  },
}));
```

---

### Task 6: 前端 — 仪表盘页面

**Files:**
- Create: `client/src/pages/Dashboard.tsx`
- Create: `client/src/components/dashboard/ResumeCard.tsx`

**Interfaces:**
- Consumes: `fetchResumes()`, `createResume()`, `deleteResume()`  (from api/client.ts)
- Produces: 仪表盘页面，简历列表

- [ ] **Step 1: 创建 ResumeCard 组件**

`client/src/components/dashboard/ResumeCard.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import type { ResumeListItem } from '../../types/resume';

interface Props {
  resume: ResumeListItem;
  onDelete: (id: string) => void;
}

export default function ResumeCard({ resume, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 truncate">
        {resume.name || '未命名简历'}
      </h3>
      {resume.title && (
        <p className="text-sm text-gray-500 mt-1">{resume.title}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        模板: {resume.template} · 更新: {new Date(resume.updatedAt).toLocaleDateString('zh-CN')}
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate(`/editor/${resume.id}`)}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(resume.id)}
          className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100"
        >
          删除
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Dashboard 页面**

`client/src/pages/Dashboard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeCard from '../components/dashboard/ResumeCard';
import * as api from '../api/client';
import type { ResumeListItem } from '../types/resume';

export default function Dashboard() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.fetchResumes();
      setResumes(list);
    } catch {
      alert('加载简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const resume = await api.createResume();
      navigate(`/editor/${resume.id}`);
    } catch {
      alert('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这份简历？')) return;
    try {
      await api.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 新建简历
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : resumes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📄</p>
          <p className="text-lg">还没有简历</p>
          <p className="text-sm mt-1">点击上方"新建简历"开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => (
            <ResumeCard key={r.id} resume={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 7: 前端 — 编辑器页面（左侧编辑面板）

**Files:**
- Create: `client/src/pages/Editor.tsx`
- Create: `client/src/components/editor/PersonalInfoEditor.tsx`
- Create: `client/src/components/editor/SummaryEditor.tsx`
- Create: `client/src/components/editor/ExperienceEditor.tsx`
- Create: `client/src/components/editor/ProjectEditor.tsx`
- Create: `client/src/components/editor/EducationEditor.tsx`
- Create: `client/src/components/editor/SkillsEditor.tsx`
- Create: `client/src/components/editor/CertificateEditor.tsx`
- Create: `client/src/components/editor/LanguageEditor.tsx`
- Create: `client/src/components/ui/PhotoUploader.tsx`

**Interfaces:**
- Consumes: `useResumeStore`, API client
- Produces: 左右分栏编辑器页面，左侧可编辑所有模块

- [ ] **Step 1: 创建 PhotoUploader 组件**

`client/src/components/ui/PhotoUploader.tsx`:
```tsx
import { useRef } from 'react';
import * as api from '../../api/client';

interface Props {
  currentPhoto: string;
  onPhotoChange: (filename: string) => void;
}

export default function PhotoUploader({ currentPhoto, onPhotoChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('照片不能超过 5MB');
      return;
    }
    try {
      // 删除旧照片
      if (currentPhoto) await api.deletePhoto(currentPhoto).catch(() => {});
      const filename = await api.uploadPhoto(file);
      onPhotoChange(filename);
    } catch {
      alert('上传失败');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
        {currentPhoto ? (
          <img src={`/photo/${currentPhoto}`} alt="头像" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">📷</div>
        )}
      </div>
      <div>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 bg-gray-100 text-sm rounded hover:bg-gray-200"
        >
          {currentPhoto ? '更换照片' : '上传照片'}
        </button>
        {currentPhoto && (
          <button
            onClick={() => onPhotoChange('')}
            className="ml-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded"
          >
            移除
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最大 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
    </div>
  );
}
```

- [ ] **Step 2: 创建个人信息编辑器**

`client/src/components/editor/PersonalInfoEditor.tsx`:
```tsx
import { useResumeStore } from '../../stores/useResumeStore';
import PhotoUploader from '../ui/PhotoUploader';

export default function PersonalInfoEditor() {
  const personal = useResumeStore((s) => s.resume?.sections.personal);
  const updateSection = useResumeStore((s) => s.updateSection);

  if (!personal) return null;

  const update = (field: string, value: string) => {
    updateSection('personal', { ...personal, [field]: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">个人信息</h3>
      <PhotoUploader
        currentPhoto={personal.photo}
        onPhotoChange={(filename) => update('photo', filename)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">姓名</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.name} onChange={e => update('name', e.target.value)} placeholder="请输入姓名" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">职位</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.title} onChange={e => update('title', e.target.value)} placeholder="前端工程师" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">邮箱</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">电话</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.phone} onChange={e => update('phone', e.target.value)} placeholder="138-0000-0000" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">个人网站</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://..." />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建各模块编辑器（概要 + 通用列表编辑器模式）**

`client/src/components/editor/SummaryEditor.tsx`:
```tsx
import { useResumeStore } from '../../stores/useResumeStore';

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.sections.summary);
  const updateSection = useResumeStore((s) => s.updateSection);
  if (!summary) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800">个人摘要</h3>
      <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[80px]" value={summary.content} onChange={e => updateSection('summary', { content: e.target.value })} placeholder="简短介绍自己..." />
    </div>
  );
}
```

`client/src/components/editor/ExperienceEditor.tsx` — 通用列表编辑器模式，其他列表编辑器类似：
```tsx
import { useResumeStore } from '../../stores/useResumeStore';
import type { Experience } from '../../types/resume';

export default function ExperienceEditor() {
  const experiences = useResumeStore((s) => s.resume?.sections.experience ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Experience[]) => updateSection('experience', items);

  const add = () => {
    setItems([...experiences, { company: '', position: '', startDate: '', endDate: '', description: '', highlights: [] }]);
  };

  const remove = (idx: number) => {
    setItems(experiences.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | string[]) => {
    const items = experiences.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">工作经历</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {experiences.map((exp, idx) => (
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="公司" value={exp.company} onChange={e => updateItem(idx, 'company', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="职位" value={exp.position} onChange={e => updateItem(idx, 'position', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="开始时间" value={exp.startDate} onChange={e => updateItem(idx, 'startDate', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="结束时间" value={exp.endDate} onChange={e => updateItem(idx, 'endDate', e.target.value)} />
          </div>
          <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="工作描述" value={exp.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
          <div>
            <label className="text-xs text-gray-500">工作亮点（每行一条）</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="每行一条亮点" value={exp.highlights.join('\n')} onChange={e => updateItem(idx, 'highlights', e.target.value.split('\n').filter(Boolean))} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

(ProjectEditor, EducationEditor, SkillsEditor, CertificateEditor, LanguageEditor 都遵循相似的列表编辑器模式，差别在字段不同。实现时逐一写出。)

- [ ] **Step 4: 创建 Editor 主页面（左右分栏布局）**

`client/src/pages/Editor.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';
import PersonalInfoEditor from '../components/editor/PersonalInfoEditor';
import SummaryEditor from '../components/editor/SummaryEditor';
import ExperienceEditor from '../components/editor/ExperienceEditor';
import ProjectEditor from '../components/editor/ProjectEditor';
import EducationEditor from '../components/editor/EducationEditor';
import SkillsEditor from '../components/editor/SkillsEditor';
import CertificateEditor from '../components/editor/CertificateEditor';
import LanguageEditor from '../components/editor/LanguageEditor';
import PreviewPanel from '../components/preview/PreviewPanel';

const SECTION_LABELS: Record<string, string> = {
  personal: '个人信息', summary: '个人摘要', experience: '工作经历',
  projects: '项目经历', education: '教育背景', skills: '技能',
  certificates: '证书', languages: '语言',
};

const SECTION_COMPONENTS: Record<string, React.FC> = {
  personal: PersonalInfoEditor, summary: SummaryEditor,
  experience: ExperienceEditor, projects: ProjectEditor,
  education: EducationEditor, skills: SkillsEditor,
  certificates: CertificateEditor, languages: LanguageEditor,
};

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resume, setResume, setLoading, loading } = useResumeStore();
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.fetchResume(id).then(setResume).catch(() => {
      alert('加载简历失败');
      navigate('/dashboard');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!resume) return;
    try {
      await api.updateResume(resume.id, resume);
      alert('保存成功');
    } catch {
      alert('保存失败');
    }
  };

  if (loading || !resume) {
    return <div className="flex items-center justify-center h-screen text-gray-400">加载中...</div>;
  }

  const Comp = SECTION_COMPONENTS[activeSection];

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 返回</button>
          <h1 className="font-semibold text-gray-800">{resume.name || '未命名简历'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">保存</button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：模块列表 + 编辑器 */}
        <div className="w-[420px] border-r bg-white flex flex-col overflow-hidden">
          {/* 模块导航标签 */}
          <div className="flex flex-wrap gap-1 p-3 border-b shrink-0 overflow-x-auto">
            {resume.sectionOrder.map((key) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                  activeSection === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {SECTION_LABELS[key] || key}
              </button>
            ))}
          </div>
          {/* 编辑器内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <Comp />
          </div>
        </div>

        {/* 右侧：预览面板 */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-6">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
```

---

### Task 8: 前端 — 预览面板 + 模板组件

**Files:**
- Create: `client/src/components/preview/PreviewPanel.tsx`
- Create: `client/src/components/preview/ClassicTemplate.tsx`
- Create: `client/src/components/preview/ModernTemplate.tsx`
- Create: `client/src/components/preview/CompactTemplate.tsx`
- Create: `client/src/components/ui/CompressDialog.tsx`

**Interfaces:**
- Consumes: `useResumeStore`
- Produces: 实时 A4 预览、模板切换、智能一页纸按钮、导出按钮

- [ ] **Step 1: 创建经典模板的 React 预览组件**

`client/src/components/preview/ClassicTemplate.tsx`:
```tsx
import { useResumeStore } from '../../stores/useResumeStore';

export default function ClassicTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings } = resume;

  return (
    <div className={`bg-white shadow-lg mx-auto ${compressSettings.compact ? 'text-[10pt] leading-tight' : 'text-[11pt] leading-normal'}`}
      style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
      {/* Header */}
      <div className="flex items-center gap-5 pb-4 mb-4" style={{ borderBottom: '3px solid #2563eb' }}>
        {sections.personal.photo && (
          <img src={`/photo/${sections.personal.photo}`} className="w-24 h-24 rounded-full object-cover border-2 border-blue-600" alt="photo" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
          {sections.personal.title && <p className="text-blue-600 mt-1">{sections.personal.title}</p>}
          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
            {sections.personal.email && <span>✉ {sections.personal.email}</span>}
            {sections.personal.phone && <span>📞 {sections.personal.phone}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {sections.summary.content && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">个人</span>摘要</h2>
          <p className="text-sm text-gray-600">{sections.summary.content}</p>
        </div>
      )}

      {/* Experience */}
      {sections.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">工作</span>经历</h2>
          {sections.experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{exp.company}</span>
                <span className="text-xs text-gray-400">{exp.startDate} ~ {exp.endDate}</span>
              </div>
              <p className="text-sm text-gray-600">{exp.description}</p>
              {exp.highlights.length > 0 && (
                <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">
                  {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {sections.projects.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">项目</span>经历</h2>
          {sections.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{proj.name}</span>
                <span className="text-xs text-gray-400">{proj.technologies.join(', ')}</span>
              </div>
              <p className="text-sm text-gray-600">{proj.description}</p>
              {proj.highlights.length > 0 && (
                <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">
                  {proj.highlights.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {sections.education.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">教育</span>背景</h2>
          {sections.education.map((edu, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span>
              <span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {sections.skills.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">技能</span>专长</h2>
          {sections.skills.map((sk, i) => (
            <div key={i} className="mb-1">
              <span className="text-sm font-medium">{sk.category}：</span>
              {sk.items.map((item, j) => (
                <span key={j} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{item}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Certificates & Languages — hidden if compress.hide */}
      {!compressSettings.hide && sections.certificates.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">证书</span></h2>
          {sections.certificates.map((cert, i) => (
            <div key={i} className="text-sm">{cert.name} · {cert.issuer} ({cert.date})</div>
          ))}
        </div>
      )}
      {!compressSettings.hide && sections.languages.length > 0 && (
        <div className="mb-4">
          <h2 className="section-title"><span className="text-blue-600">语言</span></h2>
          <div className="flex gap-2">
            {sections.languages.map((lang, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{lang.name} · {lang.level}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 ModernTemplate 和 CompactTemplate 预览组件**

(Modern 模板：右栏照片 + 青色主题；Compact 模板：顶部居中照片 + 紫色主题。均为 React 组件，结构与 ClassicTemplate 类似但布局不同。实现时展开完整代码。)

- [ ] **Step 3: 创建 CompressDialog 组件**

`client/src/components/ui/CompressDialog.tsx`:
```tsx
import { useResumeStore } from '../../stores/useResumeStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function CompressDialog({ open, onClose, onApply }: Props) {
  const { compressSettings, setCompressSettings } = useResumeStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">智能一页纸</h2>
        <p className="text-sm text-gray-500 mb-4">内容超出一页，请选择压缩策略：</p>

        <label className="flex items-start gap-3 mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.compact}
            onChange={e => setCompressSettings({ compact: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">📏 紧凑模式</span>
            <p className="text-xs text-gray-400">缩小边距、行距、字号，内容不变</p>
          </div>
        </label>

        <label className="flex items-start gap-3 mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.trim}
            onChange={e => setCompressSettings({ trim: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">✂️ 精简模式</span>
            <p className="text-xs text-gray-400">缩短描述文本，保留前 3 条亮点</p>
          </div>
        </label>

        <label className="flex items-start gap-3 mb-4 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.hide}
            onChange={e => setCompressSettings({ hide: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">🎯 隐藏次要模块</span>
            <p className="text-xs text-gray-400">隐藏证书、语言等模块</p>
          </div>
        </label>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">取消</button>
          <button onClick={onApply} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">应用</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 PreviewPanel**

`client/src/components/preview/PreviewPanel.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import * as api from '../../api/client';
import ClassicTemplate from './ClassicTemplate';
import ModernTemplate from './ModernTemplate';
import CompactTemplate from './CompactTemplate';
import CompressDialog from '../ui/CompressDialog';
import type { TemplateMeta } from '../../types/resume';

const TEMPLATE_MAP: Record<string, React.FC> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  compact: CompactTemplate,
};

export default function PreviewPanel() {
  const { resume, updateResumeMeta, compressSettings } = useResumeStore();
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [showCompress, setShowCompress] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.fetchTemplates().then(setTemplates).catch(() => {});
  }, []);

  if (!resume) return null;

  const TemplateComp = TEMPLATE_MAP[resume.template] || ClassicTemplate;

  const handleExport = async (compress = false) => {
    setExporting(true);
    try {
      const blob = await api.generatePdf(resume.id, resume.template, compress ? compressSettings : {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.sections.personal.name || 'resume'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出 PDF 失败');
    } finally {
      setExporting(false);
    }
  };

  const handleSmartOnePage = async () => {
    // 检测是否超出一页
    try {
      const overflow = await api.checkOverflow(resume.id, resume.template, compressSettings);
      if (overflow) {
        setShowCompress(true);
      } else {
        // 没超出直接导出一页版
        await handleExport(true);
      }
    } catch {
      setShowCompress(true);
    }
  };

  return (
    <div className="max-w-[210mm] mx-auto">
      {/* 操作栏 */}
      <div className="flex items-center gap-2 mb-4 bg-white rounded-lg p-3 shadow-sm">
        {/* 模板切换 */}
        <select
          value={resume.template}
          onChange={e => updateResumeMeta({ template: e.target.value })}
          className="text-sm border rounded px-2 py-1"
        >
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleSmartOnePage}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          📄 智能一页纸
        </button>
        <button
          onClick={() => handleExport(false)}
          disabled={exporting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? '导出中...' : '⬇ 导出 PDF'}
        </button>
      </div>

      {/* 预览 */}
      <div className="overflow-auto bg-white shadow-lg" style={{ aspectRatio: '210 / 297' }}>
        <TemplateComp />
      </div>

      {/* 压缩弹窗 */}
      <CompressDialog
        open={showCompress}
        onClose={() => setShowCompress(false)}
        onApply={async () => {
          setShowCompress(false);
          await handleExport(true);
        }}
      />
    </div>
  );
}
```

---

### Task 9: 连接前端与后端 — 自动保存 + 完整流程验证

**Files:**
- Create: `client/src/hooks/useAutoSave.ts`
- Modify: `client/src/pages/Editor.tsx` (接入自动保存)

**Interfaces:**
- Consumes: `useResumeStore`, `api.updateResume`
- Produces: 编辑时自动保存，完整前后端联动

- [ ] **Step 1: 创建自动保存 Hook**

```typescript
import { useEffect, useRef } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useAutoSave(interval = 30000) {
  const resume = useResumeStore((s) => s.resume);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!resume) return;
    timerRef.current = setInterval(async () => {
      try {
        await api.updateResume(resume.id, resume);
        console.log('Auto-saved:', new Date().toLocaleTimeString());
      } catch {
        console.error('Auto-save failed');
      }
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [resume, interval]);
}
```

- [ ] **Step 2: 在 Editor.tsx 中接入自动保存**

```typescript
// 在 Editor 组件中添加：
import { useAutoSave } from '../hooks/useAutoSave';

// 在 return 之前：
useAutoSave();
```

---

### Task 10: 智能一页纸增强 — 溢出检测 UI 反馈

**Files:**
- Modify: `client/src/components/preview/PreviewPanel.tsx`
- Create: `client/src/hooks/useOverflowCheck.ts`

**Interfaces:**
- Consumes: `api.checkOverflow`
- Produces: 实时溢出提示、智能一页纸完整交互

- [ ] **Step 1: 创建溢出检测 Hook**

```typescript
import { useState, useEffect } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useOverflowCheck() {
  const resume = useResumeStore((s) => s.resume);
  const [overflow, setOverflow] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!resume) return;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await api.checkOverflow(resume.id, resume.template, resume.compressSettings);
        setOverflow(result);
      } catch {
        setOverflow(null);
      } finally {
        setChecking(false);
      }
    }, 1000); // 防抖 1s
    return () => clearTimeout(timer);
  }, [resume?.sections, resume?.template, resume?.compressSettings]);

  return { overflow, checking };
}
```

- [ ] **Step 2: 在 PreviewPanel 中添加溢出提示**

在 PreviewPanel 中 `操作栏` 下方添加：
```tsx
{overflow === true && (
  <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700 flex items-center gap-2">
    <span>⚠️ 内容超出一页</span>
    <button onClick={handleSmartOnePage} className="ml-auto px-2 py-0.5 bg-amber-200 rounded text-xs hover:bg-amber-300">
      智能调整
    </button>
  </div>
)}
```

---

### Task 11: 项目收尾 — README + 启动脚本 + 验证

**Files:**
- Create: `README.md`
- Modify: `package.json` (完善脚本)

- [ ] **Step 1: 编写 README.md**

```markdown
# 简历自动生成系统

网页版简历编辑器，支持实时预览、多模板切换、智能一页纸压缩、PDF 导出。

## 快速启动

\`\`\`bash
# 安装依赖
cd server && npm install && cd ../client && npm install && cd ..
npm install

# 启动（前后端同时）
npm run dev

# 分别启动
npm run dev:server   # 后端 http://localhost:3001
npm run dev:client   # 前端 http://localhost:5173
\`\`\`

## 功能

- 简历编辑：个人信息、工作经历、项目经历、教育背景、技能、证书、语言
- 照片上传：支持 JPG/PNG，自动裁剪，5MB 限制
- 实时预览：编辑即预览，模拟 A4 纸张
- 多模板：经典/现代/紧凑三种布局
- 智能一页纸：紧凑/精简/隐藏三种压缩策略
- PDF 导出：Puppeteer 精确渲染

## 技术栈

- 前端：React 18 + TypeScript + Vite + TailwindCSS + Zustand
- 后端：Express.js + Puppeteer
- 存储：JSON 文件系统
```

- [ ] **Step 2: 完整验证**

```bash
# 1. 启动服务端
cd server && node src/index.js &

# 2. 验证健康检查
curl http://localhost:3001/api/health

# 3. 创建测试简历
RESUME=$(curl -s -X POST http://localhost:3001/api/resumes)
ID=$(echo $RESUME | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

# 4. 写入示例数据
curl -s -X PATCH "http://localhost:3001/api/resumes/$ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"张三",
    "title":"高级前端工程师",
    "sections":{
      "personal":{"name":"张三","email":"zhang@test.com","phone":"13800000000","title":"高级前端工程师"},
      "summary":{"content":"8 年前端开发经验，精通 React 生态。"},
      "experience":[{"company":"字节跳动","position":"高级工程师","startDate":"2022-03","endDate":"至今","description":"负责核心业务","highlights":["性能优化 40%"]}],
      "education":[{"school":"北京大学","degree":"本科","major":"计算机科学","startDate":"2014-09","endDate":"2018-06"}],
      "skills":[{"category":"前端","items":["React","TypeScript"]}]
    }
  }'

# 5. 生成 PDF
curl -s -o /tmp/resume-test.pdf -X POST http://localhost:3001/api/pdf/generate \
  -H 'Content-Type: application/json' \
  -d "{\"resumeId\":\"$ID\",\"template\":\"classic\"}"

ls -la /tmp/resume-test.pdf
echo "PDF generated successfully!"
```

---

## 任务依赖关系

```
Task 1 (脚手架)
├── Task 2 (CRUD API) ──────────┐
├── Task 3 (照片 API) ──────────┤
├── Task 4 (PDF+模板) ──────────┤
└── Task 5 (前端类型+API) ──────┤
                                ▼
                 Task 6 (仪表盘) ──┐
                 Task 7 (编辑器) ──┤
                 Task 8 (预览面板) ─┤
                                  ▼
                        Task 9 (自动保存)
                        Task 10 (智能一页纸增强)
                        Task 11 (收尾验证)
```

## 执行顺序建议

1. **Task 1 → Task 2 → Task 3 → Task 4** (后端全栈基础)
2. **Task 1 → Task 5** (可与后端并行)
3. **Task 6 + Task 7 + Task 8** (前端页面，需后端 API 就位)
4. **Task 9 + Task 10** (增强功能)
5. **Task 11** (收尾)
