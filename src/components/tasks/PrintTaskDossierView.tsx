import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  Crown, 
  Layers, 
  Shield, 
  Sparkles,
  FileText
} from 'lucide-react';
import { WorkspaceTask } from '../../pages/Tasks';
import { CANONICAL_DEPARTMENTS, normalizeDepartmentName, getDepartmentMetadata } from './departmentData';
import { WorkspaceMember } from './DepartmentTeamTaskView';

interface PrintTaskDossierViewProps {
  tasks: WorkspaceTask[];
  members: WorkspaceMember[];
  currentUser: any;
  onBackToBoard: () => void;
  onBackToDeptView: () => void;
}

export const PrintTaskDossierView: React.FC<PrintTaskDossierViewProps> = ({
  tasks,
  members,
  currentUser,
  onBackToBoard,
  onBackToDeptView
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Document Ref',
      'Department',
      'Task ID',
      'Task Title',
      'Description / Scope',
      'Assigned Member',
      'ForenClue ID',
      'Role',
      'Priority',
      'Status',
      'Due Date',
      'Review Status'
    ];

    const rows = tasks.map(t => [
      'FC-DOS-2026-TASK',
      `"${(normalizeDepartmentName(t.department) || '').replace(/"/g, '""')}"`,
      `"${String(t.id || '').replace(/"/g, '""')}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.assignedUserName || '').replace(/"/g, '""')}"`,
      t.assignedUserForenclueId || '',
      t.assignedUserRole || '',
      t.priority,
      t.status,
      t.dueDate || '',
      t.reviewStatus || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ForenClue_Task_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouped departmental data
  const groupedDepartments = useMemo(() => {
    return CANONICAL_DEPARTMENTS.map(dept => {
      let deptTasks = tasks.filter(t => normalizeDepartmentName(t.department) === dept.name);
      
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED') {
          deptTasks = deptTasks.filter(t => t.status === 'COMPLETED');
        } else if (statusFilter === 'ACTIVE') {
          deptTasks = deptTasks.filter(t => t.status !== 'COMPLETED');
        } else if (statusFilter === 'UNDER_REVIEW') {
          deptTasks = deptTasks.filter(t => 
            (t.status as string) === 'UNDER REVIEW' || 
            (t.status as string) === 'UNDER_REVIEW' || 
            t.reviewStatus === 'PENDING_REVIEW'
          );
        }
      }

      const deptMembers = members.filter(m => normalizeDepartmentName(m.department) === dept.name);
      const total = deptTasks.length;
      const completed = deptTasks.filter(t => t.status === 'COMPLETED').length;
      const underReview = deptTasks.filter(t => 
        (t.status as string) === 'UNDER REVIEW' || 
        (t.status as string) === 'UNDER_REVIEW' || 
        t.reviewStatus === 'PENDING_REVIEW'
      ).length;
      const inProgress = deptTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const todo = deptTasks.filter(t => t.status === 'TODO').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        metadata: dept,
        tasks: deptTasks,
        members: deptMembers,
        metrics: { total, completed, underReview, inProgress, todo, rate }
      };
    }).filter(d => {
      if (selectedDeptFilter === 'ALL') return true;
      return d.metadata.id === selectedDeptFilter;
    });
  }, [tasks, members, selectedDeptFilter, statusFilter]);

  // Overall dossier metrics
  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const underReviewCount = tasks.filter(t => 
    (t.status as string) === 'UNDER REVIEW' || 
    (t.status as string) === 'UNDER_REVIEW' || 
    t.reviewStatus === 'PENDING_REVIEW'
  ).length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overallRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Interactive Control & Action Toolbar (Hidden during print) */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <span>Printable Task & Department Dossier</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                A4 Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Official executive report formatted for physical printing, PDF export, and internal governance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Departments</option>
              {CANONICAL_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Deliverables</option>
              <option value="COMPLETED" className="bg-slate-900 text-white">Completed Only</option>
              <option value="ACTIVE" className="bg-slate-900 text-white">Active Sprints Only</option>
              <option value="UNDER_REVIEW" className="bg-slate-900 text-white">Under QA Review</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Dossier (PDF)</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download structured CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          {/* Exit View Button */}
          <button
            onClick={onBackToBoard}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE DOSSIER (Visible on screen and rendered during print) */}
      {/* ========================================================================= */}
      <div 
        id="printable-task-dossier"
        className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900"
      >
        {/* Dossier Header Block */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black tracking-wider text-base shadow-sm">
                  FC
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                    ForenClue Forensic Intelligence
                  </h1>
                  <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                    Official Workspace Task Allotment & Departmental Dossier
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase">
                RESTRICTED — INTERNAL RECORD
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                REF: FC-DOS-{new Date().getFullYear()}-Q4
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Generated Timestamp</p>
              <p className="font-semibold text-slate-800">{currentDateFormatted}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Compiled By</p>
              <p className="font-semibold text-slate-800">
                {currentUser?.name || 'Administrator'} ({currentUser?.forenclueId || 'FC-EMP-2026-001'})
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Governance Authority</p>
              <p className="font-semibold text-slate-800">ForenClue Executive Council</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Operational Cycle</p>
              <p className="font-semibold text-slate-800">Q4 Forensic Sprint Milestone</p>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Tasks</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalTasksCount}</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-emerald-50/50">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">Completed</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{completedCount}</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-blue-50/50">
            <p className="text-[10px] font-bold text-blue-800 uppercase">In Progress</p>
            <p className="text-xl font-black text-blue-900 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-indigo-50/50">
            <p className="text-[10px] font-bold text-indigo-800 uppercase">Under QA Review</p>
            <p className="text-xl font-black text-indigo-900 mt-0.5">{underReviewCount}</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-900 text-white">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Velocity Rate</p>
            <p className="text-xl font-black text-white mt-0.5">{overallRate}%</p>
          </div>
        </div>

        {/* Department Sections */}
        <div className="space-y-8 pt-2">
          {groupedDepartments.map((deptItem, idx) => {
            const { metadata, tasks: deptTasks, members: deptMembers, metrics } = deptItem;

            return (
              <div 
                key={metadata.id} 
                className="space-y-3 print-page-break-avoid border-t-2 border-slate-200 pt-5 first:border-t-0 first:pt-0"
              >
                {/* Department Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-xs">
                      {metadata.code}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {metadata.name}
                      </h3>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Lead Mentor: <span className="font-bold text-slate-900">{metadata.mentorName}</span> ({metadata.mentorId})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-semibold text-slate-600">
                      Total Tasks: <strong className="text-slate-950 font-bold">{metrics.total}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">
                      Done: <strong className="font-bold">{metrics.completed}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-blue-700">
                      Active: <strong className="font-bold">{metrics.inProgress + metrics.todo}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-900 font-mono">
                      Rate: {metrics.rate}%
                    </span>
                  </div>
                </div>

                {/* Team Staffing Roster for this Department */}
                {deptMembers.length > 0 && (
                  <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-200/80 text-[11px]">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Department Staffing Roster ({deptMembers.length} Members)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {deptMembers.map(m => {
                        const mTasksCount = deptTasks.filter(t => 
                          (t.assignedTo && String(t.assignedTo) === String(m.id)) ||
                          (t.assignedUserForenclueId && t.assignedUserForenclueId === m.forenclueId)
                        ).length;

                        return (
                          <div 
                            key={m.id}
                            className="bg-white px-2 py-1 rounded-md border border-slate-200 flex items-center space-x-1.5 shadow-2xs"
                          >
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            <span className="font-mono text-slate-400 text-[10px]">({m.forenclueId})</span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-slate-100 text-slate-700">
                              {m.role}
                            </span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                              {mTasksCount} task{mTasksCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Official Deliverables Table */}
                {deptTasks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-lg">
                    No deliverables allotted for this department in the current filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Deliverable & Scope</th>
                          <th className="py-2.5 px-3">Allotted Member</th>
                          <th className="py-2.5 px-3 w-20">Priority</th>
                          <th className="py-2.5 px-3 w-28">Due Date</th>
                          <th className="py-2.5 px-3 w-32">Status / QA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {deptTasks.map((t, tIdx) => {
                          const isCompleted = t.status === 'COMPLETED';
                          const isUnderReview = (t.status as string) === 'UNDER REVIEW' || (t.status as string) === 'UNDER_REVIEW' || t.reviewStatus === 'PENDING_REVIEW';
                          
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                                {tIdx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-900">{t.title}</p>
                                {t.description && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                    {t.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-slate-800">
                                  {t.assignedUserName || 'Unassigned'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {t.assignedUserForenclueId || 'ID Pending'} • {t.assignedUserRole || 'Member'}
                                </p>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  t.priority === 'URGENT'
                                    ? 'bg-rose-100 text-rose-800'
                                    : t.priority === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800'
                                    : t.priority === 'MEDIUM'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                                {t.dueDate || 'TBD'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 w-max ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isUnderReview
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : t.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <span>{isUnderReview ? 'QA Review' : t.status.replace('_', ' ')}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL SIGN-OFF & VERIFICATION BLOCK (Physical / Digital Audit Block) */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t-2 border-slate-900 print-page-break-avoid space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                Official Departmental Chain-of-Custody & Sign-Off
              </h4>
              <p className="text-[10px] text-slate-500">
                Endorsement by Lead Department Mentors and Super Administration verifies deliverable accuracy.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              FORENCLUE AUDIT PROTOCOL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {/* Signature Box 1: Lead Department Mentor */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 flex flex-col justify-between h-36">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Department Lead Mentor</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">Ayush Gaikwad / Mrunmayee Bodhe / Tejas Tapse</p>
                <p className="text-[10px] text-slate-400">Designated Forensic Lead</p>
              </div>
              <div className="border-t border-slate-300 pt-1 text-center">
                <p className="text-[9px] text-slate-400 italic font-serif">Verified Signature & Date</p>
              </div>
            </div>

            {/* Signature Box 2: QA & Review Officer */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 flex flex-col justify-between h-36">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Quality Assurance Officer</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">Mrunmayee Bodhe (FC-EMP-2026-002)</p>
                <p className="text-[10px] text-slate-400">Research & Evidence Evaluation</p>
              </div>
              <div className="border-t border-slate-300 pt-1 text-center">
                <p className="text-[9px] text-slate-400 italic font-serif">Verified Signature & Date</p>
              </div>
            </div>

            {/* Signature Box 3: Super Administrator Executive Sign-off */}
            <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-950 text-white flex flex-col justify-between h-36">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Executive Approval</p>
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-xs font-bold text-white mt-0.5">Tejas Tapse (FC-EMP-2026-001)</p>
                <p className="text-[10px] text-slate-400">Founder & Executive Super Admin</p>
              </div>
              <div className="border-t border-slate-800 pt-1 text-center">
                <p className="text-[9px] text-slate-400 italic font-serif">Official Executive Seal & Record</p>
              </div>
            </div>
          </div>

          {/* Official Footer Note */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
            <span>ForenClue Forensic Intelligence Workspace • work.forenclue.in</span>
            <span>Document Hash: {Math.floor(Date.now() / 1000).toString(16).toUpperCase()} • Confidential</span>
          </div>
        </div>
      </div>
    </div>
  );
};
