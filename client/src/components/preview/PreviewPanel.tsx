import React, { useState, useEffect } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import * as api from '../../api/client';
import ClassicTemplate from './ClassicTemplate';
import ModernTemplate from './ModernTemplate';
import CompactTemplate from './CompactTemplate';
import CompressDialog from '../ui/CompressDialog';
import type { TemplateMeta } from '../../types/resume';

const TEMPLATE_MAP: Record<string, React.FC> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  compact: CompactTemplate,
};

export default function PreviewPanel() {
  const { resume, updateResumeMeta, compressSettings } = useResumeStore();
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [showCompress, setShowCompress] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.fetchTemplates().then(setTemplates).catch(() => {});
  }, []);

  if (!resume) return null;

  const TemplateComp = TEMPLATE_MAP[resume.template] || ClassicTemplate;

  const handleExport = async (compress = false) => {
    setExporting(true);
    try {
      const blob = await api.generatePdf(resume.id, resume.template, compress ? compressSettings : {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.sections.personal.name || 'resume'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出 PDF 失败');
    } finally {
      setExporting(false);
    }
  };

  const handleSmartOnePage = async () => {
    // 检测是否超出一页
    try {
      const overflow = await api.checkOverflow(resume.id, resume.template, compressSettings);
      if (overflow) {
        setShowCompress(true);
      } else {
        // 没超出直接导出一页版
        await handleExport(true);
      }
    } catch {
      setShowCompress(true);
    }
  };

  return (
    <div className="max-w-[210mm] mx-auto">
      {/* 操作栏 */}
      <div className="flex items-center gap-2 mb-4 bg-white rounded-lg p-3 shadow-sm">
        {/* 模板切换 */}
        <select
          value={resume.template}
          onChange={e => updateResumeMeta({ template: e.target.value })}
          className="text-sm border rounded px-2 py-1"
        >
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleSmartOnePage}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          📄 智能一页纸
        </button>
        <button
          onClick={() => handleExport(false)}
          disabled={exporting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? '导出中...' : '⬇ 导出 PDF'}
        </button>
      </div>

      {/* 预览 */}
      <div className="overflow-auto bg-white shadow-lg" style={{ aspectRatio: '210 / 297' }}>
        <TemplateComp />
      </div>

      {/* 压缩弹窗 */}
      <CompressDialog
        open={showCompress}
        onClose={() => setShowCompress(false)}
        onApply={async () => {
          setShowCompress(false);
          await handleExport(true);
        }}
      />
    </div>
  );
}
