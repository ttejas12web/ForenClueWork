import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Upload,
  Image as ImageIcon,
  FileCode,
  Download,
  Paperclip,
  Cloud,
  Eye
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  subscribeToTasks,
  subscribeToUsers,
  createFirestoreTask,
  updateFirestoreTask,
  deleteFirestoreTask,
  submitTaskDeliverable,
  uploadTaskAttachment,
  FirestoreTask,
  FirestoreUser
} from '../lib/firestoreService';
import {
  uploadWorkspaceFile,
  UploadResult
} from '../lib/storageService';

export interface WorkspaceTask {
  id: any;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED' | 'UNDER REVIEW';
  progress?: number;
  assignedTo: any;
  department: string | null;
  dueDate: string | null;
  createdBy: any;
  notes: string | null;
  deliverableNotes?: string | null;
  deliverableLink?: string | null;
  deliverableAttachmentUrl?: string | null;
  deliverableAttachmentName?: string | null;
  deliverableAttachmentType?: string | null;
  deliverableFiles?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  }>;
  submittedAt?: string | null;
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
  id: any;
  forenclueId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
}

export const DEPARTMENTS = [
  'Case Study',
  'Research',
  'Events & Management',
  'Cyber & Digital Forensics',
  'Creative & Graphics',
  'Executive & Administration'
];

interface UploadedFileItem {
  name: string;
  url: string;
  size?: number;
  type?: string;
  storageProvider?: string;
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

  // Modals & Form States
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  
  // Deliverable Submission Modal (For Allotted Member)
  const [showDeliverableModal, setShowDeliverableModal] = useState<WorkspaceTask | null>(null);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableLink, setDeliverableLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Deliverables Modal (For Admin & Member inspection)
  const [viewDeliverableModal, setViewDeliverableModal] = useState<WorkspaceTask | null>(null);


  // Notifications Toast
  const [notificationToast, setNotificationToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({ 
    show: false, 
    msg: '', 
    type: 'success' 
  });

  // Allot task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDept, setTaskDept] = useState('Cyber & Digital Forensics');
  const [taskDueDate, setTaskDueDate] = useState('Aug 28, 2026');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState('');
  const [memberSearchInModal, setMemberSearchInModal] = useState('');
  const [taskReferenceFile, setTaskReferenceFile] = useState<File | null>(null);
  const [taskReferenceFileInfo, setTaskReferenceFileInfo] = useState<{name: string, url: string, type: string} | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotificationToast({ show: true, msg, type });
    setTimeout(() => {
      setNotificationToast({ show: false, msg: '', type: 'success' });
    }, 4000);
  };

  // Subscribe to tasks & members
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubUsers = subscribeToUsers((usersList) => {
      setMembers(usersList as unknown as WorkspaceMember[]);
    });

    const unsubTasks = subscribeToTasks((tasksList) => {
      let filtered = tasksList;
      
      if (isSuperAdmin && selectedMemberFilter !== 'ALL') {
        filtered = filtered.filter(t => String(t.assignedTo) === selectedMemberFilter);
      }
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter(t => t.status === statusFilter);
      }
      if (priorityFilter !== 'ALL') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
      }
      
      setTasks(filtered as unknown as WorkspaceTask[]);
      setLoading(false);
    }, user.id, user.role);

    return () => {
      unsubUsers();
      unsubTasks();
    };
  }, [user, statusFilter, selectedMemberFilter, priorityFilter]);

  // Open Allot Task Modal
  const handleOpenCreateModal = (inputDept?: unknown) => {
    const defaultDept = typeof inputDept === 'string' && inputDept.trim() ? inputDept.trim() : 'Case Study';
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskDept(defaultDept);
    setTaskDueDate('Aug 28, 2026');
    const targetDeptClean = defaultDept.toLowerCase();
    const associatedMembers = members.filter(
      m => (typeof m.department === 'string' ? m.department.trim().toLowerCase() : '') === targetDeptClean
    );
    setTaskAssignedTo(associatedMembers.length > 0 ? String(associatedMembers[0].id) : '');
    setTaskNotes('');
    setMemberSearchInModal('');
    setTaskReferenceFile(null);
    setTaskReferenceFileInfo(null);
    setShowAllotModal(true);
  };

  // Open Edit Task Modal
  const handleOpenEditModal = (task: WorkspaceTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    const dept = typeof task.department === 'string' && task.department.trim() ? task.department.trim() : 'Case Study';
    setTaskDept(dept);
    setTaskDueDate(task.dueDate || 'Aug 28, 2026');
    setTaskAssignedTo(task.assignedTo ? String(task.assignedTo) : '');
    setTaskNotes(task.notes || '');
    setMemberSearchInModal('');
    setTaskReferenceFile(null);
    setTaskReferenceFileInfo(task.referenceAttachmentUrl ? {
      url: task.referenceAttachmentUrl,
      name: task.referenceAttachmentName || 'Attachment',
      type: task.referenceAttachmentType || 'file'
    } : null);
    setShowAllotModal(true);
  };

  // Handle department change in modal
  const handleDepartmentChange = (newDept: string) => {
    const validDept = typeof newDept === 'string' && newDept.trim() ? newDept.trim() : 'Case Study';
    setTaskDept(validDept);
    const targetDeptClean = validDept.toLowerCase();
    const associatedMembers = members.filter(
      m => (typeof m.department === 'string' ? m.department.trim().toLowerCase() : '') === targetDeptClean
    );
    if (!associatedMembers.some(m => String(m.id) === String(taskAssignedTo))) {
      setTaskAssignedTo(associatedMembers.length > 0 ? String(associatedMembers[0].id) : '');
    }
  };

  // Create or Update Task (Super Admin)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user) return;

    try {
      setActionLoading(true);
      
      const assignedUser = members.find(m => String(m.id) === String(taskAssignedTo));
      
      const payload: Partial<FirestoreTask> = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority as any,
        department: taskDept,
        dueDate: taskDueDate.trim(),
        assignedTo: taskAssignedTo || null,
        assignedUserName: assignedUser?.name,
        assignedUserEmail: assignedUser?.email,
        assignedUserForenclueId: assignedUser?.forenclueId,
        assignedUserRole: assignedUser?.role,
        notes: taskNotes.trim(),
      };

      if (taskReferenceFile) {
        const uploadRes = await uploadTaskAttachment(taskReferenceFile);
        payload.referenceAttachmentUrl = uploadRes.url;
        payload.referenceAttachmentName = uploadRes.name;
        payload.referenceAttachmentType = uploadRes.type;
      }

      if (editingTask) {
        await updateFirestoreTask(editingTask.id, payload);
        showToast(
          assignedUser 
            ? `Task updated and allotted to ${assignedUser.name} (${assignedUser.forenclueId}). Notification sent!`
            : 'Task updated successfully.'
        );
      } else {
        payload.createdBy = user.id;
        payload.creatorName = user.name;
        payload.creatorForenclueId = user.forenclueId;
        payload.status = 'TODO';
        
        await createFirestoreTask(payload);
        showToast(
          assignedUser 
            ? `Task allotted to ${assignedUser.name} (${assignedUser.forenclueId}). Real-time panel alert sent!` 
            : 'Task created in workspace pool.'
        );
      }

      setShowAllotModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgress = async (task: WorkspaceTask, progress: number) => {
    if (!user) return;
    try {
      const updates: Partial<FirestoreTask> = { progress };
      if (progress > 0 && task.status === 'TODO') {
        updates.status = 'IN_PROGRESS';
      }
      await updateFirestoreTask(task.id, updates);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update progress');
    }
  };

  // Status Change for Allotted Member
  const handleStartWorking = async (taskId: any) => {
    if (!user) return;
    try {
      setActionLoading(true);
      await updateFirestoreTask(taskId, { status: 'IN_PROGRESS' });
      showToast('You have started working on this deliverable! Super Admin can see active progress.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Task (Super Admin)
  const handleDeleteTask = async (taskId: any) => {
    if (!user || !window.confirm('Are you sure you want to delete this workspace task?')) return;
    try {
      await deleteFirestoreTask(taskId);
      showToast('Task removed from workspace.');
    } catch (err) {
      console.error(err);
    }
  };

  // Open Deliverable Modal for Allotted Member
  const handleOpenDeliverableModal = (task: WorkspaceTask) => {
    setShowDeliverableModal(task);
    setDeliverableNotes(task.deliverableNotes || task.notes || '');
    setDeliverableLink(task.deliverableLink || '');
    
    // Load previously uploaded files if existing
    if (task.deliverableFiles && task.deliverableFiles.length > 0) {
      setUploadedFiles(task.deliverableFiles.map(f => ({
        name: f.name,
        url: f.url,
        size: f.size,
        type: f.type,
        storageProvider: 'cloud_storage'
      })));
    } else if (task.deliverableAttachmentUrl) {
      setUploadedFiles([{
        name: task.deliverableAttachmentName || 'Attached Deliverable File',
        url: task.deliverableAttachmentUrl,
        type: task.deliverableAttachmentType || 'file',
        storageProvider: 'cloud_storage'
      }]);
    } else {
      setUploadedFiles([]);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingFiles(true);
      const newUploadedList: UploadedFileItem[] = [...uploadedFiles];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result: UploadResult = await uploadWorkspaceFile(file, file.name, 'task_deliverables', token);
        newUploadedList.push({
          name: result.name,
          url: result.url,
          size: result.size,
          type: result.type,
          storageProvider: result.storageProvider
        });
      }

      setUploadedFiles(newUploadedList);
      showToast(`Uploaded ${files.length} file(s) successfully.`);
    } catch (err: any) {
      console.error('File upload error:', err);
      alert('Upload error: ' + (err.message || 'Failed to upload file'));
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file item
  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Deliverable to Firestore with attachments (Allotted Member)
  const handleSaveDeliverableSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDeliverableModal || !user) return;
    if (!deliverableNotes.trim() && uploadedFiles.length === 0 && !deliverableLink.trim()) {
      alert('Please provide deliverable notes, upload evidence files/photos, or provide a deliverable link.');
      return;
    }

    try {
      setActionLoading(true);
      const primaryAttachment = uploadedFiles[0];

      await submitTaskDeliverable(
        showDeliverableModal.id,
        deliverableNotes.trim(),
        deliverableLink.trim(),
        primaryAttachment?.url || '',
        primaryAttachment?.name || '',
        primaryAttachment?.type || '',
        uploadedFiles.map(f => ({
          name: f.name,
          url: f.url,
          size: f.size,
          type: f.type,
          uploadedAt: new Date().toISOString()
        }))
      );

      setShowDeliverableModal(null);
      showToast('Deliverable & evidence files submitted successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit deliverable');
    } finally {
      setActionLoading(false);
    }
  };


  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Client-side search filtering
  const filteredTasks = tasks.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.assignedUserName && t.assignedUserName.toLowerCase().includes(query)) ||
      (t.assignedUserForenclueId && t.assignedUserForenclueId.toLowerCase().includes(query)) ||
      (t.department && t.department.toLowerCase().includes(query));

    return matchesQuery;
  });

  // Calculate quick stats
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

  // Department-associated members in the modal
  const cleanTaskDept = typeof taskDept === 'string' ? taskDept.trim().toLowerCase() : '';
  const deptMembersForModal = members.filter(m => {
    if (!cleanTaskDept) return true;
    const mDept = typeof m.department === 'string' ? m.department.trim().toLowerCase() : '';
    return mDept === cleanTaskDept;
  });

  const filteredMembersForModal = deptMembersForModal.filter(m => {
    const q = memberSearchInModal.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.forenclueId.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
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
                {isSuperAdmin ? 'SUPER ADMIN WORKSPACE PANEL' : 'MY ALLOTTED DELIVERABLES'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.forenclueId}
              </span>
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                <Cloud className="h-3 w-3 text-emerald-600" />
                <span>Encrypted Storage</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isSuperAdmin ? 'Workspace Task Allotment & Deliverables Tracker' : 'My Allotted Deliverables & Tasks'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Create, allot, and monitor live progress of forensic deliverables allotted to workspace members.'
                : 'Tasks allotted specifically to you. Click "Start Working" to begin, and submit your completed deliverables and evidence files.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {isSuperAdmin && (
              <>
                <div
                  className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold min-h-[44px]"
                  title="Storage credentials are managed securely by the server"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Secure Backend Storage</span>
                </div>

                <button
                  id="btn-allot-new-task"
                  onClick={() => handleOpenCreateModal()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Allot Task to Member</span>
                </button>
              </>
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

          {/* Super Admin Filter by Assigned Member & Priority */}
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
              onClick={() => handleOpenCreateModal()}
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
            const isCompleted = task.status === 'COMPLETED' || task.status === 'SUBMITTED';
            const isInProgress = task.status === 'IN_PROGRESS';
            const isTodo = task.status === 'TODO';

            // Check if currently logged in user is the worker/allotted member of this task
            const isAllottedWorker = Boolean(
              user && (
                (task.assignedTo && String(task.assignedTo) === String(user.id)) ||
                (task.assignedUserForenclueId && task.assignedUserForenclueId === user.forenclueId)
              )
            );

            // Progress percentage
            const progressPct = task.progress ?? (isCompleted ? 100 : isInProgress ? 50 : 0);
            const hasDeliverableFiles = (task.deliverableFiles && task.deliverableFiles.length > 0) || Boolean(task.deliverableAttachmentUrl);

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
                          ? 'bg-blue-100 text-blue-800'
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

                  {/* Reference Attachment Preview */}
                  {task.referenceAttachmentUrl && (
                    <div className="mt-2.5">
                      <a
                        href={task.referenceAttachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:text-blue-800 transition-colors cursor-pointer w-full max-w-xs overflow-hidden group"
                      >
                        <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Paperclip className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">Reference Material</p>
                          <p className="text-[10px] font-medium text-blue-500/80 truncate">{task.referenceAttachmentName || 'Attached Document'}</p>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Member Allotment Badge */}
                  <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className={`h-7 w-7 rounded-lg font-bold text-[11px] flex items-center justify-center flex-shrink-0 ${
                        isAllottedWorker ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {task.assignedUserName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {task.assignedUserName ? task.assignedUserName : 'Unassigned'}
                          </p>
                          {isAllottedWorker && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {task.assignedUserForenclueId || 'General Pool'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-medium shrink-0">
                      {task.assignedUserRole?.replace('_', ' ') || 'Team'}
                    </span>
                  </div>

                  {/* Visual Progress Bar (Admins & Members can track progress) */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>Progress Tracking</span>
                      <span className={isCompleted ? 'text-emerald-600 font-bold' : isInProgress ? 'text-blue-600' : 'text-slate-400'}>
                        {progressPct}% • {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex items-center relative bg-slate-100 group">
                      {isAllottedWorker && !isCompleted && (
                        <div className="absolute inset-0 flex">
                          {[0, 25, 50, 75, 100].map(pct => (
                            <button 
                              key={pct}
                              onClick={() => handleUpdateProgress(task, pct)}
                              className="flex-1 h-full z-10 hover:bg-black/10 transition-colors cursor-pointer"
                              title={`Set progress to ${pct}%`}
                            />
                          ))}
                        </div>
                      )}
                      <div 
                        className={`h-full transition-all duration-300 pointer-events-none relative z-0 ${
                          isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {isAllottedWorker && !isCompleted && (
                      <div className="flex justify-between w-full px-0.5 mt-0.5">
                        {[0, 25, 50, 75, 100].map(pct => (
                          <span 
                            key={pct} 
                            className={`text-[8px] font-medium cursor-pointer transition-colors ${progressPct >= pct ? 'text-blue-600 hover:text-blue-700' : 'text-slate-300 hover:text-slate-500'}`} 
                            onClick={() => handleUpdateProgress(task, pct)}
                          >
                            {pct}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deliverable Evidence Preview Pill (If submitted or attachments exist) */}
                  {(task.deliverableNotes || task.notes || hasDeliverableFiles) && (
                    <div className="mt-2.5 p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-950">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Deliverable Submitted:
                        </span>
                        {hasDeliverableFiles && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-mono">
                            {task.deliverableFiles?.length || 1} file(s) attached
                          </span>
                        )}
                      </div>
                      {task.deliverableNotes || task.notes ? (
                        <p className="line-clamp-2 italic text-emerald-900/90 text-[11px]">
                          {task.deliverableNotes || task.notes}
                        </p>
                      ) : null}
                      
                      <button
                        type="button"
                        onClick={() => setViewDeliverableModal(task)}
                        className="mt-1.5 text-[10px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect Files & Notes</span>
                      </button>
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

                  {/* Interactive Buttons (Strict Role-Based Permitted Actions) */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    
                    {/* SCENARIO 1: LOGGED IN USER IS THE ALLOTTED MEMBER */}
                    {isAllottedWorker ? (
                      <div className="flex items-center space-x-1.5 flex-1">
                        {isTodo && (
                          <button
                            id={`btn-start-working-${task.id}`}
                            onClick={() => handleStartWorking(task.id)}
                            disabled={actionLoading}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>Start Working</span>
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            id={`btn-submit-deliverable-${task.id}`}
                            onClick={() => handleOpenDeliverableModal(task)}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Submit & Complete</span>
                          </button>
                        )}

                        {isCompleted && (
                          <div className="flex items-center space-x-1 flex-1">
                            <button
                              onClick={() => setViewDeliverableModal(task)}
                              className="flex-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>View Submitted</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeliverableModal(task)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                              title="Update Deliverable submission notes or files"
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* SCENARIO 2: ADMIN / SUPER ADMIN VIEWING TASKS ALLOTTED TO OTHER MEMBERS */
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex items-center space-x-1.5">
                          {isCompleted ? (
                            <button
                              onClick={() => setViewDeliverableModal(task)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3 text-emerald-600" />
                              <span>View Deliverable</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{isInProgress ? 'Member working...' : 'Awaiting start'}</span>
                            </span>
                          )}
                        </div>

                        {/* Super Admin Control Options (Edit/Delete) */}
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

              {/* Department & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Department *</label>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {deptMembersForModal.length} member{deptMembersForModal.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <select
                    value={taskDept}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              {/* Allot To Workspace Member Picker (Associated with selected Department) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Allot to Workspace Member in <span className="text-blue-600">{taskDept}</span> *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Department filtered
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Filter ${taskDept} members by name or ForenClue ID...`}
                      value={memberSearchInModal}
                      onChange={(e) => setMemberSearchInModal(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {deptMembersForModal.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs font-semibold text-slate-600">No members currently assigned to {taskDept}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Assign members to this department in the Teams or Admin tab.</p>
                      </div>
                    ) : filteredMembersForModal.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No members in {taskDept} match "{memberSearchInModal}".
                      </div>
                    ) : (
                      filteredMembersForModal.map((member) => {
                        const isSelected = taskAssignedTo === String(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => setTaskAssignedTo(String(member.id))}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50/90 border-l-4 border-l-blue-600 shadow-xs' 
                                : 'hover:bg-white bg-white/60'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                                  {isSelected && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 inline" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <p className="text-[10px] font-mono text-slate-400 truncate">{member.forenclueId}</p>
                                  <span className="text-[9px] text-slate-400">•</span>
                                  <span className="text-[9px] text-blue-600/80 font-medium truncate">{member.department || taskDept}</span>
                                </div>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md shrink-0 ${
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
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

              {/* Reference Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attach Reference Document/Image (Optional)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="reference-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setTaskReferenceFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="reference-upload"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium cursor-pointer transition flex items-center space-x-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Choose File</span>
                  </label>
                  {(taskReferenceFile || taskReferenceFileInfo) && (
                    <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex-1 min-w-0">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] font-medium truncate">
                        {taskReferenceFile ? taskReferenceFile.name : taskReferenceFileInfo?.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setTaskReferenceFile(null);
                          setTaskReferenceFileInfo(null);
                        }} 
                        className="text-blue-400 hover:text-blue-700 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
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

      {/* ================= SUBMIT DELIVERABLE & UPLOAD MODAL (FOR ALLOTTED MEMBER) ================= */}
      {showDeliverableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submit Deliverable & Mark Complete</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-sm">{showDeliverableModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeliverableModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverableSubmission} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Deliverable Notes / Findings Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Summary & Forensic Findings *
                </label>
                <textarea
                  rows={4}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Summarize your key findings, completed steps, methodology used, analysis results, or notes for the Super Admin..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Deliverable Evidence / Files / Photos Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Upload Deliverable Files & Evidence
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                    <Cloud className="h-3 w-3" />
                    <span>Secure Storage</span>
                  </span>
                </div>

                {/* Upload Trigger Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.zip,.rar,.tar,.gz,.txt,.csv,.json,.pcap,.dd,.raw"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="h-9 w-9 rounded-xl bg-white shadow-xs border border-slate-200 text-emerald-600 flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {isUploadingFiles ? 'Uploading files...' : 'Click or Drag & Drop to upload files/photos'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Evidence photos (PNG/JPG), Forensic dumps, PDF reports, ZIP archives
                  </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-[11px] font-bold text-slate-600">Attached Deliverables ({uploadedFiles.length})</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, idx) => {
                        const isImg = file.type?.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|gif)$/i);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {isImg ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  referrerPolicy="no-referrer"
                                  className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate text-[11px]">{file.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(file.size)} • Encrypted Attachment
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Deliverable Link (GitHub, Drive, or Cloud Repository) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  External Repository or Artifact Link (Optional)
                </label>
                <div className="relative">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={deliverableLink}
                    onChange={(e) => setDeliverableLink(e.target.value)}
                    placeholder="https://github.com/... or https://drive.google.com/..."
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
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
                  disabled={actionLoading || isUploadingFiles}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Submit Deliverable & Mark Complete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW DELIVERABLE DETAILS MODAL (FOR ADMIN & WORKER) ================= */}
      {viewDeliverableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Deliverable Review</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{viewDeliverableModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewDeliverableModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Assigned Member & Status Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {viewDeliverableModal.assignedUserName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{viewDeliverableModal.assignedUserName || 'Member'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{viewDeliverableModal.assignedUserForenclueId}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {viewDeliverableModal.status.replace('_', ' ')}
                </span>
              </div>

              {/* Deliverable Notes & Findings */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>Submission Findings & Remarks</span>
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewDeliverableModal.deliverableNotes || viewDeliverableModal.notes || 'No written remarks provided.'}
                </div>
              </div>

              {/* Attached Files & Photos */}
              {((viewDeliverableModal.deliverableFiles && viewDeliverableModal.deliverableFiles.length > 0) || viewDeliverableModal.deliverableAttachmentUrl) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                    <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Attached Evidence & Files</span>
                  </h4>
                  <div className="space-y-2">
                    {viewDeliverableModal.deliverableFiles && viewDeliverableModal.deliverableFiles.length > 0 ? (
                      viewDeliverableModal.deliverableFiles.map((file, idx) => {
                        const isImg = file.type?.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|gif)$/i);
                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {isImg ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  referrerPolicy="no-referrer"
                                  className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate text-xs">{file.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(file.size)} • Verified Attachment
                                </p>
                              </div>
                            </div>

                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                              <Download className="h-3 w-3" />
                              <span>Open / Download</span>
                            </a>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-800 truncate">
                            {viewDeliverableModal.deliverableAttachmentName || 'Attached Evidence File'}
                          </span>
                        </div>
                        <a
                          href={viewDeliverableModal.deliverableAttachmentUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* External Artifact Repository Link */}
              {viewDeliverableModal.deliverableLink && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5">External Repository Link</h4>
                  <a
                    href={viewDeliverableModal.deliverableLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <span className="truncate mr-2">{viewDeliverableModal.deliverableLink}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewDeliverableModal(null)}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
