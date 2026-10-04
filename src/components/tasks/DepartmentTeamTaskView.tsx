import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  CheckSquare, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Search, 
  ArrowRight, 
  Eye, 
  Sparkles, 
  ExternalLink, 
  Crown, 
  UserCheck, 
  Layers, 
  MessageSquare, 
  ChevronRight,
  Send,
  Check
} from 'lucide-react';
import { WorkspaceTask } from '../../pages/Tasks';
import { CANONICAL_DEPARTMENTS, normalizeDepartmentName, getDepartmentMetadata, DepartmentMetadata } from './departmentData';

export interface WorkspaceMember {
  id: any;
  forenclueId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
}

interface DepartmentTeamTaskViewProps {
  tasks: WorkspaceTask[];
  members: WorkspaceMember[];
  currentUser: any;
  isSuperAdmin: boolean;
  onOpenAllotModal: (dept?: string) => void;
  onAllotToMember: (member: WorkspaceMember) => void;
  onViewDeliverable: (task: WorkspaceTask) => void;
  onSubmitDeliverable: (task: WorkspaceTask) => void;
  onReviewDeliverable: (task: WorkspaceTask) => void;
  onRequestExtension: (task: WorkspaceTask) => void;
  onQuickApprove?: (task: WorkspaceTask) => void;
}

export const DepartmentTeamTaskView: React.FC<DepartmentTeamTaskViewProps> = ({
  tasks,
  members,
  currentUser,
  isSuperAdmin,
  onOpenAllotModal,
  onAllotToMember,
  onViewDeliverable,
  onSubmitDeliverable,
  onReviewDeliverable,
  onRequestExtension,
  onQuickApprove,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [deptTab, setDeptTab] = useState<'TASKS' | 'TEAM'>('TASKS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute departmental statistics & grouped data
  const departmentalData = useMemo(() => {
    return CANONICAL_DEPARTMENTS.map(dept => {
      // Find all tasks mapped to this department
      const deptTasks = tasks.filter(t => normalizeDepartmentName(t.department) === dept.name);
      
      // Find all members mapped to this department
      const deptMembers = members.filter(m => normalizeDepartmentName(m.department) === dept.name);

      const total = deptTasks.length;
      const completed = deptTasks.filter(t => 
        (t.status === 'COMPLETED' || t.status === 'SUBMITTED') && 
        t.reviewStatus !== 'PENDING_REVIEW' && 
        (t.status as string) !== 'UNDER REVIEW'
      ).length;
      const underReview = deptTasks.filter(t => 
        (t.status as string) === 'UNDER REVIEW' || 
        (t.status as string) === 'UNDER_REVIEW' || 
        t.reviewStatus === 'PENDING_REVIEW'
      ).length;
      const inProgress = deptTasks.filter(t => 
        t.status === 'IN_PROGRESS' || 
        t.reviewStatus === 'CHANGES_REQUESTED'
      ).length;
      const todo = deptTasks.filter(t => t.status === 'TODO').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        metadata: dept,
        tasks: deptTasks,
        members: deptMembers,
        metrics: {
          total,
          completed,
          underReview,
          inProgress,
          todo,
          completionRate
        }
      };
    });
  }, [tasks, members]);

  // Filtered list of departments to render
  const visibleDepartments = useMemo(() => {
    if (selectedDeptId === 'ALL') {
      return departmentalData;
    }
    return departmentalData.filter(d => d.metadata.id === selectedDeptId);
  }, [departmentalData, selectedDeptId]);

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Department Selector Pills & Global Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department & Team Operations</h3>
                <p className="text-[11px] text-slate-500">Live deliverables, staffing allocations, and sprint velocity by department</p>
              </div>
            </div>
          </div>

          {/* Sub-view toggle (Tasks vs Team Staffing) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setDeptTab('TASKS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                deptTab === 'TASKS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Deliverables View</span>
            </button>
            <button
              onClick={() => setDeptTab('TEAM')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                deptTab === 'TEAM'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Team Staffing Roster</span>
            </button>
          </div>
        </div>

        {/* Horizontal Department Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0 w-full">
          <button
            onClick={() => setSelectedDeptId('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
              selectedDeptId === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span>All Departments</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedDeptId === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {tasks.length}
            </span>
          </button>

          {departmentalData.map(d => {
            const isSelected = selectedDeptId === d.metadata.id;
            return (
              <button
                key={d.metadata.id}
                onClick={() => setSelectedDeptId(d.metadata.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : d.metadata.accentBg}`} />
                <span>{d.metadata.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {d.tasks.length}
                </span>
                {d.metrics.total > 0 && (
                  <span className={`text-[10px] font-mono ml-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {d.metrics.completionRate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="UNDER_REVIEW">Under QA Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deliverables, scope, or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Render Department Sections */}
      <div className="space-y-6">
        {visibleDepartments.map(deptItem => {
          const { metadata, tasks: deptTasks, members: deptMembers, metrics } = deptItem;

          // Apply search & status filter to this department's tasks
          const filteredDeptTasks = deptTasks.filter(t => {
            if (statusFilter !== 'ALL') {
              if (statusFilter === 'UNDER_REVIEW') {
                const isUnderReview = (t.status as string) === 'UNDER REVIEW' || (t.status as string) === 'UNDER_REVIEW' || t.reviewStatus === 'PENDING_REVIEW';
                if (!isUnderReview) return false;
              } else if (t.status !== statusFilter) {
                return false;
              }
            }
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              return (
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q)) ||
                (t.assignedUserName && t.assignedUserName.toLowerCase().includes(q)) ||
                (t.assignedUserForenclueId && t.assignedUserForenclueId.toLowerCase().includes(q))
              );
            }
            return true;
          });

          // Filter members if search query active
          const filteredDeptMembers = deptMembers.filter(m => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              m.name.toLowerCase().includes(q) ||
              m.forenclueId.toLowerCase().includes(q) ||
              (m.designation && m.designation.toLowerCase().includes(q)) ||
              (m.role && m.role.toLowerCase().includes(q))
            );
          });

          return (
            <div 
              key={metadata.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:shadow-sm"
            >
              {/* Department Header Card */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wider ${metadata.badgeBg}`}>
                        {metadata.code}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        {metadata.name}
                      </h4>
                      <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                        <Crown className="h-3 w-3 text-amber-500" />
                        <span>Lead Mentor: {metadata.mentorName}</span>
                        <span className="font-mono text-slate-400 text-[10px]">({metadata.mentorId})</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {metadata.desc}
                    </p>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 text-xs">
                      <div className="px-2 py-0.5 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
                        <p className="font-bold text-slate-800">{metrics.total}</p>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-200" />
                      <div className="px-2 py-0.5 text-center">
                        <p className="text-[10px] text-blue-600 uppercase font-semibold">Active</p>
                        <p className="font-bold text-blue-700">{metrics.inProgress + metrics.todo}</p>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-200" />
                      <div className="px-2 py-0.5 text-center">
                        <p className="text-[10px] text-indigo-600 uppercase font-semibold">Review</p>
                        <p className="font-bold text-indigo-700">{metrics.underReview}</p>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-200" />
                      <div className="px-2 py-0.5 text-center">
                        <p className="text-[10px] text-emerald-600 uppercase font-semibold">Done</p>
                        <p className="font-bold text-emerald-700">{metrics.completed}</p>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => onOpenAllotModal(metadata.name)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Allot to {metadata.code}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Velocity Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-3">
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">Completion Rate:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${metadata.accentBg}`}
                      style={{ width: `${metrics.completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-black font-mono text-slate-800 shrink-0">
                    {metrics.completionRate}%
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline shrink-0">
                    ({deptMembers.length} team members active)
                  </span>
                </div>
              </div>

              {/* Department Body Content */}
              <div className="p-4 sm:p-5">
                {deptTab === 'TASKS' ? (
                  // --- DELIVERABLES LIST ---
                  filteredDeptTasks.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No deliverables currently matching in {metadata.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isSuperAdmin
                          ? 'Click the "+ Allot" button above to assign deliverables to members of this department.'
                          : 'No active sprints are currently assigned to this department.'}
                      </p>
                      {isSuperAdmin && (
                        <button
                          onClick={() => onOpenAllotModal(metadata.name)}
                          className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Allot Deliverable</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredDeptTasks.map(task => {
                        const isUnderReview = (task.status as string) === 'UNDER REVIEW' || (task.status as string) === 'UNDER_REVIEW' || task.reviewStatus === 'PENDING_REVIEW';
                        const isChangesRequested = task.reviewStatus === 'CHANGES_REQUESTED';
                        const isApprovedPerfect = task.reviewStatus === 'APPROVED';
                        const isCompleted = (task.status === 'COMPLETED' || task.status === 'SUBMITTED') && !isUnderReview;
                        const isInProgress = task.status === 'IN_PROGRESS' || isChangesRequested;

                        const isAllottedWorker = Boolean(
                          currentUser && (
                            (task.assignedTo && String(task.assignedTo) === String(currentUser.id)) ||
                            (task.assignedUserForenclueId && task.assignedUserForenclueId === currentUser.forenclueId)
                          )
                        );

                        const hasDeliverableFiles = (task.deliverableFiles && task.deliverableFiles.length > 0) || Boolean(task.deliverableAttachmentUrl);

                        return (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-3.5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs relative bg-white ${
                              isChangesRequested
                                ? 'border-rose-300 bg-rose-50/15'
                                : isUnderReview
                                ? 'border-indigo-300 bg-indigo-50/15'
                                : isCompleted
                                ? 'border-emerald-200 bg-emerald-50/15'
                                : isInProgress
                                ? 'border-blue-200 bg-blue-50/5'
                                : 'border-slate-200'
                            }`}
                          >
                            <div>
                              {/* Top Bar: Priority & Status Badges */}
                              <div className="flex items-start justify-between gap-1.5 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                                  isChangesRequested
                                    ? 'bg-rose-100 text-rose-800'
                                    : isUnderReview
                                    ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                                    : isApprovedPerfect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isUnderReview ? 'Under QA Review' : isChangesRequested ? 'Needs Revision' : isCompleted ? 'Completed' : task.status}
                                </span>
                              </div>

                              {/* Task Title */}
                              <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {task.title}
                              </h5>

                              {task.description && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Assigned Member Cardlet */}
                              <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-between">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {(task.assignedUserName || 'M').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">
                                      {task.assignedUserName || 'Unassigned'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                      {task.assignedUserForenclueId || 'ID Pending'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                                  {task.assignedUserRole || 'Member'}
                                </span>
                              </div>
                            </div>

                            {/* Due Date & Action Buttons Footer */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-1 text-[11px] font-medium text-slate-500">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{task.dueDate || 'No Date'}</span>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                {/* Inspect Deliverables Button */}
                                {hasDeliverableFiles && (
                                  <button
                                    onClick={() => onViewDeliverable(task)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                                    title="Inspect deliverable files"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Worker Submit Action */}
                                {isAllottedWorker && !isCompleted && !isUnderReview && (
                                  <button
                                    onClick={() => onSubmitDeliverable(task)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1 shadow-2xs"
                                  >
                                    <Send className="h-3 w-3" />
                                    <span>Submit</span>
                                  </button>
                                )}

                                {/* Super Admin QA Review Button */}
                                {isSuperAdmin && isUnderReview && (
                                  <button
                                    onClick={() => onReviewDeliverable(task)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1 shadow-2xs"
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>Review QA</span>
                                  </button>
                                )}

                                {/* Super Admin Quick Approve */}
                                {isSuperAdmin && !isCompleted && !isUnderReview && onQuickApprove && (
                                  <button
                                    onClick={() => onQuickApprove(task)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-[11px] font-bold cursor-pointer"
                                    title="Mark Completed"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  // --- TEAM STAFFING ROSTER ---
                  filteredDeptMembers.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No team members registered under {metadata.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Team members can be assigned to this department from the Departments & Teams page or Admin Console.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredDeptMembers.map(member => {
                        // Count active tasks for this specific member
                        const memberTasks = deptTasks.filter(t => 
                          (t.assignedTo && String(t.assignedTo) === String(member.id)) ||
                          (t.assignedUserForenclueId && t.assignedUserForenclueId === member.forenclueId)
                        );
                        const memberActiveTasks = memberTasks.filter(t => t.status !== 'COMPLETED');
                        const memberCompletedTasks = memberTasks.filter(t => t.status === 'COMPLETED');

                        return (
                          <div 
                            key={member.id}
                            className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between transition-all"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                                    {(member.name || 'M').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-slate-900 truncate">
                                      {member.name}
                                    </h5>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                      {member.forenclueId}
                                    </p>
                                  </div>
                                </div>

                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                  member.role === 'SUPER_ADMIN'
                                    ? 'bg-amber-100 text-amber-800'
                                    : member.role === 'VOLUNTEER'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : member.role === 'CAMPUS_AMBASSADOR'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {member.role}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                                {member.designation || 'Workspace Member'}
                              </p>
                            </div>

                            {/* Workload Indicator & Quick Allot CTA */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-1.5 text-[10px] font-medium text-slate-500">
                                <span className="font-bold text-slate-800">{memberActiveTasks.length}</span> active
                                <span>•</span>
                                <span className="font-bold text-emerald-600">{memberCompletedTasks.length}</span> done
                              </div>

                              {isSuperAdmin && (
                                <button
                                  onClick={() => onAllotToMember(member)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1 shadow-2xs"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Allot Task</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
};
