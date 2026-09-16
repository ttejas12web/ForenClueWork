import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  CalendarDays
} from 'lucide-react';
import { WorkspaceTask } from '../pages/Tasks';
import { TaskExtensionRequest } from '../lib/firestoreService';

interface TaskExtensionModalProps {
  task: WorkspaceTask;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestedDate: string, reason: string) => Promise<void>;
  onCancelRequest?: () => Promise<void>;
  isSubmitting?: boolean;
}

export const TaskExtensionModal: React.FC<TaskExtensionModalProps> = ({
  task,
  isOpen,
  onClose,
  onSubmit,
  onCancelRequest,
  isSubmitting = false
}) => {
  // Helper to parse existing due date or default to today + 3 days
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const initialDateStr = useMemo(() => {
    // If pending request exists, default to that
    if (task.extensionRequest?.requestedDueDate) {
      const parsed = parseFlexibleDate(task.extensionRequest.requestedDueDate);
      if (parsed) return formatDateToISO(parsed);
    }
    // Else try parsing task dueDate + 3 days
    if (task.dueDate) {
      const parsed = parseFlexibleDate(task.dueDate);
      if (parsed) {
        parsed.setDate(parsed.getDate() + 3);
        return formatDateToISO(parsed);
      }
    }
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return formatDateToISO(d);
  }, [task]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr);
  const [reason, setReason] = useState<string>(task.extensionRequest?.reason || '');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = parseFlexibleDate(initialDateStr) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPending = task.extensionRequest?.status === 'PENDING';

  // Helper functions
  function formatDateToISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseFlexibleDate(str?: string | null): Date | null {
    if (!str) return null;
    const direct = new Date(str);
    if (!isNaN(direct.getTime())) return direct;
    return null;
  }

  function formatReadableDate(dateStr: string): string {
    const parsed = parseFlexibleDate(dateStr);
    if (!parsed) return dateStr;
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Calculate days difference
  const daysDiff = useMemo(() => {
    const current = parseFlexibleDate(task.dueDate) || new Date();
    const target = parseFlexibleDate(selectedDate);
    if (!target) return null;
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [task.dueDate, selectedDate]);

  // Presets
  const applyPreset = (daysToAdd: number) => {
    const base = parseFlexibleDate(task.dueDate) || new Date();
    const newDate = new Date(base);
    newDate.setDate(newDate.getDate() + daysToAdd);
    const iso = formatDateToISO(newDate);
    setSelectedDate(iso);
    setCalendarMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    setErrorMsg(null);
  };

  // Mini Interactive Calendar Grid
  const currentCalYear = calendarMonth.getFullYear();
  const currentCalMonth = calendarMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calDays = useMemo(() => {
    const firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const daysInCurrent = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    const days: Array<{ dayNum: number; iso: string; isCurrentMonth: boolean; isPast: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(currentCalYear, currentCalMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(currentCalYear, currentCalMonth - 1, prevMonthDays - i);
      days.push({
        dayNum: prevMonthDays - i,
        iso: formatDateToISO(prevDate),
        isCurrentMonth: false,
        isPast: formatDateToISO(prevDate) < todayStr
      });
    }

    // Current month
    for (let i = 1; i <= daysInCurrent; i++) {
      const curDate = new Date(currentCalYear, currentCalMonth, i);
      const iso = formatDateToISO(curDate);
      days.push({
        dayNum: i,
        iso,
        isCurrentMonth: true,
        isPast: iso < todayStr
      });
    }

    // Next month padding to fill complete grid
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(currentCalYear, currentCalMonth + 1, i);
        days.push({
          dayNum: i,
          iso: formatDateToISO(nextDate),
          isCurrentMonth: false,
          isPast: false
        });
      }
    }

    return days;
  }, [currentCalYear, currentCalMonth, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setErrorMsg('Please select a requested deadline date.');
      return;
    }
    if (selectedDate <= todayStr) {
      setErrorMsg('Requested extension date must be in the future.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a brief justification/reason for the extension.');
      return;
    }
    setErrorMsg(null);
    await onSubmit(formatReadableDate(selectedDate), reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                DEADLINE EXTENSION REQUEST
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                {task.title}
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

        {/* Current Deadline & Task Details Banner */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Current Allotted Deadline
            </span>
            <span className="text-slate-900 font-bold flex items-center mt-0.5">
              <Clock className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
              {task.dueDate || 'Standard Deadline'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-[11px]">
              {task.department || 'Forensics'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
              task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
              task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Existing Pending Request Notice (If already requested) */}
        {isPending && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Active Extension Request Pending Review</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-700">
                Requested to: {task.extensionRequest?.requestedDueDate}
              </span>
            </div>
            <p className="text-amber-800 text-[11px] italic">
              "{task.extensionRequest?.reason}"
            </p>
            {onCancelRequest && (
              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={onCancelRequest}
                  disabled={isSubmitting}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                >
                  Withdraw this request
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Calendar Option: Interactive Date Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <span>Select New Proposed Deadline (Calendar Option)</span>
              </label>

              {daysDiff !== null && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  daysDiff > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700'
                }`}>
                  {daysDiff > 0 ? `+${daysDiff} Days Extension` : `${daysDiff} Days`}
                </span>
              )}
            </div>

            {/* Quick Extension Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {[
                { label: '+2 Days', days: 2 },
                { label: '+4 Days', days: 4 },
                { label: '+1 Week', days: 7 },
                { label: '+2 Weeks', days: 14 }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 rounded-lg border border-transparent transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Visual Mini Calendar Box */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(currentCalYear, currentCalMonth - 1, 1))}
                  className="p-1 hover:bg-white text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-800">
                  {monthNames[currentCalMonth]} {currentCalYear}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(currentCalYear, currentCalMonth + 1, 1))}
                  className="p-1 hover:bg-white text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((cell, idx) => {
                  const isSelected = selectedDate === cell.iso;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={cell.isPast}
                      onClick={() => {
                        setSelectedDate(cell.iso);
                        setErrorMsg(null);
                      }}
                      className={`h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        cell.isPast
                          ? 'text-slate-300 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs scale-105'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 hover:bg-white hover:text-blue-600 cursor-pointer'
                          : 'text-slate-400 hover:bg-white hover:text-slate-700 cursor-pointer'
                      }`}
                    >
                      {cell.dayNum}
                    </button>
                  );
                })}
              </div>

              {/* HTML5 Native Date input for accessibility / direct precision input */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Selected Date:
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      const parsed = parseFlexibleDate(e.target.value);
                      if (parsed) {
                        setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
                      }
                      setErrorMsg(null);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reason / Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Reason for Extension Request</span>
              <span className="text-[10px] text-slate-400 font-normal">Super Admin will review this note</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              rows={3}
              placeholder="E.g., Additional forensic memory dump triage required, encountered corrupt evidence image, academic examination period..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400 leading-relaxed"
              required
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{isPending ? 'Update Extension Request' : 'Submit Extension Request'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
