import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Calendar, Users, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProjectItem {
  id: number;
  title: string;
  description: string;
  status: string;
  leads: string;
  team: string;
  progress: number;
  deadline: string;
}

export const Projects = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem('forenclue_workspace_projects');
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
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState('Cyber & Digital Forensics');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('forenclue_workspace_projects', JSON.stringify(projects));
  }, [projects]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const newProject: ProjectItem = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      status: 'PLANNING',
      leads: user?.name || 'Administrator',
      team: team,
      progress: 0,
      deadline: deadline.trim() || 'TBD'
    };

    setProjects([newProject, ...projects]);
    setTitle('');
    setDescription('');
    setDeadline('');
    setError('');
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project initiative?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Projects & Initiatives</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordinate cross-departmental forensic projects, roadmaps, and milestones.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>New Initiative</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Projects Initiated</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAdmin 
              ? 'Click "New Initiative" above to create and manage cross-departmental projects.' 
              : 'No forensic project initiatives have been created by administration yet.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Initiative</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {p.team}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-500">
                      {p.status}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                        title="Delete project"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Milestone Completion</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Lead: {p.leads}</span>
                  <span>Due {p.deadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for New Project */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Forensic Initiative</h3>
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

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cloud Artifact Triage Automation"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department Unit</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Cyber & Digital Forensics">Cyber & Digital Forensics</option>
                  <option value="Case Study">Case Study</option>
                  <option value="Research">Research</option>
                  <option value="Events & Webinars">Events & Webinars</option>
                  <option value="Creative & Design">Creative & Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. Oct 30, 2026"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Objectives</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe investigative deliverables..."
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
                  Publish Initiative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
