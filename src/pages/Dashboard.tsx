import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { MemberInfographicHub } from '../components/MemberInfographicHub';
import { 
  subscribeToTasks, 
  subscribeToUsers, 
  subscribeToChatGroups, 
  FirestoreTask 
} from '../lib/firestoreService';
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
  UserCheck,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  // Live Firestore State
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeGroupsCount, setActiveGroupsCount] = useState<number | null>(null);
  const [recentGroups, setRecentGroups] = useState<any[]>([]);
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [adminViewMode, setAdminViewMode] = useState<'EXECUTIVE' | 'INFOGRAPHIC'>('EXECUTIVE');

  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to users for live count
    const unsubUsers = subscribeToUsers((usersList) => {
      setTotalUsers(usersList.length);
    });

    // 2. Subscribe to chat groups
    const unsubGroups = subscribeToChatGroups(
      user.id, 
      (groupsList) => {
        setActiveGroupsCount(groupsList.length);
        setRecentGroups(groupsList.slice(0, 3));
      }, 
      user.role === 'SUPER_ADMIN'
    );

    // 3. Subscribe to tasks
    const unsubTasks = subscribeToTasks(
      (tasksList) => {
        setTasks(tasksList);
        setTasksLoading(false);
      }, 
      user.id, 
      user.role
    );

    return () => {
      unsubUsers();
      unsubGroups();
      unsubTasks();
    };
  }, [user]);

  // Non-super-admins always see the MemberInfographicHub as their rich dashboard
  if (!isAdmin) {
    return <MemberInfographicHub user={user} token={token} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Super Admin Executive vs Infographic Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900 text-white p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-800 shadow-sm gap-2 sm:gap-0">
        <div className="flex items-center space-x-2">
          <Crown className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-bold truncate">Super Admin Command Center</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
            Real-Time Sync
          </span>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl">
          <button
            onClick={() => setAdminViewMode('EXECUTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center justify-center flex items-center space-x-1.5 ${
              adminViewMode === 'EXECUTIVE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Executive View</span>
          </button>
          <button
            onClick={() => setAdminViewMode('INFOGRAPHIC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center justify-center flex items-center space-x-1.5 ${
              adminViewMode === 'INFOGRAPHIC'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Infographics Hub</span>
          </button>
        </div>
      </div>

      {adminViewMode === 'INFOGRAPHIC' ? (
        <MemberInfographicHub user={user} token={token} />
      ) : (
        <>
          {/* Welcome Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    ForenClue Workspace
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-mono">
                    SUPER ADMIN
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Overview of all active case studies, forensic tasks, team rosters, and real-time announcements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all transform active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/tasks"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all transform active:scale-95 cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Tasks Board</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</span>
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {totalUsers !== null ? totalUsers : '...'}
                </span>
                <span className="text-xs text-slate-500 font-medium">registered</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Active across all wings</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chat Groups</span>
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {activeGroupsCount !== null ? activeGroupsCount : '...'}
                </span>
                <span className="text-xs text-slate-500 font-medium">channels</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Real-time team rooms</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Tasks</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {tasks.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">deliverables</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Live task allotments</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Announcements</span>
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Megaphone className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">Broadcast</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Workspace notices</p>
            </div>
          </div>

          {/* Quick Actions & Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Actions */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Quick Navigation</h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  to="/tasks"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    <span>Manage Tasks & Assignments</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <span>Team Chat & Department Channels</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/teams"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span>Team Directory & Roster</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/calendar"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <CalendarIcon className="h-4 w-4 text-amber-600" />
                    <span>Events & Meeting Calendar</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/announcements"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <Megaphone className="h-4 w-4 text-rose-600" />
                    <span>Workspace Announcements</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Recent Tasks Widget */}
            <div className="md:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Recent Tasks</h3>
                </div>
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {tasksLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No tasks created yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {task.department || 'General'} • Assigned to {task.assignedUserName || 'Unassigned'}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
