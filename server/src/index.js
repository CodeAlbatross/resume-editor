import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import resumesRouter from './routes/resumes.js';

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
