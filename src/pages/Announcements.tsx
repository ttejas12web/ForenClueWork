import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, Shield, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: string;
}

export const Announcements = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    const saved = localStorage.getItem('forenclue_workspace_announcements');
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
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('forenclue_workspace_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all announcement fields');
      return;
    }

    const newAnn: AnnouncementItem = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      author: user?.name || 'Super Administrator',
      priority: priority
    };

    setAnnouncements([newAnn, ...announcements]);
    setTitle('');
    setContent('');
    setError('');
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this workspace announcement?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Workspace Announcements</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official operational updates, security directives, and system notices.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Announcements Posted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAdmin 
              ? 'Click "Post Notice" above to broadcast operational announcements to all workspace members.' 
              : 'No workspace announcements have been published by administration yet.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Post Notice</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3 hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ann.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {ann.priority === 'HIGH' ? 'IMPORTANT UPDATE' : 'WORKSPACE NOTICE'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                    {ann.date}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="text-slate-400 hover:text-rose-600 text-xs"
                    title="Delete announcement"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <h2 className="text-base font-bold text-slate-900">{ann.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center text-[11px] font-medium text-slate-700">
                  <Shield className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  Posted by {ann.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for New Announcement */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Post Workspace Announcement</h3>
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

            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Security Directive Issued"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="HIGH">High Priority (Important Update)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Details</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type official announcement message..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  required
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
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
