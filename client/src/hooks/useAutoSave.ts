import { useEffect, useRef } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useAutoSave(interval = 30000) {
  const resume = useResumeStore((s) => s.resume);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!resume) return;
    timerRef.current = setInterval(async () => {
      try {
        await api.updateResume(resume.id, resume);
        console.log('Auto-saved:', new Date().toLocaleTimeString());
      } catch {
        console.error('Auto-save failed');
      }
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [resume, interval]);
}
