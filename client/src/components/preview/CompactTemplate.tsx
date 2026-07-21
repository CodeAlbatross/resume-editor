import { useResumeStore } from '../../stores/useResumeStore';

function sName(sk: any) { return typeof sk === 'string' ? sk : sk.name; }
function sLevel(sk: any) { return typeof sk === 'string' ? '' : (sk.level || ''); }

export default function CompactTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings, themeColor, sectionOrder } = resume;
  const c = themeColor || '#7c3aed';
  const customFields = sections.customFields || [];

  const SectionTitle = ({ text }: { text: string }) => (
    <h2 style={{ color: c, fontWeight: 700, fontSize: '10pt', borderBottom: `1px solid ${c}33`, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</h2>
  );

  const renderSection = (key: string) => {
    if (compressSettings.hide && ['certificates', 'languages'].includes(key)) return null;

    switch (key) {
      case 'summary':
        return sections.summary.content ? (
          <div key={key} className="mb-3"><SectionTitle text="个人摘要" /><p className="text-xs text-gray-600">{sections.summary.content}</p></div>
        ) : null;
      case 'experience':
        return sections.experience.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="工作经历" />
            {sections.experience.map((exp, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between items-baseline"><span className="font-semibold text-xs">{exp.company}</span><span className="text-[9px] text-gray-400">{exp.startDate} ~ {exp.endDate}</span></div>
                {exp.position && <p className="text-xs text-gray-500">{exp.position}</p>}
                <p className="text-xs text-gray-600">{exp.description}</p>
                {(exp.highlights.length > 0 && !compressSettings.trim) && <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">{exp.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
                {(exp.highlights.length > 0 && compressSettings.trim) && <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">{exp.highlights.slice(0, 3).map((h, j) => <li key={j}>{h}</li>)}</ul>}
              </div>
            ))}
          </div>
        ) : null;
      case 'projects':
        return sections.projects.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="项目经历" />
            {sections.projects.map((proj, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between items-baseline"><span className="font-semibold text-xs">{proj.name}</span><span className="text-[9px] text-gray-400">{proj.technologies.join(', ')}</span></div>
                <p className="text-xs text-gray-600">{proj.description}</p>
                {(proj.highlights.length > 0 && !compressSettings.trim) && <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">{proj.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
                {(proj.highlights.length > 0 && compressSettings.trim) && <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">{proj.highlights.slice(0, 3).map((h, j) => <li key={j}>{h}</li>)}</ul>}
              </div>
            ))}
          </div>
        ) : null;
      case 'education':
        return sections.education.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="教育背景" />
            {sections.education.map((edu, i) => (
              <div key={i} className="flex justify-between text-xs"><span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span><span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span></div>
            ))}
          </div>
        ) : null;
      case 'skills':
        return sections.skills.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="技能专长" />
            {sections.skills.map((sk, i) => (
              <div key={i} className="mb-0.5">
                <span className="text-xs font-medium">{sk.category}：</span>
                {sk.items.map((item: any, j: number) => (
    <span key={j} className="inline-block text-[9px] px-1.5 py-0.5 rounded mr-0.5 mb-0.5" style={{ backgroundColor: c + '15', color: c }}>
      {sName(item)}{sLevel(item) ? <span className="ml-0.5 opacity-60">·{sLevel(item)}</span> : null}
    </span>
  ))}
              </div>
            ))}
          </div>
        ) : null;
      case 'certificates':
        return sections.certificates.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="证书" />
            {sections.certificates.map((cert, i) => <div key={i} className="text-xs">{cert.name} · {cert.issuer} ({cert.date})</div>)}
          </div>
        ) : null;
      case 'languages':
        return sections.languages.length > 0 ? (
          <div key={key} className="mb-3">
            <SectionTitle text="语言" />
            <div className="flex gap-1.5 flex-wrap">{sections.languages.map((lang, i) => (<span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: c + '15', color: c }}>{lang.name} · {lang.level}</span>))}</div>
          </div>
        ) : null;
      default:
        if (key.startsWith('custom_')) {
          const field = customFields.find(f => f.key === key);
          if (field && field.content.trim()) {
            return (
              <div key={key} className="mb-3">
                <SectionTitle text={field.title} />
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{field.content}</p>
              </div>
            );
          }
        }
        return null;
    }
  };

  return (
    <div className={`bg-white shadow-lg mx-auto ${compressSettings.compact ? 'text-[9pt] leading-tight' : 'text-[10pt] leading-snug'}`}
      style={{ width: '210mm', minHeight: '297mm', padding: '12mm 15mm' }}>
      {/* Photo */}
      {sections.personal.photo && <div className="flex justify-center mb-3"><img src={`/photo/${sections.personal.photo}`} className="w-20 h-20 rounded-full object-cover" style={{ border: `2px solid ${c}` }} alt="" /></div>}
      {/* Header */}
      <div className="text-center pb-2 mb-3" style={{ borderBottom: `2px solid ${c}` }}>
        <h1 className="text-xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
        {sections.personal.title && <p style={{ color: c }} className="mt-0.5">{sections.personal.title}</p>}
        <div className="text-xs text-gray-500 mt-1 flex justify-center gap-3">
          {sections.personal.email && <span>✉ {sections.personal.email}</span>}
          {sections.personal.phone && <span>📞 {sections.personal.phone}</span>}
        </div>
      </div>
      {/* Sections in order */}
      {sectionOrder.map(key => renderSection(key))}
    </div>
  );
}
