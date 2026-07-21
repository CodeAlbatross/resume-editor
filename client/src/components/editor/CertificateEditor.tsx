import { useResumeStore } from '../../stores/useResumeStore';
import type { Certificate } from '../../types/resume';

export default function CertificateEditor() {
  const certificates = useResumeStore((s) => s.resume?.sections.certificates ?? []);
  const updateSection = useResumeStore((s) => s.updateSection);

  const setItems = (items: Certificate[]) => updateSection('certificates', items);

  const add = () => {
    setItems([...certificates, { name: '', issuer: '', date: '' }]);
  };

  const remove = (idx: number) => {
    setItems(certificates.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= certificates.length) return;
    const items = [...certificates];
    [items[idx], items[target]] = [items[target], items[idx]];
    setItems(items);
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = certificates.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">证书</h3>
        <button onClick={add} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加</button>
      </div>
      {certificates.map((cert, idx) => (
        <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
              {idx > 0 && <button onClick={() => move(idx, -1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
              {idx < certificates.length - 1 && <button onClick={() => move(idx, 1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
            </div>
            <button onClick={() => remove(idx)} className="text-xs text-red-500">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="证书名称" value={cert.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="颁发机构" value={cert.issuer} onChange={e => updateItem(idx, 'issuer', e.target.value)} />
            <input type="month" className="border rounded px-2 py-1 text-sm" placeholder="获得日期" value={cert.date} onChange={e => updateItem(idx, 'date', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
