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
