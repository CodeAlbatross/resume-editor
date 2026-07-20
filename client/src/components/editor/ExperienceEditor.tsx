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
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="公司" value={exp.company} onChange={e => updateItem(idx, 'company', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="职位" value={exp.position} onChange={e => updateItem(idx, 'position', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="开始时间" value={exp.startDate} onChange={e => updateItem(idx, 'startDate', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="结束时间" value={exp.endDate} onChange={e => updateItem(idx, 'endDate', e.target.value)} />
          </div>
          <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="工作描述" value={exp.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
          <div>
            <label className="text-xs text-gray-500">工作亮点（每行一条）</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="每行一条亮点" value={exp.highlights.join('\n')} onChange={e => updateItem(idx, 'highlights', e.target.value.split('\n').filter(Boolean))} />
          </div>
        </div>
      ))}
    </div>
  );
}
