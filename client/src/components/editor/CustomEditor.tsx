import { useResumeStore } from '../../stores/useResumeStore';

interface Props {
  sectionKey: string;
}

export default function CustomEditor({ sectionKey }: Props) {
  const resume = useResumeStore((s) => s.resume);
  const updateSection = useResumeStore((s) => s.updateSection);

  const customFields = resume?.sections.customFields || [];
  const field = customFields.find((c) => c.key === sectionKey);
  if (!field) return <p className="text-gray-400 text-sm">模块未找到</p>;

  const updateField = (key: string, newTitle: string, newContent: string) => {
    const updated = customFields.map((c) =>
      c.key === key ? { ...c, title: newTitle, content: newContent } : c
    );
    updateSection('customFields', updated);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">自定义模块</h3>
      <div>
        <label className="block text-xs text-gray-500 mb-1">模块标题</label>
        <input
          className="w-full border rounded px-2 py-1.5 text-sm"
          value={field.title}
          onChange={(e) => updateField(sectionKey, e.target.value, field.content)}
          placeholder="模块名称"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">内容（支持纯文本或多行文本）</label>
        <textarea
          className="w-full border rounded px-2 py-1.5 text-sm min-h-[120px]"
          value={field.content}
          onChange={(e) => updateField(sectionKey, field.title, e.target.value)}
          placeholder="在此输入内容..."
        />
      </div>
    </div>
  );
}
