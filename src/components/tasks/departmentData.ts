export interface DepartmentMetadata {
  id: string;
  name: string;
  code: string;
  mentorName: string;
  mentorId: string;
  mentorEmail: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  accentBg: string;
  desc: string;
}

export const CANONICAL_DEPARTMENTS: DepartmentMetadata[] = [
  {
    id: 'case-studies',
    name: 'Case Studies',
    code: 'CS',
    mentorName: 'Ayush Gaikwad',
    mentorId: 'FC-EMP-2026-003',
    mentorEmail: 'ayush.gaikwad@forenclue.in',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    borderCol: 'border-emerald-200',
    accentBg: 'bg-emerald-600',
    desc: 'Forensic investigations, crime scene reconstruction, cold case archives & timeline profiling.'
  },
  {
    id: 'research',
    name: 'Research',
    code: 'RS',
    mentorName: 'Mrunmayee Bodhe',
    mentorId: 'FC-EMP-2026-002',
    mentorEmail: 'mrunmayee.bodhe@forenclue.in',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    borderCol: 'border-blue-200',
    accentBg: 'bg-blue-600',
    desc: 'Scientific literature review, forensic methodology analysis, toxicology & evidence validation.'
  },
  {
    id: 'social-media',
    name: 'Social Media Management',
    code: 'SM',
    mentorName: 'Tejas Tapse',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'pink',
    badgeBg: 'bg-pink-50 text-pink-800 border-pink-200',
    badgeText: 'text-pink-700',
    borderCol: 'border-pink-200',
    accentBg: 'bg-pink-600',
    desc: 'Digital outreach, community engagement, brand campaigns, content scheduling & educational drives.'
  },
  {
    id: 'event-management',
    name: 'Event Management',
    code: 'EM',
    mentorName: 'Mrunmayee Bodhe',
    mentorId: 'FC-EMP-2026-002',
    mentorEmail: 'mrunmayee.bodhe@forenclue.in',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    badgeText: 'text-purple-700',
    borderCol: 'border-purple-200',
    accentBg: 'bg-purple-600',
    desc: 'Workshops, expert keynote webinars, technical bootcamps & national forensic symposia.'
  },
  {
    id: 'creative-graphics',
    name: 'Creative & Graphics',
    code: 'CG',
    mentorName: 'Tejas Tapse',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeText: 'text-rose-700',
    borderCol: 'border-rose-200',
    accentBg: 'bg-rose-600',
    desc: 'Visual diagrams, evidence infographics, presentation slide decks, branding & UI designs.'
  },
  {
    id: 'cyber-forensics',
    name: 'Cyber & Digital Forensics',
    code: 'CF',
    mentorName: 'Tejas Tapse',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-700',
    borderCol: 'border-indigo-200',
    accentBg: 'bg-indigo-600',
    desc: 'Digital evidence examination, volatile memory triage, network packet analysis & malware investigation.'
  },
  {
    id: 'campus-ambassadors',
    name: 'Campus Ambassadors',
    code: 'CA',
    mentorName: 'Executive Council (All Super Admins)',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeText: 'text-amber-800',
    borderCol: 'border-amber-200',
    accentBg: 'bg-amber-600',
    desc: 'National student outreach, university relations, forensic masterclass promotions & campus initiatives.'
  },
  {
    id: 'mentors',
    name: 'Mentors',
    code: 'MN',
    mentorName: 'Rajat Pithadia',
    mentorId: 'FC-MEN-26-001',
    mentorEmail: 'rajat.pithadia@forenclue.in',
    color: 'teal',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    badgeText: 'text-teal-700',
    borderCol: 'border-teal-200',
    accentBg: 'bg-teal-600',
    desc: 'Senior forensic mentorship, specialized advisory, research guidance, and deliverable review.'
  },
  {
    id: 'executive-admin',
    name: 'Executive & Administration',
    code: 'EA',
    mentorName: 'Tejas Tapse',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'slate',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'text-slate-800',
    borderCol: 'border-slate-200',
    accentBg: 'bg-slate-800',
    desc: 'Workspace leadership, security governance, operational allotting & QA sign-off oversight.'
  }
];

export function normalizeDepartmentName(dept?: string | null): string {
  if (!dept) return 'Case Studies';
  const clean = dept.trim().toLowerCase();
  if (clean.includes('mentor')) return 'Mentors';
  if (clean.includes('case stud')) return 'Case Studies';
  if (clean.includes('research')) return 'Research';
  if (clean.includes('social media')) return 'Social Media Management';
  if (clean.includes('event')) return 'Event Management';
  if (clean.includes('creative') || clean.includes('design') || clean.includes('graphics')) return 'Creative & Graphics';
  if (clean.includes('cyber') || clean.includes('forensic')) return 'Cyber & Digital Forensics';
  if (clean.includes('campus') || clean.includes('ambassador')) return 'Campus Ambassadors';
  if (clean.includes('admin') || clean.includes('executive')) return 'Executive & Administration';
  return dept.trim();
}

export function getDepartmentMetadata(deptName?: string | null): DepartmentMetadata {
  const norm = normalizeDepartmentName(deptName);
  const found = CANONICAL_DEPARTMENTS.find(d => d.name.toLowerCase() === norm.toLowerCase());
  return found || {
    id: 'general',
    name: deptName || 'General Workspace',
    code: 'GW',
    mentorName: 'Tejas Tapse',
    mentorId: 'FC-EMP-2026-001',
    mentorEmail: 'ttapse12@gmail.com',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    borderCol: 'border-blue-200',
    accentBg: 'bg-blue-600',
    desc: 'General workspace and cross-functional operations.'
  };
}
