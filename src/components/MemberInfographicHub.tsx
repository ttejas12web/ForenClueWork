import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  Trophy, 
  Award, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Flame, 
  ArrowUpRight, 
  ShieldCheck, 
  ChevronRight, 
  Layers, 
  Filter,
  Check,
  Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DepartmentStat {
  department: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  onTimeRate: number;
  theme: { bg: string; badge: string; bar: string };
  topPerformer: {
    name: string;
    forenclueId: string;
    role: string;
    completedCount: number;
    totalAssigned: number;
    efficiencyScore: number;
  } | null;
}

interface RankedMember {
  userId: number;
  name: string;
  forenclueId: string;
  role: string;
  department: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  todo: number;
  onTimePercentage: number;
  efficiencyScore: number;
}

interface UserTask {
  id: number;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  department: string | null;
  dueDate: string | null;
  notes: string | null;
  daysRemaining: number | null;
  deadlineStatus: 'COMPLETED_ON_TIME' | 'OVERDUE' | 'URGENT' | 'ON_TRACK' | 'NO_DEADLINE';
  isOverdue: boolean;
  urgencyColor: string;
}

interface AnalyticsData {
  departmentStats: DepartmentStat[];
  leaderboard: RankedMember[];
  teamBenchmark: {
    totalWorkspaceTasks: number;
    totalCompleted: number;
    totalInProgress: number;
    totalTodo: number;
    overallOnTimeRate: number;
    turnaroundAverageDays: number;
    activeSprintVelocity: number;
  };
  userMetrics: {
    totalAllotted: number;
    completed: number;
    inProgress: number;
    todo: number;
    onTimeRate: number;
    tasks: UserTask[];
  };
}

interface MemberInfographicHubProps {
  user: any;
  token: string | null;
}

export const MemberInfographicHub: React.FC<MemberInfographicHubProps> = ({ user, token }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'URGENT' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [activeTab, setActiveTab] = useState<'MY_TASKS' | 'DEPARTMENT_HEATMAP' | 'LEADERBOARD'>('MY_TASKS');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [token]);

  const fetchInsights = async () => {
    try {
      if (!token) return;
      const res = await apiFetch('/api/analytics/workspace-insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load workspace analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    setUpdatingTaskId(taskId);
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchInsights();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="h-9 w-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Synthesizing forensic infographic metrics...</p>
      </div>
    );
  }

  const { departmentStats, leaderboard, teamBenchmark, userMetrics } = data;
  const userTasks = userMetrics.tasks;

  const filteredTasks = userTasks.filter(t => {
    if (taskFilter === 'URGENT') return t.deadlineStatus === 'URGENT' || t.deadlineStatus === 'OVERDUE';
    if (taskFilter === 'ACTIVE') return t.status !== 'COMPLETED';
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const maxDeptTasks = Math.max(...departmentStats.map(d => d.totalTasks), 1);
  const highestVolumeDept = departmentStats[0];

  return (
    <div className="space-y-6">
      {/* Visual Header Welcome & Infographic Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold border border-white/10 text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Interactive Forensic Precision Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-emerald-300">{user.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track your allotted forensic tasks, deadline countdowns, on-time velocity, and cross-department performance benchmarks in real time.
            </p>
          </div>

          {/* Quick Infographic Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-emerald-400 text-xs font-bold mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>On-Time Rate</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{teamBenchmark.overallOnTimeRate}%</p>
              <p className="text-[10px] text-slate-300">Workspace Average</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-amber-400 text-xs font-bold mb-1">
                <Flame className="h-3.5 w-3.5" />
                <span>Active Sprint</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{teamBenchmark.activeSprintVelocity}%</p>
              <p className="text-[10px] text-slate-300">Velocity Index</p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-cyan-400 text-xs font-bold mb-1">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>My Tasks</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">
                {userMetrics.completed} / {userMetrics.totalAllotted}
              </p>
              <p className="text-[10px] text-slate-300">Completed Allotted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Infographic Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
        <button
          onClick={() => setActiveTab('MY_TASKS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MY_TASKS'
              ? 'bg-white text-blue-700 shadow-sm shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>My Tasks & Deadlines ({userMetrics.tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENT_HEATMAP')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DEPARTMENT_HEATMAP'
              ? 'bg-white text-blue-700 shadow-sm shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Department Workload & Top Performers</span>
        </button>

        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'bg-white text-blue-700 shadow-sm shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Organization Leaderboard</span>
        </button>
      </div>

      {/* SECTION 1: MY TASKS & DEADLINE COUNTDOWN */}
      {activeTab === 'MY_TASKS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>My Allotted Tasks & Completion Timelines</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks assigned specifically to your volunteer/member ID. Keep status updated for team analytics.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {(['ALL', 'URGENT', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    taskFilter === filter
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {filter === 'ALL' ? 'All Tasks' : filter === 'URGENT' ? '🚨 Approaching/Urgent' : filter === 'ACTIVE' ? '⚡ In Progress' : '✅ Completed'}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs">
              <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No tasks found matching filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {taskFilter === 'ALL' 
                  ? "You have no allotted tasks at the moment. Super admins will assign upcoming forensic sprints to you." 
                  : "Try resetting your filter to view all your tasks."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const isUpdating = updatingTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                      task.status === 'COMPLETED'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : task.isOverdue
                        ? 'border-rose-300 bg-rose-50/20'
                        : task.deadlineStatus === 'URGENT'
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Priority & Deadline Badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                            task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority} PRIORITY
                          </span>
                          {task.department && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {task.department}
                            </span>
                          )}
                        </div>

                        {/* Deadline Indicator */}
                        {task.dueDate && (
                          <div className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : task.isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                              : task.deadlineStatus === 'URGENT'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            <Timer className="h-3 w-3" />
                            <span>
                              {task.status === 'COMPLETED'
                                ? 'Completed on Time'
                                : task.isOverdue
                                ? `Overdue by ${Math.abs(task.daysRemaining || 0)}d`
                                : task.daysRemaining === 0
                                ? 'Due Today!'
                                : `${task.daysRemaining} days remaining`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className={`text-sm font-bold leading-snug ${task.status === 'COMPLETED' ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Notes / Special Instructions */}
                      {task.notes && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700">Mentor Notes: </span>
                          {task.notes}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Status Transition */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Due {task.dueDate || 'No Date'}</span>
                      </div>

                      {/* Interactive Status Controls */}
                      <div className="flex items-center space-x-1.5">
                        {task.status !== 'COMPLETED' ? (
                          <>
                            {task.status === 'TODO' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                disabled={isUpdating}
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                {isUpdating ? 'Updating...' : 'Start Task'}
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>{isUpdating ? 'Saving...' : 'Mark Complete'}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold"
                          >
                            Re-open
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: DEPARTMENT WORKLOAD HEATMAP & TOP PERFORMER RECOGNITION */}
      {activeTab === 'DEPARTMENT_HEATMAP' && (
        <div className="space-y-6">
          {/* Department Volume Infographic Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-300" />
                <h3 className="text-base font-bold">Highest Task Volume Department</h3>
              </div>
              <p className="text-xs text-blue-100">
                <span className="font-bold text-white text-sm">{highestVolumeDept.department}</span> leads with <span className="font-bold text-amber-300">{highestVolumeDept.totalTasks} total tasks</span> ({Math.round((highestVolumeDept.totalTasks / (teamBenchmark.totalWorkspaceTasks || 1)) * 100)}% of workspace load).
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-wider">Completion Velocity</span>
              <span className="text-lg font-black text-white">{highestVolumeDept.completionRate}% Done</span>
            </div>
          </div>

          {/* Department Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStats.map((dept) => {
              const volumePercent = Math.round((dept.totalTasks / maxDeptTasks) * 100);
              return (
                <div key={dept.department} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition-shadow">
                  {/* Dept Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dept.theme.badge}`}>
                        {dept.department}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{dept.totalTasks} Tasks Total</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600">{dept.onTimeRate}%</span>
                      <span className="text-[10px] text-slate-400 block">On-Time Rate</span>
                    </div>
                  </div>

                  {/* Volume Relative Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Workload Distribution</span>
                      <span>{dept.completedTasks} / {dept.totalTasks} Done</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${dept.theme.bar} transition-all duration-500`}
                        style={{ width: `${dept.completionRate}%` }}
                        title={`${dept.completedTasks} Completed`}
                      />
                      <div 
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${dept.totalTasks > 0 ? (dept.inProgressTasks / dept.totalTasks) * 100 : 0}%` }}
                        title={`${dept.inProgressTasks} In Progress`}
                      />
                    </div>
                  </div>

                  {/* Breakdown Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-semibold block">Completed</span>
                      <span className="font-bold text-emerald-800 text-sm">{dept.completedTasks}</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 font-semibold block">In Progress</span>
                      <span className="font-bold text-amber-800 text-sm">{dept.inProgressTasks}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-600 font-semibold block">Pending</span>
                      <span className="font-bold text-slate-800 text-sm">{dept.todoTasks}</span>
                    </div>
                  </div>

                  {/* Top Performer Badge for this department */}
                  {dept.topPerformer ? (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-bold text-slate-700">Department Top Performer</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                            {dept.topPerformer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{dept.topPerformer.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{dept.topPerformer.forenclueId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {dept.topPerformer.completedCount} Done
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-center text-[11px] text-slate-400">
                      Tasks in progress across members
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: WORKSPACE LEADERBOARD & RECOGNITION */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Forensic Excellence Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Recognizing top members and volunteers for outstanding task turnaround, reliability, and precision.
                </p>
              </div>

              <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  <Flame className="h-3 w-3 mr-1 text-amber-600" />
                  Weekly Sprint Standings
                </span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
                  <Trophy className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Sprint Leaderboard Initializing</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Complete allotted workspace deliverables to rank on the weekly Forensic Precision & Excellence Leaderboard.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3 text-center">Completed Tasks</th>
                      <th className="px-4 py-3 text-center">On-Time Precision</th>
                      <th className="px-4 py-3 text-right">Efficiency Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {leaderboard.map((member, index) => (
                      <tr 
                        key={member.userId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          member.userId === user.id ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-bold">
                          <div className="flex items-center space-x-1.5">
                            {index === 0 ? (
                              <span className="h-6 w-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shadow-xs">
                                1
                              </span>
                            ) : index === 1 ? (
                              <span className="h-6 w-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-xs font-black">
                                2
                              </span>
                            ) : index === 2 ? (
                              <span className="h-6 w-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-xs font-black">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-400 pl-2">#{index + 1}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-900">{member.name}</span>
                                {member.userId === user.id && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{member.forenclueId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {member.department}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {member.completed} / {member.totalAssigned}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                          {member.onTimePercentage}%
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span>{member.efficiencyScore} pts</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
