import express from 'express';
import cors from 'cors';
import fs from 'fs';
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

// 加载 .env 配置（AI API Key 等）；文件不存在则跳过
// 注意：手动解析并用 override 语义（.env 优先于已存在的环境变量），
// 因为 process.loadEnvFile() 默认不覆盖已设置的环境变量，
// 会导致 .env 里新写入的 key 被 shell 中已有的同名变量遮蔽。
const ENV_PATH = path.join(__dirname, '../.env');
try {
  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  for (const rawLine of envContent.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = value;
  }
} catch {
  // 未配置 .env，AI 功能将不可用（isConfigured 返回 false）
}

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
