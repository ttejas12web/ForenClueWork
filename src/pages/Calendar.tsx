import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface EventItem {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  category: string;
}

export const Calendar = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('forenclue_workspace_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Weekly Meeting');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('forenclue_workspace_events', JSON.stringify(events));
  }, [events]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) {
      setError('Please fill in required event fields');
      return;
    }

    const newEvent: EventItem = {
      id: Date.now(),
      title: title.trim(),
      date: date.trim(),
      time: time.trim() || '10:00 AM EST',
      location: location.trim() || 'Virtual Workspace Room',
      attendees: 'All Workspace Members',
      category: category
    };

    setEvents([newEvent, ...events]);
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setError('');
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this scheduled event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Workspace Calendar & Events</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Upcoming case briefings, webinars, regional orientations, and deadlines.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Event</span>
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Events Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAdmin 
              ? 'Click "Schedule Event" above to add meetings, case briefings, and webinars.' 
              : 'No upcoming workspace events have been scheduled by administration yet.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Event</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {event.category}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                      title="Delete event"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{event.title}</h3>
                
                <div className="space-y-2 mt-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1 text-slate-400" />
                  {event.attendees}
                </span>
                <button 
                  onClick={() => alert(`Added "${event.title}" to calendar reminder.`)}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Set Reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for New Event */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Workspace Event</h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Incident Response Case Briefing"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Weekly Meeting">Weekly Meeting</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Case Review">Case Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. Monday, Aug 24, 2026"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 11:30 AM EST"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Link</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Virtual Room #1 (Zoom)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
