import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Paperclip,
  Download,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Send,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  ImageIcon,
  FileArchive,
  Info
} from 'lucide-react';
import { WorkspaceTask } from '../pages/Tasks';

interface AdminDeliverableReviewModalProps {
  task: WorkspaceTask;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReview: (decision: 'PERFECT' | 'CHANGES_REQUESTED', feedback: string) => Promise<void>;
  isProcessing?: boolean;
}

export const AdminDeliverableReviewModal: React.FC<AdminDeliverableReviewModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirmReview,
  isProcessing = false
}) => {
  const [decision, setDecision] = useState<'PERFECT' | 'CHANGES_REQUESTED'>('PERFECT');
  const [feedback, setFeedback] = useState<string>('Deliverable verified and approved - It is perfect!');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasFiles = Boolean(
    (task.deliverableFiles && task.deliverableFiles.length > 0) ||
    task.deliverableAttachmentUrl
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDecisionSwitch = (newDecision: 'PERFECT' | 'CHANGES_REQUESTED') => {
    setDecision(newDecision);
    setValidationError(null);
    if (newDecision === 'PERFECT') {
      setFeedback('Deliverable verified and approved - It is perfect!');
    } else {
      setFeedback('');
    }
  };

  const applyQuickChangeTag = (tag: string) => {
    setFeedback(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      return `${trimmed}\n• ${tag}`;
    });
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'CHANGES_REQUESTED' && !feedback.trim()) {
      setValidationError('Please specify the exact changes or revisions needed by the member.');
      return;
    }
    setValidationError(null);
    await onConfirmReview(decision, feedback.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[88vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Super Admin QA Review
                </span>
                {task.reviewStatus === 'CHANGES_REQUESTED' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    Changes Requested
                  </span>
                ) : task.status === 'COMPLETED' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Approved
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Awaiting Review
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                {task.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs">

            {/* Member & Submission Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {task.assignedUserName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{task.assignedUserName || 'Assigned Member'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{task.assignedUserForenclueId || 'FC-MEMBER'}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {task.department || 'Forensics'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Due: <strong className="text-slate-700 font-semibold">{task.dueDate || 'Standard'}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-500 justify-end">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Submitted: <strong className="text-slate-700 font-semibold">{task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : 'Recent'}</strong></span>
                </div>
              </div>
            </div>

            {/* Written Findings & Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Member's Written Findings & Remarks</span>
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                {task.deliverableNotes || task.notes || (
                  <span className="text-slate-400 italic">No written remarks submitted by the member.</span>
                )}
              </div>
            </div>

            {/* Media Files & Evidence Attachments */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Media Files & Evidence Attachments</span>
                </h4>
                <span className="text-[10px] font-semibold text-slate-500">
                  {hasFiles ? `${task.deliverableFiles?.length || 1} file(s)` : 'No files'}
                </span>
              </div>

              {hasFiles ? (
                <div className="space-y-2">
                  {task.deliverableFiles && task.deliverableFiles.length > 0 ? (
                    task.deliverableFiles.map((file, idx) => {
                      const isImg = file.type?.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|gif)$/i);
                      const isZip = file.name.match(/\.(zip|tar|gz|7z|rar)$/i);
                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {isImg ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                              />
                            ) : isZip ? (
                              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <FileArchive className="h-5 w-5" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate text-xs">{file.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {formatFileSize(file.size)} • Evidence file
                              </p>
                            </div>
                          </div>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer shrink-0 transition-all min-h-[36px]"
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
                          {task.deliverableAttachmentName || 'Deliverable Evidence File'}
                        </span>
                      </div>
                      <a
                        href={task.deliverableAttachmentUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer shrink-0 transition-all min-h-[36px]"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 text-slate-500">
                  <Info className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-[11px]">
                    No media files attached for this deliverable. The member completed this task with written findings/links only.
                  </span>
                </div>
              )}
            </div>

            {/* External Repository / Artifact Link */}
            {task.deliverableLink && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5">External Repository / Artifact Link</h4>
                <a
                  href={task.deliverableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                >
                  <span className="truncate mr-2">{task.deliverableLink}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              </div>
            )}

            {/* Previous Review Feedback (if present) */}
            {task.reviewFeedback && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Previous Review Note by {task.reviewedByName || 'Super Admin'}:</span>
                  {task.reviewedAt && <span>{new Date(task.reviewedAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-slate-800 italic text-xs">"{task.reviewFeedback}"</p>
              </div>
            )}

            {/* Super Admin Decision Options */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Super Admin Review Decision</span>
              </h4>

              {/* 2 Decision Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Decision 1: Perfect */}
                <button
                  type="button"
                  onClick={() => handleDecisionSwitch('PERFECT')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 min-h-[44px] ${
                    decision === 'PERFECT'
                      ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300/80 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 opacity-85'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    decision === 'PERFECT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 text-xs">It's Perfect</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Approve
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Deliverable meets all standards. Mark task as completed with full celebration.
                    </p>
                  </div>
                </button>

                {/* Decision 2: Tell for Changes */}
                <button
                  type="button"
                  onClick={() => handleDecisionSwitch('CHANGES_REQUESTED')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 min-h-[44px] ${
                    decision === 'CHANGES_REQUESTED'
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300/80 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 opacity-85'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    decision === 'CHANGES_REQUESTED' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 text-xs">Tell for Changes</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        Revisions
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Provide feedback for revisions. Re-opens task so member can update and resubmit.
                    </p>
                  </div>
                </button>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
                  <span>
                    {decision === 'PERFECT' ? 'Approval Note / Commendation:' : 'Tell What Changes Are Needed (Required):'}
                  </span>
                  {decision === 'CHANGES_REQUESTED' && (
                    <span className="text-[10px] text-amber-700 font-semibold">Sent directly to member</span>
                  )}
                </label>

                {decision === 'CHANGES_REQUESTED' && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <span className="text-[10px] text-slate-400 font-medium self-center">Quick tags:</span>
                    {[
                      'Add evidence screenshots/media',
                      'Clarify analysis conclusions',
                      'Verify file hashes & checksums',
                      'Expand methodology details'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => applyQuickChangeTag(tag)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-semibold rounded-md transition-colors cursor-pointer border border-slate-200"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={
                    decision === 'PERFECT'
                      ? 'e.g. Excellent work on the deliverable. Findings verified and approved!'
                      : 'e.g. Please attach the memory dump analysis screenshot and revise section 2 conclusions before final approval.'
                  }
                  className={`w-full p-3 rounded-xl border text-xs text-slate-800 focus:outline-none focus:ring-2 resize-none transition-all ${
                    decision === 'PERFECT'
                      ? 'border-emerald-200 focus:ring-emerald-400 bg-emerald-50/20'
                      : 'border-amber-300 focus:ring-amber-400 bg-amber-50/20'
                  }`}
                />

                {validationError && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center space-x-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center space-x-2 min-h-[44px] ${
                decision === 'PERFECT'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : decision === 'PERFECT' ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>It's Perfect - Approve</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Changes to Member</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
