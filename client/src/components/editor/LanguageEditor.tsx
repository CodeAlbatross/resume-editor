import { useResumeStore } from '../../stores/useResumeStore';
import type { Language } from '../../types/resume';

export default function LanguageEditor() {
  const languages = useResumeStore((s) => s.resume?.sections.languages ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Language[]) => updateSection('languages', items);

  const add = () => {
    setItems([...languages, { name: '', level: '' }]);
  };

  const remove = (idx: number) => {
    setItems(languages.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = languages.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">语言</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {languages.map((lang, idx) => (
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="语言" value={lang.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="水平" value={lang.level} onChange={e => updateItem(idx, 'level', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
