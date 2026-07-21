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
  updateResumeMeta: (patch: Partial<Pick<ResumeData, 'name' | 'title' | 'template' | 'sectionOrder' | 'themeColor'>>) => void;
  // 移动模块位置
  moveSection: (fromIndex: number, toIndex: number) => void;
  // 添加自定义模块
  addCustomSection: () => void;
  removeCustomSection: (key: string) => void;
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

  moveSection: (fromIndex, toIndex) => {
    const resume = get().resume;
    if (!resume) return;
    const order = [...resume.sectionOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    set({ resume: { ...resume, sectionOrder: order } });
  },

  addCustomSection: () => {
    const resume = get().resume;
    if (!resume) return;
    const key = 'custom_' + Date.now();
    const newSection: any = { key, title: '自定义模块', content: '在此输入内容' };
    // 确保 customFields 存在
    const customFields = resume.sections.customFields || [];
    set({
      resume: {
        ...resume,
        sectionOrder: [...resume.sectionOrder, key],
        sections: {
          ...resume.sections,
          customFields: [...customFields, newSection],
        },
      },
    });
  },

  removeCustomSection: (key) => {
    const resume = get().resume;
    if (!resume) return;
    const customFields = (resume.sections.customFields || []).filter(c => c.key !== key);
    set({
      resume: {
        ...resume,
        sectionOrder: resume.sectionOrder.filter(s => s !== key),
        sections: { ...resume.sections, customFields },
      },
    });
  },
}));
