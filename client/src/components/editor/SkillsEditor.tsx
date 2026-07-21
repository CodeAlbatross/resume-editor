import { useResumeStore } from '../../stores/useResumeStore';
import type { SkillCategory, SkillItem } from '../../types/resume';

const PROFICIENCY_OPTIONS = ['', '精通', '熟练', '掌握', '了解'];

export default function SkillsEditor() {
  const skills = useResumeStore((s) => s.resume?.sections.skills ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: SkillCategory[]) => updateSection('skills', items);

  const add = () => {
    setItems([...skills, { category: '', items: [] }]);
  };

  const remove = (idx: number) => {
    setItems(skills.filter((_, i) => i !== idx));
  };

  const moveCategory = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= skills.length) return;
    const items = [...skills];
    [items[idx], items[target]] = [items[target], items[idx]];
    setItems(items);
  };

  const moveItem = (catIdx: number, itemIdx: number, dir: number) => {
    const target = itemIdx + dir;
    const cat = skills[catIdx];
    if (target < 0 || target >= cat.items.length) return;
    const items = skills.map((c, i) => {
      if (i !== catIdx) return c;
      const newItems = [...c.items];
      [newItems[itemIdx], newItems[target]] = [newItems[target], newItems[itemIdx]];
      return { ...c, items: newItems };
    });
    setItems(items);
  };

  const updateCategory = (idx: number, value: string) => {
    const items = skills.map((item, i) => i === idx ? { ...item, category: value } : item);
    setItems(items);
  };

  const addItem = (catIdx: number) => {
    const items = skills.map((cat, i) =>
      i === catIdx ? { ...cat, items: [...cat.items, { name: '', level: '' }] } : cat
    );
    setItems(items);
  };

  const updateItemName = (catIdx: number, itemIdx: number, name: string) => {
    const items = skills.map((cat, i) => {
      if (i !== catIdx) return cat;
      const newItems = cat.items.map((sk, j) => j === itemIdx ? { ...sk, name } : sk);
      return { ...cat, items: newItems };
    });
    setItems(items);
  };

  const updateItemLevel = (catIdx: number, itemIdx: number, level: string) => {
    const items = skills.map((cat, i) => {
      if (i !== catIdx) return cat;
      const newItems = cat.items.map((sk, j) => j === itemIdx ? { ...sk, level } : sk);
      return { ...cat, items: newItems };
    });
    setItems(items);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const items = skills.map((cat, i) =>
      i === catIdx ? { ...cat, items: cat.items.filter((_, j) => j !== itemIdx) } : cat
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">技能</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加分类</button>
      </div>
      {skills.map((cat, catIdx) => (
        <div key={catIdx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-medium text-gray-500">分类 #{catIdx + 1}</span>
              {catIdx > 0 && <button onClick={() => moveCategory(catIdx, -1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移分类">▲</button>}
              {catIdx < skills.length - 1 && <button onClick={() => moveCategory(catIdx, 1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移分类">▼</button>}
            </div>
            <button onClick={() => remove(catIdx)} className="text-xs text-red-500">删除分类</button>
          </div>
          <div>
            <label className="text-xs text-gray-500">分类名称</label>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="前端、后端、工具..." value={cat.category} onChange={e => updateCategory(catIdx, e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">技能项</label>
              <button onClick={() => addItem(catIdx)} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加技能</button>
            </div>
            {cat.items.length === 0 ? (
              <p className="text-xs text-gray-300 italic">暂无技能，点击"添加技能"</p>
            ) : (
              <div className="space-y-1.5">
                {cat.items.map((sk, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-1.5">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="技能名称"
                      value={sk.name}
                      onChange={e => updateItemName(catIdx, itemIdx, e.target.value)}
                    />
                    <select
                      className="w-20 border rounded px-1 py-1 text-xs text-gray-600"
                      value={sk.level || ''}
                      onChange={e => updateItemLevel(catIdx, itemIdx, e.target.value)}
                    >
                      {PROFICIENCY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o || '无'}</option>
                      ))}
                    </select>
                    {itemIdx > 0 && <button onClick={() => moveItem(catIdx, itemIdx, -1)} className="text-[10px] text-gray-300 hover:text-gray-600 shrink-0" title="上移">▲</button>}
                    {itemIdx < cat.items.length - 1 && <button onClick={() => moveItem(catIdx, itemIdx, 1)} className="text-[10px] text-gray-300 hover:text-gray-600 shrink-0" title="下移">▼</button>}
                    <button onClick={() => removeItem(catIdx, itemIdx)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
