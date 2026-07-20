import { create } from 'zustand';
import type { ResumeData, CompressSettings } from '../types/resume';

interface ResumeStore {
  // 当前编辑的简历
  resume: ResumeData | null;
  loading: boolean;
  error: string | null;
  // 压缩设置（临时，导出前）
  compressSettings: CompressSettings;

  setResume: (resume: ResumeData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCompressSettings: (s: Partial<CompressSettings>) => void;
  // 更新简历中的某个 section
  updateSection: <K extends keyof ResumeData['sections']>(
    section: K,
    value: ResumeData['sections'][K]
  ) => void;
  updateResumeMeta: (patch: Partial<Pick<ResumeData, 'name' | 'title' | 'template' | 'sectionOrder'>>) => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resume: null,
  loading: false,
  error: null,
  compressSettings: { compact: false, trim: false, hide: false },

  setResume: (resume) => set({ resume }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCompressSettings: (s) => set((st) => ({
    compressSettings: { ...st.compressSettings, ...s },
  })),

  updateSection: (section, value) => {
    const resume = get().resume;
    if (!resume) return;
    set({
      resume: {
        ...resume,
        sections: { ...resume.sections, [section]: value },
      },
    });
  },

  updateResumeMeta: (patch) => {
    const resume = get().resume;
    if (!resume) return;
    set({ resume: { ...resume, ...patch } });
  },
}));
