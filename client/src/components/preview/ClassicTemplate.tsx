import { useResumeStore } from '../../stores/useResumeStore';

export default function ClassicTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings, themeColor } = resume;
  const c = themeColor || '#2563eb';
  const customFields = sections.customFields || [];

  const SectionTitle = ({ label, text }: { label: string; text: string }) => (
    <h2 style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13pt', fontWeight: 700, color: '#1e293b', paddingBottom: '4px', marginBottom: '8px' }}>
      <span style={{ color: c }}>{label}</span>{text}
    </h2>
  );

  return (
    <div
      className={`bg-white shadow-lg mx-auto ${compressSettings.compact ? 'text-[10pt] leading-tight' : 'text-[11pt] leading-normal'}`}
      style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
    >
      {/* Header */}
      <div className="flex items-center gap-5 pb-4 mb-4" style={{ borderBottom: `3px solid ${c}` }}>
        {sections.personal.photo && (
          <img src={`/photo/${sections.personal.photo}`} className="w-24 h-24 rounded-full object-cover" style={{ border: `2px solid ${c}` }} alt="" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
          {sections.personal.title && <p style={{ color: c }} className="mt-1">{sections.personal.title}</p>}
          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
            {sections.personal.email && <span>✉ {sections.personal.email}</span>}
            {sections.personal.phone && <span>📞 {sections.personal.phone}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {sections.summary.content && (
        <div className="mb-4">
          <SectionTitle label="个人" text="摘要" />
          <p className="text-sm text-gray-600">{sections.summary.content}</p>
        </div>
      )}

      {/* Experience */}
      {sections.experience.length > 0 && (
        <div className="mb-4">
          <SectionTitle label="工作" text="经历" />
          {sections.experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{exp.company}</span>
                <span className="text-xs text-gray-400">{exp.startDate} ~ {exp.endDate}</span>
              </div>
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
          <SectionTitle label="项目" text="经历" />
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
          <SectionTitle label="教育" text="背景" />
          {sections.education.map((edu, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span>
              <span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {sections.skills.length > 0 && (
        <div className="mb-4">
          <SectionTitle label="技能" text="专长" />
          {sections.skills.map((sk, i) => (
            <div key={i} className="mb-1">
              <span className="text-sm font-medium">{sk.category}：</span>
              {sk.items.map((item, j) => (
                <span key={j} className="inline-block text-xs px-2 py-0.5 rounded-full mr-1 mb-1" style={{ backgroundColor: c + '15', color: c }}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Custom Fields */}
      {customFields.filter(f => f.content.trim()).map((field) => (
        !compressSettings.hide && (
          <div key={field.key} className="mb-4">
            <SectionTitle label="" text={field.title} />
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{field.content}</p>
          </div>
        )
      ))}

      {/* Certificates */}
      {!compressSettings.hide && sections.certificates.length > 0 && (
        <div className="mb-4">
          <SectionTitle label="" text="证书" />
          {sections.certificates.map((cert, i) => (
            <div key={i} className="text-sm">{cert.name} · {cert.issuer} ({cert.date})</div>
          ))}
        </div>
      )}

      {/* Languages */}
      {!compressSettings.hide && sections.languages.length > 0 && (
        <div className="mb-4">
          <SectionTitle label="" text="语言" />
          <div className="flex gap-2 flex-wrap">
            {sections.languages.map((lang, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c + '15', color: c }}>{lang.name} · {lang.level}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
