import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import type { SkillCategory } from '../../types/resume';

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

  const updateItem = (idx: number, field: string, value: string | string[]) => {
    const items = skills.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">技能</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {skills.map((skill, idx) => (
        <SkillItem key={idx} skill={skill} index={idx} updateItem={updateItem} onRemove={() => remove(idx)} />
      ))}
    </div>
  );
}

function SkillItem({ skill, index, updateItem, onRemove }: {
  skill: SkillCategory;
  index: number;
  updateItem: (idx: number, field: string, value: string | string[]) => void;
  onRemove: () => void;
}) {
  const [itemsText, setItemsText] = useState(() => skill.items.join(', '));
  const prevItemsRef = useRef(skill.items);

  useEffect(() => {
    const prev = prevItemsRef.current;
    if (prev !== skill.items) {
      setItemsText(skill.items.join(', '));
      prevItemsRef.current = skill.items;
    }
  }, [skill.items]);

  const handleChange = (text: string) => {
    setItemsText(text);
  };

  const handleBlur = () => {
    const items = itemsText.split(',').map(s => s.trim()).filter(Boolean);
    setItemsText(items.join(', '));
    updateItem(index, 'items', items);
  };

  return (
    <div className="border rounded p-3 space-y-2 bg-gray-50">
      <div className="flex justify-between">
        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
        <button onClick={onRemove} className="text-xs text-red-500">删除</button>
      </div>
      <div>
        <label className="text-xs text-gray-500">分类名称</label>
        <input className="w-full border rounded px-2 py-1 text-sm" placeholder="前端、后端、工具..." value={skill.category} onChange={e => updateItem(index, 'category', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500">技能项（逗号分隔）</label>
        <input className="w-full border rounded px-2 py-1 text-sm" placeholder="React, TypeScript, CSS" value={itemsText} onChange={e => handleChange(e.target.value)} onBlur={handleBlur} />
      </div>
    </div>
  );
}
