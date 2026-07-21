import { useResumeStore } from '../../stores/useResumeStore';

export default function ModernTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings, themeColor } = resume;
  const c = themeColor || '#0891b2';
  const customFields = sections.customFields || [];

  const SectionTitle = ({ text }: { text: string }) => (
    <h2 style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a', borderBottom: `2px solid ${c}`, paddingBottom: '3px', marginBottom: '6px' }}>{text}</h2>
  );

  return (
    <div className={`bg-white shadow-lg mx-auto flex ${compressSettings.compact ? 'text-[10pt] leading-tight' : 'text-[11pt] leading-normal'}`}
      style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Left — Main Content */}
      <div className="flex-1" style={{ padding: '12mm' }}>
        {/* Header */}
        <div className="pb-3 mb-4" style={{ borderBottom: `2px solid ${c}` }}>
          <h1 className="text-2xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
          {sections.personal.title && <p style={{ color: c }} className="mt-0.5">{sections.personal.title}</p>}
        </div>

        {/* Summary */}
        {sections.summary.content && (
          <div className="mb-4">
            <h2 style={{ color: c }} className="font-bold text-sm uppercase tracking-wide mb-1.5">个人摘要</h2>
            <p className="text-sm text-gray-600">{sections.summary.content}</p>
          </div>
        )}

        {/* Experience */}
        {sections.experience.length > 0 && (
          <div className="mb-4">
            <SectionTitle text="工作经历" />
            {sections.experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">{exp.company}</span>
                  <span className="text-xs text-gray-400">{exp.startDate} ~ {exp.endDate}</span>
                </div>
                {exp.position && <p className="text-sm text-gray-500 italic">{exp.position}</p>}
                <p className="text-sm text-gray-600">{exp.description}</p>
                {exp.highlights.length > 0 && (
                  <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">
                    {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {sections.projects.length > 0 && (
          <div className="mb-4">
            <SectionTitle text="项目经历" />
            {sections.projects.map((proj, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">{proj.name}</span>
                  <span className="text-xs text-gray-400">{proj.technologies.join(', ')}</span>
                </div>
                <p className="text-sm text-gray-600">{proj.description}</p>
                {proj.highlights.length > 0 && (
                  <ul className="list-disc pl-4 text-sm text-gray-600 mt-1">
                    {proj.highlights.map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {sections.education.length > 0 && (
          <div className="mb-4">
            <SectionTitle text="教育背景" />
            {sections.education.map((edu, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span>
                <span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom fields (long content in main area) */}
        {customFields.filter(f => f.content.trim() && f.content.length >= 100).map(field => (
          <div key={field.key} className="mb-4">
            <SectionTitle text={field.title} />
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{field.content}</p>
          </div>
        ))}
      </div>

      {/* Right — Sidebar */}
      <div style={{ width: '180px', padding: '12mm 8mm', backgroundColor: c + '12' }}>
        {/* Photo */}
        {sections.personal.photo && (
          <div className="flex justify-center mb-4">
            <img src={`/photo/${sections.personal.photo}`} className="w-24 h-24 rounded-full object-cover" style={{ border: `2px solid ${c}` }} alt="photo" />
          </div>
        )}

        {/* Contact */}
        <div className="mb-4">
          <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">联系方式</h3>
          <div className="text-xs space-y-1">
            {sections.personal.email && <div className="text-gray-700 break-all">✉ {sections.personal.email}</div>}
            {sections.personal.phone && <div className="text-gray-700">📞 {sections.personal.phone}</div>}
            {sections.personal.website && <div className="text-gray-700">🔗 {sections.personal.website}</div>}
            {sections.personal.address && <div className="text-gray-700">📍 {sections.personal.address}</div>}
          </div>
        </div>

        {/* Skills */}
        {sections.skills.length > 0 && (
          <div className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">技能专长</h3>
            {sections.skills.map((sk, i) => (
              <div key={i} className="mb-1">
                <span className="text-xs font-medium">{sk.category}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {sk.items.map((item, j) => (
                    <span key={j} className="inline-block text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: c + '20', color: c }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Fields in sidebar (if short) */}
        {customFields.filter(f => f.content.trim() && f.content.length < 100).slice(0, 2).map(field => (
          !compressSettings.hide && (
            <div key={field.key} className="mb-4">
              <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">{field.title}</h3>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{field.content}</p>
            </div>
          )
        ))}

        {/* Languages — hidden if compress.hide */}
        {!compressSettings.hide && sections.languages.length > 0 && (
          <div className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">语言</h3>
            {sections.languages.map((lang, i) => (
              <div key={i} className="text-xs text-gray-700">{lang.name} · {lang.level}</div>
            ))}
          </div>
        )}

        {/* Certificates — hidden if compress.hide */}
        {!compressSettings.hide && sections.certificates.length > 0 && (
          <div className="mb-4">
            <h3 style={{ color: c, borderBottom: `1px solid ${c}` }} className="font-bold text-xs uppercase tracking-wide mb-1.5">证书</h3>
            {sections.certificates.map((cert, i) => (
              <div key={i} className="text-xs text-gray-700 mb-1">
                <div>{cert.name}</div>
                <div className="text-gray-400">{cert.issuer} ({cert.date})</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
