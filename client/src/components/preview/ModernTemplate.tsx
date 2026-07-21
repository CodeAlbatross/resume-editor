import { useResumeStore } from '../../stores/useResumeStore';

function sName(sk: any) { return typeof sk === 'string' ? sk : sk.name; }
function sLevel(sk: any) { return typeof sk === 'string' ? '' : (sk.level || ''); }

export default function ModernTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings, themeColor, sectionOrder } = resume;
  const c = themeColor || '#0891b2';
  const customFields = sections.customFields || [];

  const SectionTitle = ({ text }: { text: string }) => (
    <h2 style={{ color: c, fontWeight: 700, fontSize: '10pt', borderBottom: `1px solid ${c}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</h2>
  );

  const renderMain = (key: string) => {
    switch (key) {
      case 'summary':
        return sections.summary.content ? (
          <div key={key} className="mb-4"><SectionTitle text="个人摘要" /><p className="text-sm text-gray-600">{sections.summary.content}</p></div>
        ) : null;
      case 'experience':
        return sections.experience.length > 0 ? (
          <div key={key} className="mb-4">
            <SectionTitle text="工作经历" />
            {sections.experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline"><span className="font-semibold">{exp.company}</span><span className="text-xs text-gray-400">{exp.startDate} ~ {exp.endDate}</span></div>
                {exp.position && <p className="text-sm text-gray-500 italic">{exp.position}</p>}
                <p className="text-sm text-gray-600">{exp.description}</p>
                {exp.highlights.length > 0 && <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">{exp.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
              </div>
            ))}
          </div>
        ) : null;
      case 'projects':
        return sections.projects.length > 0 ? (
          <div key={key} className="mb-4">
            <SectionTitle text="项目经历" />
            {sections.projects.map((proj, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline"><span className="font-semibold">{proj.name}</span><span className="text-xs text-gray-400">{proj.technologies.join(', ')}</span></div>
                <p className="text-sm text-gray-600">{proj.description}</p>
                {proj.highlights.length > 0 && <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">{proj.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
              </div>
            ))}
          </div>
        ) : null;
      case 'education':
        return sections.education.length > 0 ? (
          <div key={key} className="mb-4">
            <SectionTitle text="教育背景" />
            {sections.education.map((edu, i) => (
              <div key={i} className="flex justify-between text-sm"><span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span><span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span></div>
            ))}
          </div>
        ) : null;
      default:
        if (key.startsWith('custom_')) {
          const field = customFields.find(f => f.key === key);
          if (field && field.content.trim() && field.content.length >= 100) {
            return (
              <div key={key} className="mb-4">
                <SectionTitle text={field.title} />
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{field.content}</p>
              </div>
            );
          }
        }
        return null;
    }
  };

  const renderSidebar = (key: string) => {
    switch (key) {
      case 'skills':
        return sections.skills.length > 0 ? (
          <div key={key} className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">技能专长</h3>
            {sections.skills.map((sk, i) => (
              <div key={i} className="mb-1">
                <span className="text-xs font-medium">{sk.category}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">{sk.items.map((item: any, j: number) => (
    <span key={j} className="inline-block text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: c + '20', color: c }}>
      {sName(item)}{sLevel(item) ? <span className="ml-0.5 opacity-60">·{sLevel(item)}</span> : null}
    </span>
  ))}</div>
              </div>
            ))}
          </div>
        ) : null;
      case 'languages':
        return !compressSettings.hide && sections.languages.length > 0 ? (
          <div key={key} className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">语言</h3>
            {sections.languages.map((lang, i) => <div key={i} className="text-xs text-gray-700">{lang.name} · {lang.level}</div>)}
          </div>
        ) : null;
      case 'certificates':
        return !compressSettings.hide && sections.certificates.length > 0 ? (
          <div key={key} className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">证书</h3>
            {sections.certificates.map((cert, i) => <div key={i} className="text-xs text-gray-700 mb-1"><div>{cert.name}</div><div className="text-gray-400">{cert.issuer} ({cert.date})</div></div>)}
          </div>
        ) : null;
      default:
        if (key.startsWith('custom_')) {
          const field = customFields.find(f => f.key === key);
          if (field && field.content.trim() && field.content.length < 100) {
            return (
              <div key={key} className="mb-4">
                <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">{field.title}</h3>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{field.content}</p>
              </div>
            );
          }
        }
        return null;
    }
  };

  // Split order: main content sections go left, sidebar sections go right
  const sidebarKeys = ['skills', 'languages', 'certificates'];
  const mainKeys = sectionOrder.filter(k => !sidebarKeys.includes(k));

  return (
    <div className={`bg-white shadow-lg mx-auto flex ${compressSettings.compact ? 'text-[10pt] leading-tight' : 'text-[11pt] leading-normal'}`}
      style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Left - Main Content */}
      <div className="flex-1" style={{ padding: '12mm' }}>
        {/* Header */}
        <div className="pb-3 mb-4" style={{ borderBottom: `2px solid ${c}` }}>
          <h1 className="text-2xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
          {sections.personal.title && <p style={{ color: c }} className="mt-0.5">{sections.personal.title}</p>}
        </div>
        {mainKeys.map(renderMain)}
      </div>

      {/* Right - Sidebar */}
      <div style={{ width: '180px', padding: '12mm 8mm', backgroundColor: c + '12' }}>
        {/* Photo */}
        {sections.personal.photo && (
          <div className="flex justify-center mb-4"><img src={`/photo/${sections.personal.photo}`} className="w-24 h-24 rounded-full object-cover" style={{ border: `2px solid ${c}` }} alt="photo" /></div>
        )}
        {/* Contact */}
        <div className="mb-4">
          <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">联系方式</h3>
          <div className="text-xs space-y-1">
            {sections.personal.email && <div className="text-gray-700 break-all">✉ {sections.personal.email}</div>}
            {sections.personal.phone && <div className="text-gray-700">📞 {sections.personal.phone}</div>}
            {sections.personal.website && <div className="text-gray-700">🔗 {sections.personal.website}</div>}
          </div>
        </div>
        {/* Sidebar sections */}
        {sectionOrder.filter(k => sidebarKeys.includes(k)).map(renderSidebar)}
        {/* Short custom sections in sidebar */}
        {sectionOrder.filter(k => k.startsWith('custom_')).map(renderSidebar)}
      </div>
    </div>
  );
}
