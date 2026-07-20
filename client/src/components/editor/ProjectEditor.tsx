import { useResumeStore } from '../../stores/useResumeStore';
import type { Project } from '../../types/resume';

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
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="项目名称" value={proj.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="角色" value={proj.role} onChange={e => updateItem(idx, 'role', e.target.value)} />
          </div>
          <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="项目描述" value={proj.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
          <div>
            <label className="text-xs text-gray-500">技术栈（逗号分隔）</label>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="React, TypeScript, Node.js" value={proj.technologies.join(', ')} onChange={e => updateItem(idx, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className="text-xs text-gray-500">项目亮点（每行一条）</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="每行一条亮点" value={proj.highlights.join('\n')} onChange={e => updateItem(idx, 'highlights', e.target.value.split('\n').filter(Boolean))} />
          </div>
        </div>
      ))}
    </div>
  );
}
