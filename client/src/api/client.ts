import axios from 'axios';
import type { AiChatMessage, AiOptimizeRequest, ResumeData, ResumeListItem, TemplateMeta } from '../types/resume';

const http = axios.create({ baseURL: '/api' });

export async function fetchResumes(): Promise<ResumeListItem[]> {
  const { data } = await http.get('/resumes');
  return data;
}

export async function fetchResume(id: string): Promise<ResumeData> {
  const { data } = await http.get(`/resumes/${id}`);
  return data;
}

export async function createResume(): Promise<ResumeData> {
  const { data } = await http.post('/resumes');
  return data;
}

export async function updateResume(id: string, payload: Partial<ResumeData>): Promise<ResumeData> {
  const { data } = await http.put(`/resumes/${id}`, payload);
  return data;
}

export async function patchResume(id: string, payload: Partial<ResumeData>): Promise<ResumeData> {
  const { data } = await http.patch(`/resumes/${id}`, payload);
  return data;
}

export async function deleteResume(id: string): Promise<void> {
  await http.delete(`/resumes/${id}`);
}

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await http.post('/photo/upload', form);
  return data.filename;
}

export async function deletePhoto(filename: string): Promise<void> {
  await http.delete(`/photo/${filename}`);
}

export async function fetchTemplates(): Promise<TemplateMeta[]> {
  const { data } = await http.get('/templates');
  return data;
}

export async function generatePdf(resumeId: string, template: string, compress: object): Promise<Blob> {
  const { data } = await http.post('/pdf/generate', { resumeId, template, compress }, {
    responseType: 'blob',
  });
  return data;
}

export async function checkOverflow(resumeId: string, template: string, compress: object): Promise<boolean> {
  const { data } = await http.post('/pdf/check-overflow', { resumeId, template, compress });
  return data.overflow;
}

// === 版本历史 API ===

export interface VersionMeta {
  versionId: string;
  timestamp: string;
  name: string;
  resumeSize: number;
}

export async function fetchVersions(resumeId: string): Promise<VersionMeta[]> {
  const { data } = await http.get(`/resumes/${resumeId}/versions`);
  return data;
}

export async function createNamedVersion(resumeId: string, name: string): Promise<VersionMeta> {
  const { data } = await http.post(`/resumes/${resumeId}/versions`, { name });
  return data;
}

export async function restoreVersion(resumeId: string, versionId: string): Promise<any> {
  const { data } = await http.post(`/resumes/${resumeId}/versions/${versionId}/restore`);
  return data;
}

export async function deleteVersion(resumeId: string, versionId: string): Promise<void> {
  await http.delete(`/resumes/${resumeId}/versions/${versionId}`);
}

// === AI 优化 API（SSE 流式，用 fetch） ===

function sseFetch(
  url: string,
  body: object,
  onDelta: (text: string) => void,
  onDone?: () => void
): { stop: () => void } {
  const controller = new AbortController();
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error('无响应体');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === 'delta' && evt.text) onDelta(evt.text);
            else if (evt.type === 'error') throw new Error(evt.message || 'AI 服务错误');
            else if (evt.type === 'done') onDone?.();
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    })
    .catch((e: unknown) => {
      if ((e as Error).name !== 'AbortError') {
        onDelta(`\n\n[错误] ${(e as Error).message || '连接失败'}`);
        onDone?.();
      }
    });
  return { stop: () => controller.abort() };
}

export function aiOptimize(req: AiOptimizeRequest, onDelta: (t: string) => void, onDone?: () => void) {
  return sseFetch('/api/ai/optimize', req, onDelta, onDone);
}

export function aiChat(req: { resume: ResumeData; messages: AiChatMessage[] }, onDelta: (t: string) => void, onDone?: () => void) {
  return sseFetch('/api/ai/chat', req, onDelta, onDone);
}
