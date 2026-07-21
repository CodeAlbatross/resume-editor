import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import type { Experience } from '../../types/resume';

export default function ExperienceEditor() {
  const experiences = useResumeStore((s) => s.resume?.sections.experience ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Experience[]) => updateSection('experience', items);

  const add = () => {
    setItems([...experiences, { company: '', position: '', startDate: '', endDate: '', description: '', highlights: [] }]);
  };

  const remove = (idx: number) => {
    setItems(experiences.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= experiences.length) return;
    const items = [...experiences];
    [items[idx], items[target]] = [items[target], items[idx]];
    setItems(items);
  };

  const updateItem = (idx: number, field: string, value: string | string[]) => {
    const items = experiences.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">工作经历</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {experiences.map((exp, idx) => (
        <ExperienceItem
          key={idx}
          exp={exp}
          index={idx}
          total={experiences.length}
          updateItem={updateItem}
          onRemove={() => remove(idx)}
          onMove={(dir) => move(idx, dir)}
        />
      ))}
    </div>
  );
}

// Separate component so each item has its own highlights text state
function ExperienceItem({ exp, index, total, updateItem, onRemove, onMove }: {
  exp: Experience;
  index: number;
  total: number;
  updateItem: (idx: number, field: string, value: string | string[]) => void;
  onRemove: () => void;
  onMove: (dir: number) => void;
}) {
  // Local text state for highlights — synced from store on init and when highlights change externally
  const [highlightsText, setHighlightsText] = useState(() => exp.highlights.join('\n'));
  const prevHighlightsRef = useRef(exp.highlights);

  // Sync from store if highlights were changed from outside (e.g. undo, load)
  useEffect(() => {
    const prev = prevHighlightsRef.current;
    const current = exp.highlights;
    // Only sync if the array identity changed (i.e. from store, not from our own updates)
    if (prev !== current) {
      const prevStr = prev.join('\n');
      const currStr = current.join('\n');
      if (prevStr !== highlightsText) {
        setHighlightsText(currStr);
      }
      prevHighlightsRef.current = current;
    }
  }, [exp.highlights]);

  const handleHighlightsChange = (text: string) => {
    setHighlightsText(text);
    // Don't filter out empty lines — let user type freely
    const lines = text.split('\n');
    updateItem(index, 'highlights', lines);
  };

  const handleHighlightsBlur = () => {
    // On blur, clean up: remove trailing empty lines and trim each line
    const clean = highlightsText
      .split('\n')
      .map(l => l.trim())
      .filter((l, i, arr) => l !== '' || i < arr.length - 1); // keep non-trailing empty lines
    const cleaned = clean.join('\n');
    // Remove fully trailing blank lines
    const trimmed = cleaned.replace(/\n+$/, '');
    setHighlightsText(trimmed);
    updateItem(index, 'highlights', trimmed.split('\n').filter(Boolean));
  };

  return (
    <div className="border rounded p-3 space-y-2 bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
          {index > 0 && <button onClick={() => onMove(-1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
          {index < total - 1 && <button onClick={() => onMove(1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
        </div>
        <button onClick={onRemove} className="text-xs text-red-500">删除</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1 text-sm" placeholder="公司" value={exp.company} onChange={e => updateItem(index, 'company', e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="职位" value={exp.position} onChange={e => updateItem(index, 'position', e.target.value)} />
        <input type="month" className="border rounded px-2 py-1 text-sm" placeholder="开始时间" value={exp.startDate} onChange={e => updateItem(index, 'startDate', e.target.value)} />
        <input type="month" className="border rounded px-2 py-1 text-sm" placeholder="结束时间" value={exp.endDate} onChange={e => updateItem(index, 'endDate', e.target.value)} />
      </div>
      <textarea
        className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
        placeholder="工作描述"
        value={exp.description}
        onChange={e => updateItem(index, 'description', e.target.value)}
      />
      <div>
        <label className="text-xs text-gray-500">工作亮点（每行一条，换行即可）</label>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm min-h-[72px]"
          placeholder="每行一条亮点"
          value={highlightsText}
          onChange={e => handleHighlightsChange(e.target.value)}
          onBlur={handleHighlightsBlur}
        />
      </div>
    </div>
  );
}
