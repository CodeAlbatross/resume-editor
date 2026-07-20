import { Router } from 'express';
import * as templateService from '../services/templateService.js';
import * as pdfService from '../services/pdfService.js';

const router = Router();

// 生成 PDF
router.post('/generate', async (req, res) => {
  try {
    const { resumeId, template = 'classic', compress = {} } = req.body;
    const { html } = await templateService.renderResume(resumeId, template, compress);
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
    const { html, pageMargin } = await templateService.renderResume(resumeId, template, compress);
    const result = await pdfService.generatePDF(html, { checkOverflow: true, pageMargin });
    res.json({ overflow: result.overflow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
