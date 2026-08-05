import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import resumesRouter from './routes/resumes.js';
import photosRouter from './routes/photos.js';
import templatesRouter from './routes/templates.js';
import pdfRouter from './routes/pdf.js';
import versionsRouter from './routes/versions.js';
import aiRouter from './routes/ai.js';

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

// 简历 CRUD API
app.use('/api/resumes', resumesRouter);

// 版本历史 API (嵌套在 resumes 下)
app.use('/api/resumes/:id/versions', versionsRouter);

// 照片上传 API
app.use('/api/photo', photosRouter);

// 模板 API
app.use('/api/templates', templatesRouter);

// PDF 生成 API
app.use('/api/pdf', pdfRouter);

// AI 优化 API
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
