export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  title: string;
  website?: string;
  address?: string;
  photo: string;
}

export interface Summary {
  content: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface Project {
  name: string;
  role: string;
  technologies: string[];
  description: string;
  highlights: string[];
  link?: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface Certificate {
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface CustomSection {
  key: string;
  title: string;
  content: string;
}

export interface ResumeSections {
  personal: PersonalInfo;
  summary: Summary;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillCategory[];
  certificates: Certificate[];
  languages: Language[];
  customFields: CustomSection[];
}

export interface CompressSettings {
  compact: boolean;
  trim: boolean;
  hide: boolean;
}

export interface ResumeData {
  id: string;
  name: string;
  title: string;
  updatedAt: string;
  template: string;
  themeColor: string;
  compressSettings: CompressSettings;
  sectionOrder: string[];
  sections: ResumeSections;
}

export interface ResumeListItem {
  id: string;
  name: string;
  title: string;
  template: string;
  updatedAt: string;
}

export interface TemplateMeta {
  id: string;
  label: string;
  description: string;
  photoPosition: string;
  photoSize: { width: number; height: number };
  pageMargin: string;
  primaryColor: string;
}
