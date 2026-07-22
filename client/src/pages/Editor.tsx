import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import PersonalInfoEditor from '../components/editor/PersonalInfoEditor';
import SummaryEditor from '../components/editor/SummaryEditor';
import ExperienceEditor from '../components/editor/ExperienceEditor';
import ProjectEditor from '../components/editor/ProjectEditor';
import EducationEditor from '../components/editor/EducationEditor';
import SkillsEditor from '../components/editor/SkillsEditor';
import CertificateEditor from '../components/editor/CertificateEditor';
import LanguageEditor from '../components/editor/LanguageEditor';
import CustomEditor from '../components/editor/CustomEditor';
import PreviewPanel from '../components/preview/PreviewPanel';
import VersionHistory from '../components/editor/VersionHistory';

const DEFAULT_LABELS: Record<string, string> = {
  personal: '个人信息', summary: '个人摘要', experience: '工作经历',
  projects: '项目经历', education: '教育背景', skills: '技能',
  certificates: '证书', languages: '语言',
};

function getSectionLabel(key: string, customFields: any[]): string {
  if (DEFAULT_LABELS[key]) return DEFAULT_LABELS[key];
  const custom = customFields?.find(c => c.key === key);
  return custom?.title || key;
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resume, setResume, setLoading, loading, updateResumeMeta, moveSection, addCustomSection, removeCustomSection, updateSection } = useResumeStore();
  const [activeSection, setActiveSection] = useState('personal');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.fetchResume(id).then((r) => {
      // 确保新字段有默认值
      if (!r.themeColor) r.themeColor = '#2563eb';
      if (!r.sections.customFields) (r.sections as any).customFields = [];
      // 向后兼容：将旧的字符串技能转为 SkillItem
      if (r.sections.skills) {
        r.sections.skills = r.sections.skills.map((cat: any) => ({
          ...cat,
          items: (cat.items || []).map((item: any) =>
            typeof item === 'string' ? { name: item, level: '' } : item
          ),
        }));
      }
      setResume(r);
    }).catch(() => {
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

  useAutoSave();

  if (loading || !resume) {
    return <div className="flex items-center justify-center h-screen text-gray-400">加载中...</div>;
  }

  const customFields = resume.sections.customFields || [];
  const order = resume.sectionOrder;

  // 获取当前编辑器的组件（支持自定义模块）
  const getActiveComponent = () => {
    if (DEFAULT_LABELS[activeSection]) {
      const components: Record<string, React.FC> = {
        personal: PersonalInfoEditor, summary: SummaryEditor,
        experience: ExperienceEditor, projects: ProjectEditor,
        education: EducationEditor, skills: SkillsEditor,
        certificates: CertificateEditor, languages: LanguageEditor,
      };
      return components[activeSection] || (() => <p className="text-gray-400">未找到编辑器</p>);
    }
    // 自定义模块
    return () => <CustomEditor sectionKey={activeSection} />;
  };
  const Comp = getActiveComponent();

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 返回</button>
          {editingName ? (
            <input autoFocus className="font-semibold text-gray-800 border-b-2 border-blue-500 outline-none px-1 py-0.5 text-base" value={nameDraft} onChange={e => setNameDraft(e.target.value)} onBlur={() => { updateResumeMeta({ name: nameDraft }); setEditingName(false); }} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingName(false); }} />
          ) : (
            <h1 className="font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded" onClick={() => { setNameDraft(resume.name || ''); setEditingName(true); }} title="点击编辑名称">{resume.name || '未命名简历'}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 配色选择 */}
          <label className="flex items-center gap-1 text-sm text-gray-500" title="主题色">
            <span>🎨</span>
            <input type="color" value={resume.themeColor || '#2563eb'} onChange={e => updateResumeMeta({ themeColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border" />
          </label>
          <button onClick={() => setShowVersions(true)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300">版本历史</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">保存</button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧 */}
        <div className="w-[420px] border-r bg-white flex flex-col overflow-hidden">
          {/* 模块导航（带排序） */}
          <div className="flex flex-col p-3 border-b shrink-0 gap-1">
            <div className="flex flex-wrap gap-1">
              {order.map((key, idx) => (
                <div key={key} className="flex items-center gap-0.5 group">
                  <button
                    onClick={() => setActiveSection(key)}
                    className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                      activeSection === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {getSectionLabel(key, customFields)}
                  </button>
                  {idx > 0 && (
                    <button onClick={() => moveSection(idx, idx - 1)} className="text-[10px] text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" title="左移">▲</button>
                  )}
                  {idx < order.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); moveSection(idx, idx + 1); }} className="text-[10px] text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" title="右移">▼</button>
                  )}
                  {key.startsWith('custom_') && (
                    <button onClick={() => removeCustomSection(key)} className="text-[10px] text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" title="删除此模块">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addCustomSection} className="text-xs text-blue-600 hover:text-blue-800 self-start mt-1">+ 添加自定义模块</button>
          </div>
          {/* 编辑器内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <Comp />
          </div>
        </div>

        {/* 右侧：预览 */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-6">
          <PreviewPanel />
        </div>
      </div>

      {/* 版本历史弹窗 */}
      <VersionHistory
        resumeId={resume.id}
        open={showVersions}
        onClose={() => setShowVersions(false)}
        onRestored={() => {
          api.fetchResume(resume.id).then((r) => {
            if (!r.themeColor) r.themeColor = '#2563eb';
            if (!r.sections.customFields) (r.sections as any).customFields = [];
            setResume(r);
          }).catch(() => alert('重新加载简历失败'));
        }}
      />
    </div>
  );
}
