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

  // 验证模板是否存在
  const templateDir = path.join(TEMPLATES_DIR, templateId);
  try {
    await fs.access(templateDir);
  } catch {
    throw new Error(`Template '${templateId}' not found`);
  }

  const templateStr = await fs.readFile(path.join(templateDir, 'template.ejs'), 'utf-8');
  const style = await fs.readFile(path.join(templateDir, 'style.css'), 'utf-8');

  // 处理照片 → base64（带 null 安全）
  let photoBase64 = '';
  if (data.sections?.personal?.photo) {
    try {
      const safeFilename = path.basename(data.sections.personal.photo);
      const photoPath = path.join(__dirname, '../../data/photos', safeFilename);
      const ext = path.extname(safeFilename).toLowerCase();
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
  // 注意：先深拷贝 data，避免修改原始对象
  const renderData = JSON.parse(JSON.stringify(data));
  if (compress.trim && renderData.sections?.experience) {
    renderData.sections.experience = renderData.sections.experience.map(exp => ({
      ...exp,
      highlights: (exp.highlights || []).slice(0, 3),
      description: exp.description ? exp.description.split('。')[0] + '。' : '',
    }));
  }
  if (compress.trim && renderData.sections?.projects) {
    renderData.sections.projects = renderData.sections.projects.map(proj => ({
      ...proj,
      highlights: (proj.highlights || []).slice(0, 3),
      description: proj.description ? proj.description.split('。')[0] + '。' : '',
    }));
  }

  const html = ejs.render(templateStr, { data: renderData, style, photoBase64, compressClass: compressClassStr });

  // 返回页面和页面 margin 信息（用于溢出检测）
  let pageMargin = 15; // 默认 15mm
  try {
    const meta = JSON.parse(
      await fs.readFile(path.join(templateDir, 'template.json'), 'utf-8')
    );
    const match = meta.pageMargin?.match(/^(\d+)/);
    if (match) pageMargin = parseInt(match[1], 10);
  } catch { /* 使用默认值 */ }

  return { html, pageMargin };
}
