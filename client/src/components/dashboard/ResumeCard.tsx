import { useNavigate } from 'react-router-dom';
import type { ResumeListItem } from '../../types/resume';

interface Props {
  resume: ResumeListItem;
  onDelete: (id: string) => void;
}

export default function ResumeCard({ resume, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 truncate">
        {resume.name || '未命名简历'}
      </h3>
      {resume.title && (
        <p className="text-sm text-gray-500 mt-1">{resume.title}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        模板: {resume.template} · 更新: {new Date(resume.updatedAt).toLocaleDateString('zh-CN')}
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate(`/editor/${resume.id}`)}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(resume.id)}
          className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100"
        >
          删除
        </button>
      </div>
    </div>
  );
}
