import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CheckSquare, 
  MapPin, 
  Users, 
  Filter, 
  ArrowUpRight, 
  Sparkles, 
  Flame, 
  Layers, 
  Plus, 
  X, 
  Check, 
  Eye, 
  ShieldCheck, 
  Tag, 
  CalendarDays,
  ListFilter,
  Grid
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CalendarTaskItem {
  id: string | number;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED' | 'UNDER REVIEW';
  department?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  assignedTo?: string | null;
  assignedUserName?: string;
  assignedUserForenclueId?: string;
  isOverdue?: boolean;
  daysRemaining?: number | null;
}

export interface StandardWorkspaceEvent {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  category: 'Meeting' | 'Briefing' | 'Webinar' | 'Orientation' | 'Case Review' | 'Workshop';
  description?: string;
}

export interface TaskAllowedCalendarProps {
  tasks: CalendarTaskItem[];
  user?: any;
  onUpdateTaskStatus?: (taskId: string | number, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void> | void;
  onOpenDeliverable?: (task: CalendarTaskItem) => void;
  className?: string;
}

export const DEFAULT_STANDARD_EVENTS: StandardWorkspaceEvent[] = [
  {
    id: 'evt-01',
    title: 'Weekly Digital Forensics & Incident Response Briefing',
    date: '2026-08-26',
    time: '10:00 AM - 11:30 AM IST',
    location: 'Virtual Workspace Room Alpha',
    attendees: 'All Forensic Wings & Volunteers',
    category: 'Briefing',
    description: 'Review of current active case studies, artifact triage protocols, and sprint deliverable milestones.'
  },
  {
    id: 'evt-02',
    title: 'Memory Dump & Volatile RAM Analysis Workshop',
    date: '2026-08-28',
    time: '03:00 PM - 04:30 PM IST',
    location: 'Forensics Lab Server Room',
    attendees: 'Cyber & Digital Forensics Wing',
    category: 'Workshop',
    description: 'Hands-on volatility plugins training, malware memory injection hunting, and chain of custody documentation.'
  },
  {
    id: 'evt-03',
    title: 'Bi-Weekly Volunteer & Campus Ambassador Sync',
    date: '2026-08-29',
    time: '05:00 PM - 06:00 PM IST',
    location: 'Main Workspace Auditorium',
    attendees: 'Volunteers & Campus Ambassadors',
    category: 'Meeting',
    description: 'Community engagement updates, upcoming cyber awareness workshops, and task recognition.'
  },
  {
    id: 'evt-04',
    title: 'Forensic Case Study Review: Advanced Phishing Campaign',
    date: '2026-08-31',
    time: '02:00 PM - 03:30 PM IST',
    location: 'Case Room Beta',
    attendees: 'Case Study & Research Teams',
    category: 'Case Review',
    description: 'Comprehensive post-mortem analysis of the corporate credential harvesting intrusion campaign.'
  },
  {
    id: 'evt-05',
    title: 'Evidence Packaging & Chain of Custody Standard Orientation',
    date: '2026-09-04',
    time: '11:00 AM - 12:30 PM IST',
    location: 'Workspace Training Hall',
    attendees: 'All Members',
    category: 'Orientation',
    description: 'ISO/IEC 27037 compliance guidelines for digital evidence acquisition and tamper-evident storage.'
  }
];

export function parseStandardDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // Try direct ISO or Date parse
  const direct = new Date(clean);
  if (!isNaN(direct.getTime())) return direct;

  // Try handling "Aug 28, 2026" or "28 Aug 2026"
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const parts = clean.toLowerCase().replace(/,/g, '').split(/\s+/);
  if (parts.length >= 3) {
    let day = -1;
    let month = -1;
    let year = -1;

    for (const p of parts) {
      if (months[p] !== undefined) {
        month = months[p];
      } else if (!isNaN(Number(p))) {
        const num = Number(p);
        if (num > 1000) {
          year = num;
        } else if (day === -1) {
          day = num;
        } else if (year === -1) {
          year = num;
        }
      }
    }

    if (year !== -1 && month !== -1 && day !== -1) {
      return new Date(year, month, day);
    }
  }

  return null;
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const TaskAllowedCalendar: React.FC<TaskAllowedCalendarProps> = ({
  tasks,
  user,
  onUpdateTaskStatus,
  onOpenDeliverable,
  className = ''
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Current workspace date is August 2026
    return new Date(2026, 7, 25);
  });

  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-08-28');
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>('MONTH');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TASKS' | 'EVENTS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [selectedDayTaskModal, setSelectedDayTaskModal] = useState<CalendarTaskItem | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | number | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current year & month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 25));
    setSelectedDateKey('2026-08-25');
  };

  // Map Tasks by Standard Date Key (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTaskItem[]> = {};

    tasks.forEach(task => {
      let dKey: string | null = null;
      if (task.dueDate) {
        const parsed = parseStandardDate(task.dueDate);
        if (parsed) {
          dKey = formatDateKey(parsed);
        }
      }

      // Default fallback if no date specified
      const finalKey = dKey || '2026-08-28';
      if (!map[finalKey]) {
        map[finalKey] = [];
      }
      map[finalKey].push(task);
    });

    return map;
  }, [tasks]);

  // Map Events by Standard Date Key
  const eventsByDate = useMemo(() => {
    const map: Record<string, StandardWorkspaceEvent[]> = {};

    DEFAULT_STANDARD_EVENTS.forEach(evt => {
      const parsed = parseStandardDate(evt.date);
      const key = parsed ? formatDateKey(parsed) : evt.date;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(evt);
    });

    return map;
  }, []);

  // Compute Days for the Month View Grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      dayNumber: number;
      isToday: boolean;
      tasks: CalendarTaskItem[];
      events: StandardWorkspaceEvent[];
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: false,
        dayNumber: dayNum,
        isToday: key === '2026-08-25',
        tasks: tasksByDate[key] || [],
        events: eventsByDate[key] || []
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: true,
        dayNumber: dayNum,
        isToday: key === '2026-08-25',
        tasks: tasksByDate[key] || [],
        events: eventsByDate[key] || []
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: false,
        dayNumber: i,
        isToday: key === '2026-08-25',
        tasks: tasksByDate[key] || [],
        events: eventsByDate[key] || []
      });
    }

    return days;
  }, [currentYear, currentMonth, tasksByDate, eventsByDate]);

  // Selected Day Items
  const selectedDayTasks = useMemo(() => {
    const raw = tasksByDate[selectedDateKey] || [];
    return raw.filter(t => {
      if (statusFilter === 'PENDING') return t.status !== 'COMPLETED';
      if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
      if (statusFilter === 'OVERDUE') return t.isOverdue || (t.daysRemaining !== null && t.daysRemaining !== undefined && t.daysRemaining < 0);
      return true;
    });
  }, [tasksByDate, selectedDateKey, statusFilter]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDateKey] || [];
  }, [eventsByDate, selectedDateKey]);

  // Summary Metrics
  const totalAllotted = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length;
  const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && (t.isOverdue || (t.daysRemaining !== null && t.daysRemaining !== undefined && t.daysRemaining < 0))).length;

  const handleStatusToggle = async (taskId: string | number, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!onUpdateTaskStatus) return;
    try {
      setUpdatingTaskId(taskId);
      await onUpdateTaskStatus(taskId, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getFormattedSelectedDate = () => {
    const parsed = parseStandardDate(selectedDateKey);
    if (!parsed) return selectedDateKey;
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(parsed);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Top Banner & Operational Schedule Overview */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                TASK ALLOWED CALENDAR
              </span>
              <span className="text-xs text-slate-400 font-mono">
                STANDARD WORKSPACE SCHEDULE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <span>Allotted Tasks & Deadlines Calendar</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Standardized calendar showing forensic task deliverables allotted to you alongside official workspace briefings and webinars.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Allotted Tasks</span>
              <span className="text-lg font-black text-slate-900">{totalAllotted}</span>
            </div>
            <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-100 text-center">
              <span className="text-[10px] font-bold text-amber-700 block uppercase">Pending</span>
              <span className="text-lg font-black text-amber-900">{pendingTasks}</span>
            </div>
            <div className="bg-rose-50/70 rounded-2xl p-3 border border-rose-100 text-center">
              <span className="text-[10px] font-bold text-rose-700 block uppercase">Overdue</span>
              <span className="text-lg font-black text-rose-900">{overdueTasks}</span>
            </div>
            <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase">Completed</span>
              <span className="text-lg font-black text-emerald-900">{completedTasks}</span>
            </div>
          </div>
        </div>

        {/* Controls Bar: Navigation, Views & Filters */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Month Navigator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                id="btn-cal-prev-month"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-900 min-w-[130px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                id="btn-cal-next-month"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200"
            >
              Today
            </button>
          </div>

          {/* View Switcher & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === 'MONTH'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Month Grid</span>
              </button>

              <button
                onClick={() => setViewMode('AGENDA')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === 'AGENDA'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Agenda Schedule</span>
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="h-3 w-3 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Items (Tasks + Events)</option>
                <option value="TASKS">Only Allotted Tasks</option>
                <option value="EVENTS">Only Workspace Events</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Viewport & Day Details Split */}
      {viewMode === 'MONTH' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Interactive Calendar Grid (2 Cols on Large) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-3">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-400 py-1 border-b border-slate-100">
              {dayNames.map(day => (
                <div key={day} className="uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const hasTasks = cell.tasks.length > 0 && typeFilter !== 'EVENTS';
                const hasEvents = cell.events.length > 0 && typeFilter !== 'TASKS';
                const hasOverdue = cell.tasks.some(t => t.status !== 'COMPLETED' && (t.isOverdue || (t.daysRemaining !== null && t.daysRemaining !== undefined && t.daysRemaining < 0)));

                return (
                  <button
                    key={`${cell.dateKey}-${idx}`}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`min-h-[78px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-2xl text-left flex flex-col justify-between border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/50'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400'
                    }`}
                  >
                    {/* Top Row of Cell: Day Number & Indicators */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                        cell.isToday
                          ? 'bg-blue-600 text-white font-black'
                          : isSelected
                          ? 'text-blue-700 bg-blue-100'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {hasOverdue && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" title="Overdue tasks" />
                      )}
                    </div>

                    {/* Task and Event Pills */}
                    <div className="space-y-1 mt-1 w-full overflow-hidden">
                      {/* Allotted Tasks Pills */}
                      {hasTasks && cell.tasks.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate font-semibold flex items-center space-x-1 ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100/80 text-emerald-800 line-through'
                              : t.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100/80 text-blue-800'
                          }`}
                          title={`Task: ${t.title}`}
                        >
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}

                      {/* Workspace Event Pills */}
                      {hasEvents && cell.events.slice(0, 1).map((evt) => (
                        <div
                          key={evt.id}
                          className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate font-semibold bg-purple-100/90 text-purple-900 border border-purple-200 flex items-center space-x-1"
                          title={`Event: ${evt.title}`}
                        >
                          <span className="truncate">🗓️ {evt.title}</span>
                        </div>
                      ))}

                      {/* Overflow indicator */}
                      {(cell.tasks.length + cell.events.length) > 2 && (
                        <span className="text-[9px] font-bold text-slate-500 pl-0.5">
                          +{(cell.tasks.length + cell.events.length) - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Inspection Sidebar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    DAY SCHEDULE
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {getFormattedSelectedDate()}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">
                    {selectedDayTasks.length} task{selectedDayTasks.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayTasks.length === 0 && selectedDayEvents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No Items Scheduled</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No task deadlines or official events fall on this date.
                    </p>
                  </div>
                ) : null}

                {/* Allotted Tasks for this Day */}
                {selectedDayTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isUpdating = updatingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : task.priority === 'URGENT'
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                          task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority} PRIORITY
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-600' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {task.department && (
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span>{task.department}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDayTaskModal(task)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          {isCompleted ? (
                            <button
                              onClick={() => handleStatusToggle(task.id, 'IN_PROGRESS')}
                              disabled={isUpdating}
                              className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 rounded-md cursor-pointer"
                            >
                              Re-open
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(task.id, 'COMPLETED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                            >
                              <Check className="h-3 w-3" />
                              <span>{isUpdating ? 'Saving...' : 'Mark Done'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Workspace Events for this Day */}
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                        {evt.category}
                      </span>
                      <span className="text-[11px] font-semibold text-purple-800">
                        {evt.time}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {evt.location}
                      </span>
                      <span className="flex items-center font-medium text-slate-600">
                        <Users className="h-3 w-3 mr-1 text-slate-400" />
                        {evt.attendees}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Footer Link to Tasks page */}
            <div className="pt-3 border-t border-slate-100">
              <Link
                to="/tasks"
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Open Task Board & Submit Deliverables</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* AGENDA SCHEDULE VIEW */
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Chronological Deliverables & Events Agenda</h3>
              <p className="text-xs text-slate-500">All planned deadlines organized by standard date order.</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(tasksByDate).sort().map((dKey) => {
              const dayTasks = tasksByDate[dKey] || [];
              const dayEvents = eventsByDate[dKey] || [];
              const formattedDate = parseStandardDate(dKey) 
                ? new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(parseStandardDate(dKey)!)
                : dKey;

              return (
                <div key={dKey} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <span className="text-xs font-bold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-lg">
                      🗓️ {formattedDate}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'} • {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                            task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {task.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                    ))}

                    {dayEvents.map((evt) => (
                      <div key={evt.id} className="bg-purple-50/80 p-3 rounded-xl border border-purple-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                            {evt.category}
                          </span>
                          <span className="text-[10px] font-semibold text-purple-700">{evt.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                        <p className="text-[10px] text-slate-600">{evt.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedDayTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedDayTaskModal.department || 'Case Study & Forensics'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedDayTaskModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayTaskModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="font-bold text-slate-700 block">Deliverable Description</span>
                <p className="text-slate-600 leading-relaxed">
                  {selectedDayTaskModal.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {selectedDayTaskModal.notes && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-1">
                  <span className="font-bold text-amber-900 block">Mentor Notes & Protocols</span>
                  <p className="text-amber-800 leading-relaxed">
                    {selectedDayTaskModal.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Due Date</span>
                  <span className="font-bold text-slate-800">{selectedDayTaskModal.dueDate || 'Standard'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Priority</span>
                  <span className="font-bold text-slate-800">{selectedDayTaskModal.priority}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                to="/tasks"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <span>Open in Task Workspace</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setSelectedDayTaskModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
