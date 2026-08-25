import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  X, 
  AlertCircle, 
  Grid, 
  List, 
  CheckSquare, 
  CalendarDays, 
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { TaskAllowedCalendar, DEFAULT_STANDARD_EVENTS, StandardWorkspaceEvent, CalendarTaskItem } from '../components/TaskAllowedCalendar';

export const Calendar: React.FC = () => {
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'CALENDAR_VIEW' | 'EVENTS_GRID' | 'MY_TASKS'>('CALENDAR_VIEW');
  
  // Workspace Events State with Standard Initial Data
  const [events, setEvents] = useState<StandardWorkspaceEvent[]>(() => {
    const saved = localStorage.getItem('forenclue_workspace_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_STANDARD_EVENTS;
  });

  // Allotted Tasks State
  const [tasks, setTasks] = useState<CalendarTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-08-28');
  const [time, setTime] = useState('10:00 AM - 11:30 AM IST');
  const [location, setLocation] = useState('Virtual Room Alpha');
  const [attendees, setAttendees] = useState('All Workspace Members');
  const [category, setCategory] = useState<'Meeting' | 'Briefing' | 'Webinar' | 'Orientation' | 'Case Review' | 'Workshop'>('Briefing');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Persist Events
  useEffect(() => {
    localStorage.setItem('forenclue_workspace_events', JSON.stringify(events));
  }, [events]);

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
  }, [token, user]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      if (token) {
        const res = await apiFetch('/api/analytics/workspace-insights', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data?.userMetrics?.tasks) {
            setTasks(data.userMetrics.tasks);
            setLoadingTasks(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch insights, falling back to tasks endpoint', e);
    }

    try {
      const res = await apiFetch('/api/tasks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data)) {
          const mapped: CalendarTaskItem[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority || 'MEDIUM',
            status: t.status === 'COMPLETED' ? 'COMPLETED' : t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO',
            department: t.department || 'Digital Forensics',
            dueDate: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : '2026-08-28',
            notes: t.notes || null,
            isOverdue: t.status !== 'COMPLETED' && t.deadline && t.deadline < Date.now()
          }));
          setTasks(mapped);
        }
      }
    } catch (e) {
      console.error('Tasks fetch error:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) {
      setError('Please provide event title and standard date.');
      return;
    }

    const newEvent: StandardWorkspaceEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      date: date.trim(),
      time: time.trim() || '10:00 AM - 11:30 AM IST',
      location: location.trim() || 'Virtual Workspace Room',
      attendees: attendees.trim() || 'All Workspace Members',
      category: category,
      description: description.trim() || undefined
    };

    setEvents([newEvent, ...events]);
    setTitle('');
    setDate('2026-08-28');
    setTime('10:00 AM - 11:30 AM IST');
    setLocation('Virtual Room Alpha');
    setAttendees('All Workspace Members');
    setDescription('');
    setError('');
    setShowModal(false);
    setSuccessMsg(`Scheduled "${newEvent.title}" successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to remove this scheduled workspace event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = searchQuery === '' || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [events, searchQuery, categoryFilter]);

  const handleUpdateTaskStatus = async (taskId: string | number, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      if (token) {
        await apiFetch(`/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) {
      console.error('Task status update failed:', e);
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              OPERATIONAL TIMELINES
            </span>
            <span className="text-xs text-slate-400 font-mono">
              STANDARD WORKSPACE CALENDAR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Workspace Calendar & Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Standard calendar integrating official case study milestones, volatile forensics workshops, webinars, and member tasks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              id="btn-schedule-new-event"
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[40px]"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Event</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
          <button
            onClick={() => setActiveTab('CALENDAR_VIEW')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CALENDAR_VIEW'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Task Allowed Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('EVENTS_GRID')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'EVENTS_GRID'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Workspace Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MY_TASKS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MY_TASKS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Allotted Tasks ({tasks.length})</span>
          </button>
        </div>

        {activeTab === 'EVENTS_GRID' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-48"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Briefing">Briefings</option>
              <option value="Workshop">Workshops</option>
              <option value="Meeting">Meetings</option>
              <option value="Case Review">Case Reviews</option>
              <option value="Orientation">Orientations</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'CALENDAR_VIEW' && (
        <TaskAllowedCalendar
          tasks={tasks}
          user={user}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {activeTab === 'EVENTS_GRID' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Events Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery ? 'Try clearing your search query or changing category filters.' : 'No upcoming workspace events scheduled.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        event.category === 'Briefing' ? 'bg-blue-100 text-blue-800' :
                        event.category === 'Workshop' ? 'bg-purple-100 text-purple-800' :
                        event.category === 'Case Review' ? 'bg-amber-100 text-amber-800' :
                        event.category === 'Orientation' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {event.category}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{event.title}</h3>
                    
                    {event.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1 text-slate-400" />
                      {event.attendees}
                    </span>
                    <button 
                      onClick={() => alert(`Reminder set for: ${event.title} on ${event.date}`)}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Set Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'MY_TASKS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {task.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {task.department || 'Forensics Team'}
                  </span>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      task.status === 'COMPLETED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {task.status === 'COMPLETED' ? 'Re-open' : 'Mark Done'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Scheduling New Standard Event */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  ADMINISTRATIVE SCHEDULE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Schedule Workspace Event</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Memory Dump & Volatile RAM Analysis Workshop"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Briefing">Briefing</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Case Review">Case Review</option>
                    <option value="Orientation">Orientation</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time & Timezone</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 11:30 AM IST"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Room Link</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Virtual Room Alpha (Zoom)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Attendees</label>
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="e.g. All Forensic Wings & Volunteers"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Agenda / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of discussion items, training objectives, and deliverables..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save Standard Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Calendar;
