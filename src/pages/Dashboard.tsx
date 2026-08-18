import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  CheckSquare, 
  Users, 
  FolderKanban, 
  Megaphone, 
  ShieldCheck, 
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
  ChevronRight,
  Fingerprint,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardTask {
  id: number;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: number | null;
  department: string | null;
  dueDate: string | null;
  assignedUserName?: string;
  assignedUserForenclueId?: string;
  assignedUserRole?: string;
  notes?: string | null;
}

export const Dashboard = () => {
  const { user, token } = useAuthStore();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeGroupsCount, setActiveGroupsCount] = useState<number | null>(null);
  const [recentGroups, setRecentGroups] = useState<any[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const isAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!token) return;

    // Fetch users count if admin
    if (isAdmin) {
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTotalUsers(data.length);
          }
        })
        .catch(() => {});
    }

    // Fetch groups for live preview
    fetch('/api/chat/groups', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveGroupsCount(data.length);
          setRecentGroups(data.slice(0, 3));
        }
      })
      .catch(() => {});

    // Fetch tasks (Admin gets all, member gets ONLY tasks allotted to him)
    fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTasks(data);
        }
      })
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, [user, token, isAdmin]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;

  const stats = isAdmin ? [
    { title: 'Workspace Members', value: totalUsers !== null ? totalUsers.toString() : '...', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Allotted Tasks', value: tasks.length.toString(), icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Chat Channels', value: activeGroupsCount !== null ? activeGroupsCount.toString() : '...', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'System Security', value: 'Protected', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [
    { title: 'My Active Tasks', value: activeTasksCount.toString(), icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Completed Tasks', value: completedTasksCount.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Workspace Groups', value: activeGroupsCount !== null ? activeGroupsCount.toString() : '...', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Member Status', value: 'Verified', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                {getTimeGreeting()}, {user?.name?.split(' ')[0]}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold flex items-center">
                  <Crown className="h-3 w-3 mr-1" />
                  SUPER ADMIN
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ForenClue Forensic Intelligence Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Collaborate securely across departments, manage tasks, coordinate team groups, and review forensic intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <Link
              to="/tasks"
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <CheckSquare className="h-4 w-4" />
              <span>{isAdmin ? 'Manage Allotments' : 'My Tasks'}</span>
            </Link>
            <Link
              to="/chat"
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Workspace Chat</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Admin Console</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Cards (Mobile & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link 
          to="/tasks" 
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-center space-x-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {isAdmin ? 'Task Allotment' : 'My Deliverables'}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              {isAdmin ? 'Allot to members' : `${activeTasksCount} active tasks`}
            </p>
          </div>
        </Link>

        <Link 
          to="/chat" 
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center space-x-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Workspace Chat</h3>
            <p className="text-[11px] text-slate-500 truncate">Join channels</p>
          </div>
        </Link>

        <Link 
          to="/teams" 
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex items-center space-x-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Departments</h3>
            <p className="text-[11px] text-slate-500 truncate">6 active teams</p>
          </div>
        </Link>

        <Link 
          to="/resources" 
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-center space-x-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">SOP & Library</h3>
            <p className="text-[11px] text-slate-500 truncate">Forensic manuals</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= TASKS ON WORKSPACE DASHBOARD ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900">
                {isAdmin ? 'Workspace Task Allotments Overview' : 'My Allotted Deliverables'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isAdmin 
                  ? 'Recent tasks allotted to workspace team members' 
                  : 'Tasks specifically allotted to your ForenClue profile by Super Admin'}
              </p>
            </div>
          </div>

          <Link 
            to="/tasks" 
            className="text-blue-600 text-xs font-bold hover:underline flex items-center space-x-1"
          >
            <span>Open Task Board</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tasksLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-700">
              {isAdmin ? 'No tasks created yet' : 'No tasks allotted to you right now'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {isAdmin 
                ? 'Click below to allot deliverables to workspace members.' 
                : 'When Super Admin allots tasks to your ForenClue account, they will appear here and alert your panel.'}
            </p>
            {isAdmin && (
              <Link
                to="/tasks"
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Allot Task</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tasks.slice(0, 6).map((task) => (
              <div 
                key={task.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 bg-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      task.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : task.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{task.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {task.description || 'No description'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  {isAdmin ? (
                    <span className="font-semibold text-slate-700 truncate max-w-[140px] flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-blue-600" />
                      {task.assignedUserName ? `${task.assignedUserName} (${task.assignedUserForenclueId})` : 'Unassigned'}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-600 truncate max-w-[140px]">
                      {task.department || 'Forensics'}
                    </span>
                  )}
                  <span className="text-slate-400 font-medium">Due: {task.dueDate || 'TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Active Channels & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Active Chat Channels Preview */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900">Workspace Chat Channels</h2>
            </div>
            <Link to="/chat" className="text-blue-600 text-xs font-semibold hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="p-4 sm:p-5 divide-y divide-slate-100 flex-1">
            {recentGroups.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No channels available yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click into Chat to create your first workspace group!</p>
                <Link
                  to="/chat"
                  className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Go to Chat</span>
                </Link>
              </div>
            ) : (
              recentGroups.map((grp) => (
                <Link
                  key={grp.id}
                  to="/chat"
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                      {grp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {grp.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {grp.description || `${grp.memberCount} members connected`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                      {grp.memberCount} members
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="flex flex-col space-y-4">
          
          {/* User ID Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <Fingerprint className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Official Credentials</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">ForenClue ID</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{user?.forenclueId}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-800">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to="/profile"
                className="w-full flex items-center justify-center py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Megaphone className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">Announcements</h3>
                </div>
                <Link to="/announcements" className="text-[11px] text-blue-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <p className="text-xs font-bold text-white">Workspace v2.0 Operational</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Real-time team chat, member assignment, and departmental organization are active.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-400">
                ForenClue • Precision Forensic Security
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
