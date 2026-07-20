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
