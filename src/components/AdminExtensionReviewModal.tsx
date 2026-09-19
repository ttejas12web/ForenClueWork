import React, { useState } from 'react';
import {
  CalendarClock,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { WorkspaceTask } from '../pages/Tasks';

interface AdminExtensionReviewModalProps {
  task: WorkspaceTask;
  mode: 'APPROVE' | 'DISAPPROVE';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const AdminExtensionReviewModal: React.FC<AdminExtensionReviewModalProps> = ({
  task,
  mode,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false
}) => {
  const [note, setNote] = useState<string>(mode === 'APPROVE' ? 'Approved by Super Admin' : '');

  if (!isOpen || !task.extensionRequest) return null;

  const ext = task.extensionRequest;
  const isApprove = mode === 'APPROVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(note.trim() || (isApprove ? 'Approved' : 'Disapproved by Super Admin'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isApprove
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {isApprove ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isApprove ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'
              }`}>
                {isApprove ? 'SUPER ADMIN APPROVAL' : 'SUPER ADMIN DISAPPROVAL'}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                {isApprove ? 'Approve Deadline Extension' : 'Disapprove Deadline Extension'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task & Request Details */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold text-slate-700">{task.title}</span>
              <span className="font-mono text-[11px] text-slate-400">{task.department || 'Forensics'}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested by Member</span>
                <span className="font-bold text-slate-800 flex items-center mt-0.5">
                  <User className="h-3.5 w-3.5 text-blue-600 mr-1" />
                  {ext.requestedByName || task.assignedUserName || 'Assigned Member'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Deadline</span>
                <span className="font-bold text-slate-700">{task.dueDate || 'Standard'}</span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center">
                <CalendarClock className="h-4 w-4 mr-1.5 text-blue-600" />
                Requested Extension Deadline:
              </span>
              <span className="font-black text-blue-700 text-sm">
                {ext.requestedDueDate}
              </span>
            </div>

            {/* Member's stated reason */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Member's Reason for Request:
              </span>
              <p className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 italic leading-relaxed text-xs">
                "{ext.reason}"
              </p>
            </div>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>{isApprove ? 'Approval Note / Feedback (Optional)' : 'Disapproval Reason / Feedback to Member'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isApprove ? 'Sent in member notification' : 'Required for member clarity'}
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                isApprove
                  ? 'E.g., Approved. Please ensure thorough artifact documentation is included.'
                  : 'E.g., Cannot extend due to upcoming client audit. Please submit preliminary findings.'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
              required={!isApprove}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            {isApprove ? (
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve & Update Deadline</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isProcessing || !note.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Disapproving...</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>Confirm Disapproval</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
