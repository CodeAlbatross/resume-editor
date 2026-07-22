import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSIONS_DIR = path.resolve(path.join(__dirname, '../../data/versions'));
const MAX_VERSIONS = 30;

function generateVersionId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 6);
  return `${ts}-${rand}`;
}

function safePath(baseDir, name) {
  const filePath = path.resolve(baseDir, name);
  if (!filePath.startsWith(baseDir)) throw new Error('Invalid path');
  return filePath;
}

/**
 * 创建版本快照
 * @param {string} resumeId
 * @param {object} resumeData - 快照时的完整简历数据
 * @param {string} name - 版本名称，默认"自动保存"
 * @returns {Promise<{versionId: string, timestamp: string, name: string, resumeSize: number}>}
 */
export async function createVersion(resumeId, resumeData, name = '自动保存') {
  const dir = path.join(VERSIONS_DIR, resumeId);
  await fs.mkdir(dir, { recursive: true });

  const versionId = generateVersionId();
  const versionObj = {
    versionId,
    timestamp: new Date().toISOString(),
    name,
    data: resumeData,
  };

  const fp = safePath(dir, `${versionId}.json`);
  await fs.writeFile(fp, JSON.stringify(versionObj, null, 2), 'utf-8');

  // 清理超出限制的旧版本
  await enforceMaxVersions(resumeId);

  return {
    versionId,
    timestamp: versionObj.timestamp,
    name,
    resumeSize: Buffer.byteLength(JSON.stringify(resumeData)),
  };
}

/**
 * 列出所有版本（不含 data 字段），按时间倒序
 */
export async function listVersions(resumeId) {
  const dir = path.join(VERSIONS_DIR, resumeId);
  try {
    await fs.access(dir);
  } catch {
    return [];
  }

  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const versions = [];
  for (const file of jsonFiles) {
    try {
      const fp = safePath(dir, file);
      const content = JSON.parse(await fs.readFile(fp, 'utf-8'));
      versions.push({
        versionId: content.versionId,
        timestamp: content.timestamp,
        name: content.name,
        resumeSize: content.data ? Buffer.byteLength(JSON.stringify(content.data)) : 0,
      });
    } catch {
      // 跳过损坏的版本文件
    }
  }

  // 按时间倒序
  versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return versions;
}

/**
 * 获取单个版本的完整数据
 */
export async function getVersion(resumeId, versionId) {
  const dir = path.join(VERSIONS_DIR, resumeId);
  const fp = safePath(dir, `${versionId}.json`);
  try {
    const content = JSON.parse(await fs.readFile(fp, 'utf-8'));
    return content;
  } catch {
    const err = new Error('版本不存在');
    err.statusCode = 404;
    throw err;
  }
}

/**
 * 删除指定版本
 */
export async function deleteVersion(resumeId, versionId) {
  const dir = path.join(VERSIONS_DIR, resumeId);
  const fp = safePath(dir, `${versionId}.json`);
  try {
    await fs.unlink(fp);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理超出 MAX_VERSIONS 的旧版本
 */
async function enforceMaxVersions(resumeId) {
  const dir = path.join(VERSIONS_DIR, resumeId);
  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return;
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  if (jsonFiles.length <= MAX_VERSIONS) return;

  // 按文件名（时间前缀）排序，保留最新的 MAX_VERSIONS 个
  jsonFiles.sort();
  const toDelete = jsonFiles.slice(0, jsonFiles.length - MAX_VERSIONS);

  for (const file of toDelete) {
    try {
      await fs.unlink(path.join(dir, file));
    } catch {
      // 忽略删除失败
    }
  }
}
