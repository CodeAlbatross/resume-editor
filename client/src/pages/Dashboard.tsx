import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeCard from '../components/dashboard/ResumeCard';
import * as api from '../api/client';
import type { ResumeListItem } from '../types/resume';

export default function Dashboard() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.fetchResumes();
      setResumes(list);
    } catch {
      alert('加载简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const resume = await api.createResume();
      navigate(`/editor/${resume.id}`);
    } catch {
      alert('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这份简历？')) return;
    try {
      await api.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 新建简历
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : resumes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📄</p>
          <p className="text-lg">还没有简历</p>
          <p className="text-sm mt-1">点击上方"新建简历"开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => (
            <ResumeCard key={r.id} resume={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
