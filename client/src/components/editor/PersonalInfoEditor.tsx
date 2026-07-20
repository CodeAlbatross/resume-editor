import { useResumeStore } from '../../stores/useResumeStore';
import PhotoUploader from '../ui/PhotoUploader';

export default function PersonalInfoEditor() {
  const personal = useResumeStore((s) => s.resume?.sections.personal);
  const updateSection = useResumeStore((s) => s.updateSection);

  if (!personal) return null;

  const update = (field: string, value: string) => {
    updateSection('personal', { ...personal, [field]: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">个人信息</h3>
      <PhotoUploader
        currentPhoto={personal.photo}
        onPhotoChange={(filename) => update('photo', filename)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">姓名</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.name} onChange={e => update('name', e.target.value)} placeholder="请输入姓名" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">职位</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.title} onChange={e => update('title', e.target.value)} placeholder="前端工程师" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">邮箱</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">电话</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.phone} onChange={e => update('phone', e.target.value)} placeholder="138-0000-0000" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">个人网站</label>
          <input className="w-full border rounded px-2 py-1.5 text-sm" value={personal.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://..." />
        </div>
      </div>
    </div>
  );
}
