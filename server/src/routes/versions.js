import { Router } from 'express';
import * as versionService from '../services/versionService.js';
import * as storage from '../services/storage.js';

const router = Router({ mergeParams: true });

// 列出所有版本
router.get('/', async (req, res) => {
  try {
    const list = await versionService.listVersions(req.params.id);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 获取单个版本详情
router.get('/:versionId', async (req, res) => {
  try {
    const version = await versionService.getVersion(req.params.id, req.params.versionId);
    res.json(version);
  } catch (e) {
    if (e.statusCode === 404) return res.status(404).json({ error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// 手动创建命名版本
router.post('/', async (req, res) => {
  try {
    const existing = await storage.readResume(req.params.id);
    if (!existing) return res.status(404).json({ error: '简历不存在' });

    const meta = await versionService.createVersion(req.params.id, existing, req.body.name || '手动存档');
    res.status(201).json(meta);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 恢复到指定版本
router.post('/:versionId/restore', async (req, res) => {
  try {
    // 获取要恢复的版本
    const version = await versionService.getVersion(req.params.id, req.params.versionId);

    // 恢复前先保存当前状态作为自动版本（安全网）
    const current = await storage.readResume(req.params.id);
    if (current) {
      versionService.createVersion(req.params.id, current, '恢复前的自动保存').catch(() => {});
    }

    // 写入恢复的数据
    const restored = await storage.writeResume(req.params.id, version.data);
    res.json({ success: true, resume: restored });
  } catch (e) {
    if (e.statusCode === 404) return res.status(404).json({ error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// 删除版本
router.delete('/:versionId', async (req, res) => {
  try {
    const ok = await versionService.deleteVersion(req.params.id, req.params.versionId);
    res.json({ deleted: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
