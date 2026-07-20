import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';
import PersonalInfoEditor from '../components/editor/PersonalInfoEditor';
import SummaryEditor from '../components/editor/SummaryEditor';
import ExperienceEditor from '../components/editor/ExperienceEditor';
import ProjectEditor from '../components/editor/ProjectEditor';
import EducationEditor from '../components/editor/EducationEditor';
import SkillsEditor from '../components/editor/SkillsEditor';
import CertificateEditor from '../components/editor/CertificateEditor';
import LanguageEditor from '../components/editor/LanguageEditor';
import PreviewPanel from '../components/preview/PreviewPanel';

const SECTION_LABELS: Record<string, string> = {
  personal: '个人信息', summary: '个人摘要', experience: '工作经历',
  projects: '项目经历', education: '教育背景', skills: '技能',
  certificates: '证书', languages: '语言',
};

const SECTION_COMPONENTS: Record<string, React.FC> = {
  personal: PersonalInfoEditor, summary: SummaryEditor,
  experience: ExperienceEditor, projects: ProjectEditor,
  education: EducationEditor, skills: SkillsEditor,
  certificates: CertificateEditor, languages: LanguageEditor,
};

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resume, setResume, setLoading, loading } = useResumeStore();
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.fetchResume(id).then(setResume).catch(() => {
      alert('加载简历失败');
      navigate('/dashboard');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!resume) return;
    try {
      await api.updateResume(resume.id, resume);
      alert('保存成功');
    } catch {
      alert('保存失败');
    }
  };

  if (loading || !resume) {
    return <div className="flex items-center justify-center h-screen text-gray-400">加载中...</div>;
  }

  const Comp = SECTION_COMPONENTS[activeSection] || (() => <p className="text-gray-400">未找到编辑器</p>);

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 返回</button>
          <h1 className="font-semibold text-gray-800">{resume.name || '未命名简历'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">保存</button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：模块列表 + 编辑器 */}
        <div className="w-[420px] border-r bg-white flex flex-col overflow-hidden">
          {/* 模块导航标签 */}
          <div className="flex flex-wrap gap-1 p-3 border-b shrink-0 overflow-x-auto">
            {resume.sectionOrder.map((key) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                  activeSection === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {SECTION_LABELS[key] || key}
              </button>
            ))}
          </div>
          {/* 编辑器内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <Comp />
          </div>
        </div>

        {/* 右侧：预览面板 */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-6">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
