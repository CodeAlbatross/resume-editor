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
    const fullPath = path.resolve(PHOTO_DIR, req.params.filename);
    if (!fullPath.startsWith(PHOTO_DIR)) {
      return res.status(400).json({ error: '非法的文件名' });
    }
    await fs.unlink(fullPath);
    res.json({ deleted: true });
  } catch {
    res.status(404).json({ error: '文件未找到' });
  }
});

export default router;
