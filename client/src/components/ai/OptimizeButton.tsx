import { useState } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import { useAiStore } from '../../stores/useAiStore';
import * as api from '../../api/client';
import type { ResumeData } from '../../types/resume';

interface Props {
  section: 'summary' | 'experience' | 'projects';
  itemIndex?: number;
}

export default function OptimizeButton({ section, itemIndex }: Props) {
  const resume = useResumeStore((s) => s.resume);
  const updateSection = useResumeStore((s) => s.updateSection);
  const setOptimizing = useAiStore((s) => s.setOptimizing);
  const setStreamingSection = useAiStore((s) => s.setStreamingSection);
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [failed, setFailed] = useState(false); // 优化失败标志，失败时禁止应用

  const start = () => {
    if (!resume) return;
    // 取原文
    let orig = '';
    if (section === 'summary') orig = resume.sections.summary.content;
    else if (itemIndex !== undefined) {
      const arr = section === 'experience' ? resume.sections.experience : resume.sections.projects;
      orig = arr[itemIndex]?.description || '';
    }
    setOriginal(orig);
    setResult('');
    setInstruction('');
    setFailed(false); // 重置失败标志
    setOpen(true);
  };

  const run = async () => {
    if (!resume) return;
    setStreaming(true);
    setOptimizing(true);
    setStreamingSection(`${section}-${itemIndex ?? 'all'}`);
    setFailed(false); // 调用前重置失败标志
    api.aiOptimize(
      { resume, section, itemIndex, instruction },
      (t) => {
        // 检测错误文本（如 "\n\n[错误] xxx"），标记失败以禁用应用
        if (t.includes('[错误]')) setFailed(true);
        setResult((prev) => prev + t);
      },
      () => { setStreaming(false); setOptimizing(false); setStreamingSection(null); }
    );
  };

  const apply = () => {
    if (!resume || !result.trim() || failed) return;
    if (section === 'summary') {
      updateSection('summary', { content: result.trim() });
    } else if (itemIndex !== undefined && (section === 'experience' || section === 'projects')) {
      const key = section;
      const arr = resume.sections[key];
      const next = arr.map((it: any, i: number) =>
        i === itemIndex ? { ...it, description: result.trim() } : it
      );
      updateSection(key, next as never);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={start}
        className="text-xs text-amber-500 hover:text-amber-700 shrink-0"
        title="AI 优化"
      >✨</button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !streaming && setOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">✨ AI 优化</h3>
              {streaming && <span className="text-xs text-amber-500 animate-pulse">优化中...</span>}
            </div>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="附加指令（可选），如：更量化、突出架构能力"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={streaming}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">原文</p>
                <div className="text-sm text-gray-400 bg-gray-50 rounded p-2 min-h-[80px] max-h-48 overflow-y-auto whitespace-pre-wrap">{original}</div>
              </div>
              <div>
                <p className="text-xs text-green-500 mb-1">AI 优化</p>
                <div className="text-sm text-gray-800 bg-green-50 rounded p-2 min-h-[80px] max-h-48 overflow-y-auto whitespace-pre-wrap">{result || (streaming ? '生成中...' : '')}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setOpen(false)} disabled={streaming} className="px-3 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50">撤销</button>
              <button onClick={run} disabled={streaming || !resume} className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">
                {streaming ? '优化中...' : '开始优化'}
              </button>
              <button onClick={apply} disabled={streaming || !result.trim() || failed} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">应用</button>
            </div>
            {failed && <p className="text-xs text-red-500 text-right">优化失败，无法应用</p>}
          </div>
        </div>
      )}
    </>
  );
}
