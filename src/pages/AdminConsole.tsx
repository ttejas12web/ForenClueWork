import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Role } from '../types';
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Crown, 
  Key, 
  Copy, 
  Check, 
  X, 
  Filter, 
  Sparkles,
  Lock,
  Mail,
  Fingerprint,
  Briefcase
} from 'lucide-react';

export const AdminConsole = () => {
  const { user, token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'security'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingDeptId, setUpdatingDeptId] = useState<number | null>(null);
  
  // New User Form State
  const [showNewUser, setShowNewUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Forenclue@2025');
  const [newRole, setNewRole] = useState<Role>('EMPLOYEE');
  const [newDepartment, setNewDepartment] = useState('Creative & Design');
  const [newForenclueId, setNewForenclueId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const departmentsList = [
    'Creative & Design',
    'Case Study',
    'Research',
    'Events & Webinars',
    'Cyber & Digital Forensics'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const fetchedUsers = await res.json();
        setUsers(fetchedUsers.sort((a: any, b: any) => b.id - a.id));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateForenclueId = (role: Role) => {
    const year = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      'SUPER_ADMIN': 'ADMIN',
      'EMPLOYEE': 'EMP',
      'MENTOR': 'MNT',
      'VOLUNTEER': 'VOL',
      'CAMPUS_AMBASSADOR': 'AMB'
    };
    const code = prefixMap[role] || 'USR';
    const rand = Math.floor(100 + Math.random() * 900);
    return `FC-${code}-${year}-${rand}`;
  };

  const handleRoleChange = (role: Role) => {
    setNewRole(role);
    setNewForenclueId(generateForenclueId(role));
  };

  const handleOpenNewUser = () => {
    setNewRole('EMPLOYEE');
    setNewDepartment('Creative & Design');
    setNewForenclueId(generateForenclueId('EMPLOYEE'));
    setNewPassword('Forenclue@2025');
    setFormError('');
    setFormSuccess('');
    setShowNewUser(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDepartmentChange = async (userId: string | number, department: string) => {
    setUpdatingDeptId(Number(userId));
    try {
      const res = await fetch(`/api/users/${userId}/department`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ department: department || null })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, department } : u));
      }
    } catch (err) {
      console.error("Failed to update department:", err);
    } finally {
      setUpdatingDeptId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          forenclueId: newForenclueId.trim(),
          password: newPassword,
          role: newRole,
          department: newDepartment || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      setUsers([data.user, ...users]);
      setFormSuccess(`Successfully registered ${data.user.name} with ForenClue ID: ${data.user.forenclueId}`);
      setNewName('');
      setNewEmail('');
      setTimeout(() => {
        setShowNewUser(false);
        setFormSuccess('');
      }, 1800);
    } catch (error: any) {
      setFormError(error.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Super Admin Access Required</h1>
        <p className="text-slate-500 text-xs mt-2 max-w-sm">
          You do not have administrative privileges to manage workspace credentials or access settings.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.forenclueId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (roleFilter === 'ALL') return true;
    return u.role === roleFilter;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Console</h1>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage workspace members, assign departments, and monitor operational security.
          </p>
        </div>

        <button
          onClick={handleOpenNewUser}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer min-h-[40px]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Member</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'teams'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Departmental Units
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit & Policy
        </button>
      </div>

      {/* Register User Modal */}
      {showNewUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Register ForenClue Member</h3>
                  <p className="text-[11px] text-slate-500">Create login credentials with official ID.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewUser(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Sterling"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. alex@forenclue.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="VOLUNTEER">Volunteer (Junior Contributor)</option>
                    <option value="EMPLOYEE">Employee (Forensic Specialist)</option>
                    <option value="MENTOR">Mentor (Senior Advisor)</option>
                    <option value="CAMPUS_AMBASSADOR">Campus Ambassador</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departmentsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">ForenClue ID *</label>
                    <button
                      type="button"
                      onClick={() => setNewForenclueId(generateForenclueId(newRole))}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newForenclueId}
                    onChange={(e) => setNewForenclueId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewUser(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {formLoading ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, department, or ForenClue ID..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            <div className="flex space-x-1 bg-white border border-slate-200 p-1 rounded-xl overflow-x-auto shadow-2xs">
              {(['ALL', 'VOLUNTEER', 'EMPLOYEE', 'MENTOR', 'SUPER_ADMIN', 'CAMPUS_AMBASSADOR'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    roleFilter === r ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">ForenClue ID</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-right font-bold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Loading members...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">No members found matching your search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-1.5 font-mono text-slate-700">
                          <span>{u.forenclueId}</span>
                          <button
                            onClick={() => handleCopy(u.forenclueId)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === u.forenclueId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={u.department || ''}
                          disabled={updatingDeptId === Number(u.id)}
                          onChange={(e) => handleDepartmentChange(u.id, e.target.value)}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {departmentsList.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN' 
                            ? 'bg-amber-100 text-amber-800' 
                            : u.role === 'VOLUNTEER'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleCopy(`${u.forenclueId} / Forenclue@2025`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer"
                        >
                          Copy Access
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-2.5">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading members...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No members found.</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{u.name}</h4>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Department:</span>
                      <select
                        value={u.department || ''}
                        disabled={updatingDeptId === Number(u.id)}
                        onChange={(e) => handleDepartmentChange(u.id, e.target.value)}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        <option value="">Unassigned</option>
                        {departmentsList.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center space-x-1.5 font-mono text-slate-600 text-[11px]">
                        <span>{u.forenclueId}</span>
                        <button
                          onClick={() => handleCopy(u.forenclueId)}
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                        >
                          {copiedId === u.forenclueId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleCopy(`${u.forenclueId} / Forenclue@2025`)}
                        className="text-blue-600 font-bold text-xs"
                      >
                        Copy Access
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Departmental Units */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Standard Operational Department Units</h3>
          <p className="text-xs text-slate-500">
            Departments define specialized units for casework, technical analysis, visual design, and public outreach.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[
              { name: 'Creative & Design', code: 'CD', color: 'bg-rose-600' },
              { name: 'Case Study', code: 'CS', color: 'bg-emerald-600' },
              { name: 'Research', code: 'RS', color: 'bg-blue-600' },
              { name: 'Events & Webinars', code: 'EW', color: 'bg-purple-600' },
              { name: 'Cyber & Digital Forensics', code: 'CF', color: 'bg-indigo-600' },
            ].map((d) => {
              const count = users.filter(u => u.department === d.name).length;
              return (
                <div key={d.name} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-8 w-8 rounded-lg ${d.color} text-white font-bold flex items-center justify-center text-xs`}>
                      {d.code}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{d.name}</h4>
                      <p className="text-[10px] text-slate-400">Department Unit</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                    {count} Members
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Policy */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workspace Security Policy</h3>
              <p className="text-xs text-slate-500">Global cryptographic and session integrity rules.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Mandatory First-Time Password Reset</p>
                <p className="text-slate-500 text-[11px]">Enforces new password setup on initial login.</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Role-Based Task Allotment</p>
                <p className="text-slate-500 text-[11px]">Only allotted members receive notifications and view tasks on their dashboard.</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
