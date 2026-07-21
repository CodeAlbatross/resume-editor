import { useResumeStore } from '../../stores/useResumeStore';
import type { Education } from '../../types/resume';

export default function EducationEditor() {
  const educations = useResumeStore((s) => s.resume?.sections.education ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Education[]) => updateSection('education', items);

  const add = () => {
    setItems([...educations, { school: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' }]);
  };

  const remove = (idx: number) => {
    setItems(educations.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= educations.length) return;
    const items = [...educations];
    [items[idx], items[target]] = [items[target], items[idx]];
    setItems(items);
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = educations.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">教育背景</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {educations.map((edu, idx) => (
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
              {idx > 0 && <button onClick={() => move(idx, -1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
              {idx < educations.length - 1 && <button onClick={() => move(idx, 1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
            </div>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="学校" value={edu.school} onChange={e => updateItem(idx, 'school', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="学位" value={edu.degree} onChange={e => updateItem(idx, 'degree', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="专业" value={edu.major} onChange={e => updateItem(idx, 'major', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="GPA" value={edu.gpa || ''} onChange={e => updateItem(idx, 'gpa', e.target.value)} />
            <input type="month" className="border rounded px-2 py-1 text-sm" placeholder="开始时间" value={edu.startDate} onChange={e => updateItem(idx, 'startDate', e.target.value)} />
            <input type="month" className="border rounded px-2 py-1 text-sm" placeholder="结束时间" value={edu.endDate} onChange={e => updateItem(idx, 'endDate', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
