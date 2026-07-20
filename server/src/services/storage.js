import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(path.join(__dirname, '../../data/resumes'));

function safePath(id) {
  const filePath = path.resolve(DATA_DIR, `${id}.json`);
  if (!filePath.startsWith(DATA_DIR)) throw new Error('Invalid id');
  return filePath;
}

export async function listResumes() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
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
  const filePath = safePath(id);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function writeResume(id, data) {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  const record = { ...data, id, updatedAt: new Date().toISOString() };
  const filePath = safePath(id);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');
  return record;
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
  const filePath = safePath(id);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
