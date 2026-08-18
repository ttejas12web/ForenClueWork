import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  UserCheck, 
  Shield, 
  Crown, 
  Search, 
  Trash2, 
  Edit3, 
  Send, 
  Sparkles, 
  Layers, 
  FileText, 
  ArrowRight, 
  Check, 
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export interface WorkspaceTask {
  id: number;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: number | null;
  department: string | null;
  dueDate: string | null;
  createdBy: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  assignedUserForenclueId?: string;
  assignedUserRole?: string;
  creatorName?: string;
  creatorForenclueId?: string;
}

interface WorkspaceMember {
  id: number;
  forenclueId: string;
  name: string;
  email: string;
  role: string;
}

export const Tasks: React.FC = () => {
  const { user, token } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [showDeliverableModal, setShowDeliverableModal] = useState<WorkspaceTask | null>(null);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [notificationToast, setNotificationToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({ show: false, msg: '', type: 'success' });

  // New task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDept, setTaskDept] = useState('Cyber & Digital Forensics');
  const [taskDueDate, setTaskDueDate] = useState('Aug 25, 2026');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState('');
  const [memberSearchInModal, setMemberSearchInModal] = useState('');

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotificationToast({ show: true, msg, type });
    setTimeout(() => {
      setNotificationToast({ show: false, msg: '', type: 'success' });
    }, 4000);
  };

  // Fetch tasks
  const fetchTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedMemberFilter !== 'ALL') {
        params.append('memberId', selectedMemberFilter);
      }
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (priorityFilter !== 'ALL') {
        params.append('priority', priorityFilter);
      }

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available workspace members
  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [token, statusFilter, selectedMemberFilter, priorityFilter]);

  // Open Allot Task Modal
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskDept('Cyber & Digital Forensics');
    setTaskDueDate('Aug 28, 2026');
    setTaskAssignedTo(members.length > 0 ? String(members[0].id) : '');
    setTaskNotes('');
    setMemberSearchInModal('');
    setShowAllotModal(true);
  };

  // Open Edit Task Modal
  const handleOpenEditModal = (task: WorkspaceTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskDept(task.department || 'Cyber & Digital Forensics');
    setTaskDueDate(task.dueDate || 'Aug 28, 2026');
    setTaskAssignedTo(task.assignedTo ? String(task.assignedTo) : '');
    setTaskNotes(task.notes || '');
    setMemberSearchInModal('');
    setShowAllotModal(true);
  };

  // Create or Update Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !token) return;

    try {
      setActionLoading(true);
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        department: taskDept,
        dueDate: taskDueDate.trim(),
        assignedTo: taskAssignedTo ? parseInt(taskAssignedTo) : null,
        notes: taskNotes.trim(),
      };

      if (editingTask) {
        // Update task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
          const allottedMember = members.find(m => m.id === updated.assignedTo);
          showToast(
            allottedMember 
              ? `Task updated and allotted to ${allottedMember.name} (${allottedMember.forenclueId}). Notification sent!`
              : 'Task updated successfully.'
          );
        }
      } else {
        // Create task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          setTasks(prev => [created, ...prev]);
          const allottedMember = members.find(m => m.id === created.assignedTo);
          showToast(
            allottedMember 
              ? `Task allotted to ${allottedMember.name} (${allottedMember.forenclueId}). Real-time panel alert sent!` 
              : 'Task created in workspace pool.'
          );
        }
      }

      setShowAllotModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save task');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Change (Member or Superadmin)
  const handleUpdateStatus = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        showToast(`Task status updated to ${newStatus.replace('_', ' ')}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task (Superadmin)
  const handleDeleteTask = async (taskId: number) => {
    if (!token || !window.confirm('Are you sure you want to delete this workspace task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        showToast('Task removed from workspace.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Deliverable Submission Notes (Member)
  const handleSaveDeliverableNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDeliverableModal || !token) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/tasks/${showDeliverableModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: deliverableNotes.trim(),
          status: 'COMPLETED'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        setShowDeliverableModal(null);
        showToast('Deliverable notes submitted & marked completed! Super Admin notified.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side search filtering
  const filteredTasks = tasks.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.assignedUserName && t.assignedUserName.toLowerCase().includes(query)) ||
      (t.assignedUserForenclueId && t.assignedUserForenclueId.toLowerCase().includes(query));

    return matchesQuery;
  });

  // Calculate quick stats
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

  const filteredMembersForModal = members.filter(m => {
    const q = memberSearchInModal.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.forenclueId.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Real-time Notification Toast */}
      {notificationToast.show && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-in slide-in-from-top-4 duration-200">
          <div className="h-7 w-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium">{notificationToast.msg}</p>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSuperAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isSuperAdmin ? 'SUPER ADMIN WORKSPACE PANEL' : 'MY ASSIGNED WORKSPACE DASH'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.forenclueId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isSuperAdmin ? 'Workspace Task Allotment & Deliverables' : 'My Allotted Deliverables & Tasks'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Create, allot, and track forensic deliverables assigned directly to workspace members with automatic panel notifications.'
                : 'View and manage tasks allotted specifically to you by Super Admin. Update your progress and submit deliverables.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {isSuperAdmin && (
              <button
                id="btn-allot-new-task"
                onClick={handleOpenCreateModal}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Allot Task to Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500">
              {isSuperAdmin ? 'Total Allotments' : 'My Total Tasks'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalTasks}</p>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <p className="text-[11px] font-semibold text-amber-700">To Do</p>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{todoTasks}</p>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
            <p className="text-[11px] font-semibold text-blue-700">In Progress</p>
            <p className="text-xl font-bold text-blue-900 mt-0.5">{inProgressTasks}</p>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-700">Completed</p>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{completedTasks}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {(['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All Deliverables' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Superadmin Filter by Assigned Member & Priority */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && (
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Allotted to:</span>
                <select
                  value={selectedMemberFilter}
                  onChange={(e) => setSelectedMemberFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">All Members</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.forenclueId}) - {m.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading workspace tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Tasks Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {isSuperAdmin
              ? 'No tasks match the selected filters. Click "Allot Task to Member" above to create and assign tasks.'
              : 'You do not have any active tasks allotted to you right now. When Super Admin assigns a deliverable, you will receive an instant notification in your panel.'}
          </p>
          {isSuperAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Allot First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isInProgress = task.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/10' 
                    : isInProgress
                      ? 'border-blue-200 ring-1 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Top Bar of Card: Priority & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      task.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : task.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : task.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority} PRIORITY
                    </span>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isInProgress
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-sm font-bold leading-snug ${isCompleted ? 'text-slate-700' : 'text-slate-900'}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {task.description || 'No additional details provided.'}
                  </p>

                  {/* Member Allotment Badge */}
                  <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {task.assignedUserName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {task.assignedUserName ? task.assignedUserName : 'Unassigned'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {task.assignedUserForenclueId || 'General Pool'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-medium shrink-0">
                      {task.assignedUserRole?.replace('_', ' ') || 'Team'}
                    </span>
                  </div>

                  {/* Deliverable Notes if submitted */}
                  {task.notes && (
                    <div className="mt-2.5 p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-950">
                      <span className="font-bold flex items-center gap-1 mb-0.5 text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Deliverable Submission Notes:
                      </span>
                      <p className="line-clamp-3 italic text-emerald-900/90">{task.notes}</p>
                    </div>
                  )}
                </div>

                {/* Footer / Actions */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                      {task.department || 'Forensics'}
                    </span>
                    <span className="flex items-center text-slate-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      {task.dueDate || 'Standard'}
                    </span>
                  </div>

                  {/* Interactive Buttons for Member or Superadmin */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    {/* Member Action Controls */}
                    <div className="flex items-center space-x-1.5 flex-1">
                      {task.status === 'TODO' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                          className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Start Working</span>
                        </button>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            setShowDeliverableModal(task);
                            setDeliverableNotes(task.notes || '');
                          }}
                          className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                        >
                          <Check className="h-3 w-3" />
                          <span>Submit & Complete</span>
                        </button>
                      )}

                      {task.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}
                    </div>

                    {/* Super Admin Control Options */}
                    {isSuperAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Re-allot / Edit Details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ALLOT TASK MODAL (SUPER ADMIN) ================= */}
      {showAllotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTask ? 'Re-Allot / Edit Workspace Task' : 'Allot New Task to Member'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assigned member will receive real-time notifications in their workspace panel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable / Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Volatile RAM Memory Dump Artifact Analysis"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Allot To Workspace Member Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Allot to Workspace Member *
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter members by name or ForenClue ID..."
                      value={memberSearchInModal}
                      onChange={(e) => setMemberSearchInModal(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {filteredMembersForModal.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No workspace members found matching search.
                      </div>
                    ) : (
                      filteredMembersForModal.map((member) => {
                        const isSelected = taskAssignedTo === String(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => setTaskAssignedTo(String(member.id))}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                                <p className="text-[10px] font-mono text-slate-400 truncate">{member.forenclueId} • {member.email}</p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md shrink-0">
                              {member.role}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Description & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Provide scope, required evidence artifacts, documentation templates, or steps..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Priority & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">⚡ Urgent Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={taskDept}
                    onChange={(e) => setTaskDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Case Study">Case Study</option>
                    <option value="Research">Research</option>
                    <option value="Events & Webinars">Events & Webinars</option>
                    <option value="Cyber & Digital Forensics">Cyber & Digital Forensics</option>
                    <option value="Creative & Design">Creative & Design</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Due Date / Milestone</label>
                <input
                  type="text"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  placeholder="e.g. Aug 30, 2026 or Within 48 Hours"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAllotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{editingTask ? 'Update & Re-Allot' : 'Allot Task & Send Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SUBMIT DELIVERABLE NOTES MODAL (MEMBER) ================= */}
      {showDeliverableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Deliverable & Mark Complete</h3>
                <p className="text-[11px] text-slate-500">{showDeliverableModal.title}</p>
              </div>
              <button
                onClick={() => setShowDeliverableModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverableNotes} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Notes, File Links, or Report Remarks
                </label>
                <textarea
                  rows={4}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Summarize your completed findings, provide artifact repository link or report reference..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDeliverableModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Submit Deliverable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
