import axios from 'axios';
import type { ResumeData, ResumeListItem, TemplateMeta } from '../types/resume';

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
