import { useResumeStore } from '../../stores/useResumeStore';

export default function CompactTemplate() {
  const resume = useResumeStore((s) => s.resume);
  if (!resume) return null;
  const { sections, compressSettings } = resume;

  return (
    <div className={`bg-white shadow-lg mx-auto ${compressSettings.compact ? 'text-[9pt] leading-tight' : 'text-[10pt] leading-snug'}`}
      style={{ width: '210mm', minHeight: '297mm', padding: '12mm 15mm' }}>
      {/* Photo — centered at top */}
      {sections.personal.photo && (
        <div className="flex justify-center mb-3">
          <img src={`/photo/${sections.personal.photo}`} className="w-20 h-20 rounded-full object-cover border-2 border-purple-500" alt="photo" />
        </div>
      )}

      {/* Name + Title — centered */}
      <div className="text-center pb-2 mb-3" style={{ borderBottom: '2px solid #7c3aed' }}>
        <h1 className="text-xl font-bold text-gray-900">{sections.personal.name || '姓名'}</h1>
        {sections.personal.title && <p className="text-purple-600 mt-0.5">{sections.personal.title}</p>}
        <div className="text-xs text-gray-500 mt-1 flex justify-center gap-3">
          {sections.personal.email && <span>✉ {sections.personal.email}</span>}
          {sections.personal.phone && <span>📞 {sections.personal.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {sections.summary.content && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>个人摘要</h2>
          <p className="text-xs text-gray-600">{sections.summary.content}</p>
        </div>
      )}

      {/* Experience */}
      {sections.experience.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>工作经历</h2>
          {sections.experience.map((exp, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-xs">{exp.company}</span>
                <span className="text-[9px] text-gray-400">{exp.startDate} ~ {exp.endDate}</span>
              </div>
              {exp.position && <p className="text-xs text-gray-500">{exp.position}</p>}
              <p className="text-xs text-gray-600">{exp.description}</p>
              {exp.highlights.length > 0 && !compressSettings.trim && (
                <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">
                  {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
              {exp.highlights.length > 0 && compressSettings.trim && (
                <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">
                  {exp.highlights.slice(0, 3).map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {sections.projects.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>项目经历</h2>
          {sections.projects.map((proj, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-xs">{proj.name}</span>
                <span className="text-[9px] text-gray-400">{proj.technologies.join(', ')}</span>
              </div>
              <p className="text-xs text-gray-600">{proj.description}</p>
              {proj.highlights.length > 0 && !compressSettings.trim && (
                <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">
                  {proj.highlights.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
              {proj.highlights.length > 0 && compressSettings.trim && (
                <ul className="list-disc pl-4 text-xs text-gray-600 mt-0.5">
                  {proj.highlights.slice(0, 3).map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {sections.education.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>教育背景</h2>
          {sections.education.map((edu, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span><strong>{edu.school}</strong> · {edu.major} · {edu.degree}</span>
              <span className="text-gray-400">{edu.startDate} ~ {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {sections.skills.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>技能专长</h2>
          {sections.skills.map((sk, i) => (
            <div key={i} className="mb-0.5">
              <span className="text-xs font-medium">{sk.category}：</span>
              {sk.items.map((item, j) => (
                <span key={j} className="inline-block bg-purple-50 text-purple-700 text-[9px] px-1.5 py-0.5 rounded mr-0.5 mb-0.5">{item}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Certificates & Languages — hidden if compress.hide */}
      {!compressSettings.hide && sections.certificates.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>证书</h2>
          {sections.certificates.map((cert, i) => (
            <div key={i} className="text-xs">{cert.name} · {cert.issuer} ({cert.date})</div>
          ))}
        </div>
      )}
      {!compressSettings.hide && sections.languages.length > 0 && (
        <div className="mb-3">
          <h2 className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ borderBottom: '1px solid #e9d5ff' }}>语言</h2>
          <div className="flex gap-1.5 flex-wrap">
            {sections.languages.map((lang, i) => (
              <span key={i} className="bg-purple-50 text-purple-700 text-[9px] px-1.5 py-0.5 rounded-full">{lang.name} · {lang.level}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
