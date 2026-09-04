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
  User,
  PlusCircle,
  RefreshCw,
  Sparkles,
  GraduationCap,
  ShieldAlert,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { fetchAllUsers, subscribeToUsers, FirestoreUser } from '../lib/firestoreService';
import { UserNetworkTag } from '../components/UserNetworkTag';

interface TeamMember {
  id: string | number;
  forenclueId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
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
  isSpecial?: boolean;
  tag?: string;
  groupId?: number;
}

export const Teams = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('Creative & Graphics');
  const [searchMember, setSearchMember] = useState('');

  const departments: DepartmentInfo[] = [
    { 
      name: 'Creative & Graphics', 
      desc: 'Visual evidence diagrams, case presentation layouts, UI design, infographics, and public communication assets.', 
      code: 'CD', 
      mentorName: 'Tejas Tapse',
      mentorId: 'FC-EMP-2026-001',
      mentorEmail: 'ttapse12@gmail.com',
      color: 'bg-rose-600',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    { 
      name: 'Case Study', 
      desc: 'Forensic case study investigations, incident post-mortems, forensic timelines, and historical case archives.', 
      code: 'CS', 
      mentorName: 'Ayush Gaikwad',
      mentorId: 'FC-EMP-2026-003',
      mentorEmail: 'ayush.gaikwad@forenclue.in',
      color: 'bg-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      name: 'Research', 
      desc: 'Scientific literature review, forensic methodology analysis, evidence validation, and laboratory findings.', 
      code: 'RS', 
      mentorName: 'Mrunmayee Bodhe',
      mentorId: 'FC-EMP-2026-002',
      mentorEmail: 'mrunmayee.bodhe@forenclue.in',
      color: 'bg-blue-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      name: 'Events & Management', 
      desc: 'Workshops, expert keynote webinars, technical training bootcamps, and educational community sessions.', 
      code: 'EW', 
      mentorName: 'Mrunmayee Bodhe',
      mentorId: 'FC-EMP-2026-002',
      mentorEmail: 'mrunmayee.bodhe@forenclue.in',
      color: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    { 
      name: 'Cyber & Digital Forensics', 
      desc: 'Digital evidence examination, volatile memory triage, network packet analysis, and malware investigation.', 
      code: 'CF', 
      mentorName: 'Tejas Tapse',
      mentorId: 'FC-EMP-2026-001',
      mentorEmail: 'ttapse12@gmail.com',
      color: 'bg-indigo-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    { 
      name: 'Campus Ambassadors', 
      desc: 'National student outreach, university relations, forensic masterclass promotions, campus taskforces, and student community initiatives.', 
      code: 'CA', 
      mentorName: 'All Super Admins (Executive Council)',
      mentorId: 'FC-EMP-2026-001',
      mentorEmail: 'ttapse12@gmail.com',
      color: 'bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-600',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      isSpecial: true,
      tag: 'Executive Super Admin Mentorship'
    },
  ];

  const loadMembersData = async () => {
    try {
      // 1. Direct Firestore Fetch for guaranteed availability
      const firestoreUsers = await fetchAllUsers();
      if (firestoreUsers && firestoreUsers.length > 0) {
        setMembers(firestoreUsers as any);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Direct Firestore users fetch notice:", e);
    }

    // 2. Fallback via apiFetch
    try {
      const res = await apiFetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
        }
      }
    } catch (err) {
      console.error("Failed to load department users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembersData();

    // Subscribe to realtime updates
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToUsers((liveUsers) => {
        if (liveUsers && liveUsers.length > 0) {
          setMembers(liveUsers as any);
          setLoading(false);
        }
      });
    } catch (err) {
      console.warn("Live users subscription fallback:", err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  const superAdminMentors = members.filter(m => m.role === 'SUPER_ADMIN' && m.active !== false);
  const effectiveSuperAdminMentors = superAdminMentors.length > 0 ? superAdminMentors : [
    {
      id: 'emp_001',
      forenclueId: 'FC-EMP-2026-001',
      name: 'Tejas Tapse',
      email: 'ttapse12@gmail.com',
      role: 'SUPER_ADMIN',
      designation: 'Founder & Lead Forensic Specialist | Executive Mentor',
      active: true
    }
  ];

  const getDeptMembers = (deptName: string): TeamMember[] => {
    const isCampusAmbassadors = deptName.toLowerCase().includes('campus ambassador');
    const deptInfo = departments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
    const seen = new Set<string>();

    return members.filter(m => {
      if (!m || !m.name) return false;
      const memId = String(m.forenclueId || m.id || m.email);
      if (seen.has(memId)) return false;

      // 1. Department match (case-insensitive & trimmed)
      const userDeptClean = (m.department || '').trim().toLowerCase();
      const matchesDeptName = userDeptClean === deptName.trim().toLowerCase() ||
        (isCampusAmbassadors && (userDeptClean.includes('campus ambassador') || userDeptClean.includes('ambassador')));

      // 2. Role match for Campus Ambassador
      const matchesRole = isCampusAmbassadors && m.role === 'CAMPUS_AMBASSADOR';

      // 3. Mentor designated for this department (standard single mentor)
      const matchesMentor = !isCampusAmbassadors && deptInfo && (
        (m.forenclueId && m.forenclueId.trim().toUpperCase() === deptInfo.mentorId.trim().toUpperCase()) ||
        (m.email && m.email.trim().toLowerCase() === deptInfo.mentorEmail.trim().toLowerCase())
      );

      if (matchesDeptName || matchesRole || matchesMentor) {
        seen.add(memId);
        return true;
      }
      return false;
    });
  };

  const activeDeptData = departments.find(d => d.name === selectedDept) || departments[0];

  const activeDeptMembers = getDeptMembers(selectedDept).filter(m => {
    if (!searchMember.trim()) return true;
    const query = searchMember.toLowerCase().trim();
    return (
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.forenclueId && m.forenclueId.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      (m.role && m.role.toLowerCase().includes(query)) ||
      (m.designation && m.designation.toLowerCase().includes(query))
    );
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

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadMembersData}
            title="Refresh member lists"
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'MENTOR') && (
            <Link
              to="/admin"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Manage Members</span>
            </Link>
          )}

          <Link
            to={`/chat?group=${encodeURIComponent(selectedDept)}`}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer min-h-[38px]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Department Chat</span>
          </Link>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {departments.map((dept) => {
          const deptCount = getDeptMembers(dept.name).length;
          const isSelected = selectedDept === dept.name;
          const isSpecialDept = dept.isSpecial || dept.name === 'Campus Ambassadors';

          return (
            <div 
              key={dept.name} 
              id={`dept-card-${dept.code}`}
              onClick={() => handleViewRoster(dept.name)}
              className={`rounded-2xl shadow-2xs border p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden ${
                isSpecialDept
                  ? isSelected
                    ? 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 border-amber-300/80 hover:border-amber-400 hover:shadow-xs'
                  : isSelected 
                    ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Special Campus Ambassadors Ribbon */}
              {isSpecialDept && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                    <Sparkles className="h-3 w-3 text-amber-200 animate-pulse" />
                    All Super Admins Mentorship
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-11 w-11 ${dept.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs`}>
                    {isSpecialDept ? <GraduationCap className="h-5 w-5" /> : dept.code}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${dept.badgeColor}`}>
                    {deptCount} {deptCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <h3 className={`text-base font-bold ${isSpecialDept ? 'text-amber-950' : 'text-slate-900'}`}>{dept.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{dept.desc}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px] font-medium">
                    {isSpecialDept ? (
                      <Shield className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                    ) : (
                      <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-slate-500">
                      {isSpecialDept ? 'Department Mentors:' : 'Lead Mentor:'}
                    </span>
                    <span className={`font-bold ${isSpecialDept ? 'text-amber-900' : 'text-slate-900'}`}>
                      {isSpecialDept ? 'All Super Admins' : dept.mentorName}
                    </span>
                  </div>
                </div>

                {/* Mentors preview list for special department */}
                {isSpecialDept && effectiveSuperAdminMentors.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {effectiveSuperAdminMentors.map((admin) => (
                      <span 
                        key={String(admin.id || admin.forenclueId)}
                        className="text-[10px] bg-amber-100/80 text-amber-900 font-semibold px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1"
                      >
                        <Crown className="h-2.5 w-2.5 text-amber-600" />
                        {admin.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    id={`view-roster-btn-${dept.code}`}
                    onClick={(e) => handleViewRoster(dept.name, e)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                      isSpecialDept
                        ? 'bg-amber-100/70 hover:bg-amber-200 text-amber-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={`View roster of members in ${dept.name}`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>View Roster</span>
                  </button>

                  <Link
                    to={isSpecialDept 
                      ? `/chat?directUser=${encodeURIComponent(effectiveSuperAdminMentors[0]?.forenclueId || 'FC-EMP-2026-001')}`
                      : `/chat?directUser=${encodeURIComponent(dept.mentorId)}`
                    }
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                      isSpecialDept
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                        : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700'
                    }`}
                    title={isSpecialDept ? 'Open chat with Lead Super Admin Mentor' : `Open 1-on-1 personal chat with ${dept.mentorName}`}
                  >
                    {isSpecialDept ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    <span>{isSpecialDept ? 'Super Admins' : 'Mentor'}</span>
                  </Link>

                  <Link
                    to={`/chat?group=${encodeURIComponent(dept.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                      isSpecialDept
                        ? 'bg-amber-100/70 hover:bg-amber-200 text-amber-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
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
        className={`rounded-2xl border shadow-2xs p-5 sm:p-6 space-y-5 scroll-mt-6 ${
          activeDeptData.name === 'Campus Ambassadors'
            ? 'bg-gradient-to-b from-amber-50/40 via-white to-orange-50/10 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`h-11 w-11 rounded-xl ${activeDeptData.color} text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0`}>
              {activeDeptData.name === 'Campus Ambassadors' ? <GraduationCap className="h-6 w-6" /> : activeDeptData.code}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-lg text-slate-900">{selectedDept}</h2>
                <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full border ${
                  activeDeptData.name === 'Campus Ambassadors'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {getDeptMembers(selectedDept).length} Assigned
                </span>
                {activeDeptData.name === 'Campus Ambassadors' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                    <Sparkles className="h-2.5 w-2.5 text-amber-200" /> Special Unit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeDeptData.desc}
              </p>
            </div>
          </div>

          {/* Department Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activeDeptData.name === 'Campus Ambassadors' ? (
              <Link
                to={`/chat?directUser=${encodeURIComponent(effectiveSuperAdminMentors[0]?.forenclueId || 'FC-EMP-2026-001')}`}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span>Message Lead Super Admin ({effectiveSuperAdminMentors[0]?.name || 'Tejas Tapse'})</span>
              </Link>
            ) : (
              <Link
                to={`/chat?directUser=${encodeURIComponent(activeDeptData.mentorId)}`}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Message {activeDeptData.mentorName} (Mentor)</span>
              </Link>
            )}

            <Link
              to={`/chat?group=${encodeURIComponent(selectedDept)}`}
              className={`px-3.5 py-2 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer ${
                activeDeptData.name === 'Campus Ambassadors'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Open {selectedDept} Chat Group</span>
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />
            </Link>
          </div>
        </div>

        {/* Lead Mentor Spotlight: Single Mentor OR All Super Admins Council */}
        {activeDeptData.name === 'Campus Ambassadors' ? (
          /* Special Super Admin Mentorship Council Panel with Official Badge */
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-100/70 via-amber-50/80 to-orange-50/80 border border-amber-300 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-amber-200/80">
              <div className="flex items-center space-x-3">
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-md flex-shrink-0 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  <img
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEheWlYhKU2WoUqZnypbPj_mI1Jf4CH0isE5HhHcrIhTpSmNNx_FKtm3-eb9v2ETr_sIVz9RHjiIBlrT4BrV-N0L2BiyTtmVLMobgDXhTme1nmya3SPsTlyKw1RikzZydvun171ZZQ1V29yvZBhxz7XTFBJE-ewLD7XSkturQdem9OwScNqcVkEmXgiFVCA/s1024/IMG_1665.PNG"
                    alt="Campus Ambassador Official Badge"
                    className="h-full w-full object-cover rounded-[14px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Super Admin Mentorship Council
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    The Campus Ambassadors department receives direct executive mentorship and governance from all Super Admins.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid of All Super Admin Mentors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {effectiveSuperAdminMentors.map((admin) => (
                <div 
                  key={String(admin.id || admin.forenclueId)}
                  className="bg-white/90 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{admin.name}</h5>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">
                          Mentor
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-amber-700 font-medium">
                        {admin.forenclueId}
                      </p>
                      {admin.designation && (
                        <p className="text-[9px] text-slate-500 truncate">
                          {admin.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/chat?directUser=${encodeURIComponent(admin.forenclueId)}`}
                    className="p-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                    title={`Message Super Admin Mentor ${admin.name}`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Single Lead Mentor Card */
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
                  {activeDeptData.mentorId}
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
        )}

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
                Members and Campus Ambassadors can be assigned to {selectedDept} via the Admin Console.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeDeptMembers.map((member) => (
                <div 
                  key={member.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between space-x-3 ${
                    member.role === 'CAMPUS_AMBASSADOR' || activeDeptData.name === 'Campus Ambassadors'
                      ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/30 via-white to-white hover:border-amber-300 hover:shadow-xs'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0 ${
                      member.role === 'CAMPUS_AMBASSADOR' || activeDeptData.name === 'Campus Ambassadors'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          member.role === 'SUPER_ADMIN' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : member.role === 'CAMPUS_AMBASSADOR'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : member.role === 'MENTOR'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {member.role.replace('_', ' ')}
                        </span>
                        {member.forenclueId === user?.forenclueId && (
                          <UserNetworkTag variant="compact" showWhenOnline={false} />
                        )}
                      </div>
                      <p className="text-[11px] font-mono font-bold text-blue-600 mt-0.5">
                        {member.forenclueId}
                      </p>
                      {member.designation && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {member.designation}
                        </p>
                      )}
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
