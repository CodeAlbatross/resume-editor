import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import type { Project } from '../../types/resume';
import OptimizeButton from '../ai/OptimizeButton';

export default function ProjectEditor() {
  const projects = useResumeStore((s) => s.resume?.sections.projects ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Project[]) => updateSection('projects', items);

  const add = () => {
    setItems([...projects, { name: '', role: '', technologies: [], description: '', highlights: [] }]);
  };

  const remove = (idx: number) => {
    setItems(projects.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= projects.length) return;
    const items = [...projects];
    [items[idx], items[target]] = [items[target], items[idx]];
    setItems(items);
  };

  const updateItem = (idx: number, field: string, value: string | string[]) => {
    const items = projects.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">项目经历</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {projects.map((proj, idx) => (
        <ProjectItem
          key={idx}
          proj={proj}
          index={idx}
          total={projects.length}
          updateItem={updateItem}
          onRemove={() => remove(idx)}
          onMove={(dir) => move(idx, dir)}
        />
      ))}
    </div>
  );
}

function ProjectItem({ proj, index, total, updateItem, onRemove, onMove }: {
  proj: Project;
  index: number;
  total: number;
  updateItem: (idx: number, field: string, value: string | string[]) => void;
  onRemove: () => void;
  onMove: (dir: number) => void;
}) {
  const [highlightsText, setHighlightsText] = useState(() => proj.highlights.join('\n'));
  const prevHighlightsRef = useRef(proj.highlights);

  useEffect(() => {
    const prev = prevHighlightsRef.current;
    if (prev !== proj.highlights) {
      const prevStr = prev.join('\n');
      const currStr = proj.highlights.join('\n');
      if (prevStr !== highlightsText) setHighlightsText(currStr);
      prevHighlightsRef.current = proj.highlights;
    }
  }, [proj.highlights]);

  const handleHighlightsChange = (text: string) => {
    setHighlightsText(text);
    updateItem(index, 'highlights', text.split('\n'));
  };

  const handleHighlightsBlur = () => {
    const trimmed = highlightsText.replace(/\n+$/, '');
    setHighlightsText(trimmed);
    updateItem(index, 'highlights', trimmed.split('\n').filter(Boolean));
  };

  // Tech stack: local text state to avoid comma split on every keystroke
  const [techText, setTechText] = useState(() => proj.technologies.join(', '));
  const prevTechRef = useRef(proj.technologies);

  useEffect(() => {
    const prev = prevTechRef.current;
    if (prev !== proj.technologies) {
      setTechText(proj.technologies.join(', '));
      prevTechRef.current = proj.technologies;
    }
  }, [proj.technologies]);

  const handleTechChange = (text: string) => {
    setTechText(text);
  };

  const handleTechBlur = () => {
    const items = techText.split(',').map(s => s.trim()).filter(Boolean);
    setTechText(items.join(', '));
    updateItem(index, 'technologies', items);
  };

  return (
    <div className="border rounded p-3 space-y-2 bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
          {index > 0 && <button onClick={() => onMove(-1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
          {index < total - 1 && <button onClick={() => onMove(1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
          <OptimizeButton section="projects" itemIndex={index} />
        </div>
        <button onClick={onRemove} className="text-xs text-red-500">删除</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1 text-sm" placeholder="项目名称" value={proj.name} onChange={e => updateItem(index, 'name', e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="角色" value={proj.role} onChange={e => updateItem(index, 'role', e.target.value)} />
      </div>
      <textarea
        className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
        placeholder="项目描述"
        value={proj.description}
        onChange={e => updateItem(index, 'description', e.target.value)}
      />
      <div>
        <label className="text-xs text-gray-500">技术栈（逗号分隔）</label>
        <input className="w-full border rounded px-2 py-1 text-sm" placeholder="React, TypeScript, Node.js" value={techText} onChange={e => handleTechChange(e.target.value)} onBlur={handleTechBlur} />
      </div>
      <div>
        <label className="text-xs text-gray-500">项目亮点（每行一条）</label>
        <textarea className="w-full border rounded px-2 py-1 text-sm min-h-[72px]" placeholder="每行一条亮点" value={highlightsText} onChange={e => handleHighlightsChange(e.target.value)} onBlur={handleHighlightsBlur} />
      </div>
    </div>
  );
}
