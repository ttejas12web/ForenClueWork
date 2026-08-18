import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Briefcase, 
  Mail, 
  Search,
  ChevronRight,
  Send,
  Crown,
  UserCheck,
  ExternalLink,
  User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

interface TeamMember {
  id: number;
  forenclueId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  active?: boolean;
}

interface DepartmentInfo {
  name: string;
  desc: string;
  code: string;
  mentorName: string;
  mentorId: string;
  mentorEmail: string;
  color: string;
  badgeColor: string;
  groupId?: number;
}

export const Teams = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('Creative & Design');
  const [searchMember, setSearchMember] = useState('');

  const departments: DepartmentInfo[] = [
    { 
      name: 'Creative & Design', 
      desc: 'Visual evidence diagrams, case presentation layouts, UI design, infographics, and public communication assets.', 
      code: 'CD', 
      mentorName: 'Tejas Tapse',
      mentorId: 'FC-EMP-2026-001',
      mentorEmail: 'tejas.tapse@forenclue.com',
      color: 'bg-rose-600',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    { 
      name: 'Case Study', 
      desc: 'Forensic case study investigations, incident post-mortems, forensic timelines, and historical case archives.', 
      code: 'CS', 
      mentorName: 'Ayush Gaikwad',
      mentorId: 'FC-EMP-2026-002',
      mentorEmail: 'ayush.gaikwad@forenclue.com',
      color: 'bg-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      name: 'Research', 
      desc: 'Scientific literature review, forensic methodology analysis, evidence validation, and laboratory findings.', 
      code: 'RS', 
      mentorName: 'Purva Bawsar',
      mentorId: 'FC-EMP-2026-003',
      mentorEmail: 'purva.bawsar@forenclue.com',
      color: 'bg-blue-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      name: 'Events & Webinars', 
      desc: 'Workshops, expert keynote webinars, technical training bootcamps, and educational community sessions.', 
      code: 'EW', 
      mentorName: 'Mrunmayee Bodhe',
      mentorId: 'FC-MNT-2026-004',
      mentorEmail: 'mrunmayee.bodhe@forenclue.com',
      color: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    { 
      name: 'Cyber & Digital Forensics', 
      desc: 'Digital evidence examination, volatile memory triage, network packet analysis, and malware investigation.', 
      code: 'CF', 
      mentorName: 'Alex Sterling',
      mentorId: 'FC-MNT-2026-005',
      mentorEmail: 'alex.sterling@forenclue.com',
      color: 'bg-indigo-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
  ];

  useEffect(() => {
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMembers(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load department users:", err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const getDeptMembers = (deptName: string) => {
    return members.filter(m => m.department === deptName);
  };

  const activeDeptData = departments.find(d => d.name === selectedDept) || departments[0];

  const activeDeptMembers = members.filter(m => {
    const matchesDept = m.department === selectedDept;
    const matchesSearch = searchMember 
      ? m.name.toLowerCase().includes(searchMember.toLowerCase()) || 
        m.forenclueId.toLowerCase().includes(searchMember.toLowerCase()) ||
        m.email.toLowerCase().includes(searchMember.toLowerCase())
      : true;
    return matchesDept && matchesSearch;
  });

  const handleViewRoster = (deptName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDept(deptName);
    const rosterEl = document.getElementById('department-roster-section');
    if (rosterEl) {
      rosterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Departments & Teams</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational department units, member rosters, and direct mentor communication channels.
          </p>
        </div>

        <Link
          to={`/chat?group=${encodeURIComponent(selectedDept)}`}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto min-h-[40px]"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Open Department Chat</span>
        </Link>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {departments.map((dept) => {
          const deptCount = getDeptMembers(dept.name).length;
          const isSelected = selectedDept === dept.name;

          return (
            <div 
              key={dept.name} 
              id={`dept-card-${dept.code}`}
              onClick={() => handleViewRoster(dept.name)}
              className={`bg-white rounded-2xl shadow-2xs border p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-11 w-11 ${dept.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs`}>
                    {dept.code}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${dept.badgeColor}`}>
                    {deptCount} {deptCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{dept.desc}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px] font-medium">
                    <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-slate-500">Lead Mentor:</span>
                    <span className="font-bold text-slate-900">{dept.mentorName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    id={`view-roster-btn-${dept.code}`}
                    onClick={(e) => handleViewRoster(dept.name, e)}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    title={`View roster of members in ${dept.name}`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>View Roster</span>
                  </button>

                  <Link
                    to={`/chat?directUser=${encodeURIComponent(dept.mentorId)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    title={`Open 1-on-1 personal chat with ${dept.mentorName}`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Mentor</span>
                  </Link>

                  <Link
                    to={`/chat?group=${encodeURIComponent(dept.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    title={`Open ${dept.name} Group Chat`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Chat</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Department Details & Members Section */}
      <div 
        id="department-roster-section" 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5 scroll-mt-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`h-11 w-11 rounded-xl ${activeDeptData.color} text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0`}>
              {activeDeptData.code}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-lg text-slate-900">{selectedDept}</h2>
                <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200">
                  {getDeptMembers(selectedDept).length} Assigned
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeDeptData.desc}
              </p>
            </div>
          </div>

          {/* Department Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/chat?directUser=${encodeURIComponent(activeDeptData.mentorId)}`}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>Message {activeDeptData.mentorName} (Mentor)</span>
            </Link>

            <Link
              to={`/chat?group=${encodeURIComponent(selectedDept)}`}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Open {selectedDept} Chat Group</span>
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />
            </Link>
          </div>
        </div>

        {/* Lead Mentor Spotlight Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-slate-900">{activeDeptData.mentorName}</h4>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  Lead Mentor
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {activeDeptData.mentorId} • {activeDeptData.mentorEmail}
              </p>
            </div>
          </div>

          <Link
            to={`/chat?directUser=${encodeURIComponent(activeDeptData.mentorId)}`}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open 1-on-1 Profile Chat</span>
          </Link>
        </div>

        {/* Member Search and List */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <h3 className="text-sm font-bold text-slate-800">
              Assigned Department Members ({activeDeptMembers.length})
            </h3>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name or ID..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading department members...</div>
          ) : activeDeptMembers.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UserCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No members found in {selectedDept}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Members can be assigned to {selectedDept} via the Admin Console or during user registration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeDeptMembers.map((member) => (
                <div 
                  key={member.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-start justify-between space-x-3"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          member.role === 'SUPER_ADMIN' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : member.role === 'MENTOR'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-blue-600 mt-0.5">
                        {member.forenclueId}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/chat?directUser=${encodeURIComponent(member.forenclueId)}`}
                    title={`Open 1-on-1 chat with ${member.name}`}
                    className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
