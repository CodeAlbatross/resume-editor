import { useState, useEffect } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useOverflowCheck() {
  const resume = useResumeStore((s) => s.resume);
  const [overflow, setOverflow] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!resume) return;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await api.checkOverflow(resume.id, resume.template, resume.compressSettings);
        setOverflow(result);
      } catch {
        setOverflow(null);
      } finally {
        setChecking(false);
      }
    }, 1000); // 防抖 1s
    return () => clearTimeout(timer);
  }, [resume?.sections, resume?.template, resume?.compressSettings]);

  return { overflow, checking };
}
