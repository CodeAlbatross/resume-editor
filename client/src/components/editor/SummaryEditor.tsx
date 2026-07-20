import { useResumeStore } from '../../stores/useResumeStore';

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.sections.summary);
  const updateSection = useResumeStore((s) => s.updateSection);
  if (!summary) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800">个人摘要</h3>
      <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[80px]" value={summary.content} onChange={e => updateSection('summary', { content: e.target.value })} placeholder="简短介绍自己..." />
    </div>
  );
}
