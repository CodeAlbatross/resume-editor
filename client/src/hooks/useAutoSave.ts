import { useEffect, useRef } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useAutoSave(interval = 30000) {
  const resume = useResumeStore((s) => s.resume);
  const resumeRef = useRef(resume);
  resumeRef.current = resume;

  useEffect(() => {
    if (!resumeRef.current) return;
    const id = resumeRef.current.id;
    const timer = setInterval(async () => {
      const current = resumeRef.current;
      if (!current) return;
      try {
        await api.updateResume(current.id, current);
        console.log('Auto-saved:', new Date().toLocaleTimeString());
      } catch {
        console.error('Auto-save failed');
      }
    }, interval);
    return () => clearInterval(timer);
  }, [resume?.id, interval]); // depend only on id, not the whole object
}
