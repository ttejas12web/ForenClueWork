import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Mail, 
  Hash, 
  Calendar as CalendarIcon, 
  Briefcase, 
  Shield, 
  Crown, 
  LogOut, 
  CheckCircle2,
  Copy,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  User,
  ExternalLink,
  MessageSquare,
  Send,
  ListTodo,
  AlertCircle,
  Edit3,
  Save,
  X,
  Award,
  QrCode,
  Fingerprint,
  BadgeCheck,
  Activity,
  Layers
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface TaskItem {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate?: string;
  department?: string;
  notes?: string;
}

interface DepartmentMentor {
  name: string;
  forenclueId: string;
  email: string;
  code: string;
  color: string;
}

const DEPARTMENT_MENTORS: Record<string, DepartmentMentor> = {
  'Creative & Design': {
    name: 'Tejas Tapse',
    forenclueId: 'FC-EMP-2026-001',
    email: 'tejas.tapse@forenclue.com',
    code: 'CD',
    color: 'bg-rose-600'
  },
  'Case Study': {
    name: 'Ayush Gaikwad',
    forenclueId: 'FC-EMP-2026-002',
    email: 'ayush.gaikwad@forenclue.com',
    code: 'CS',
    color: 'bg-emerald-600'
  },
  'Research': {
    name: 'Purva Bawsar',
    forenclueId: 'FC-EMP-2026-003',
    email: 'purva.bawsar@forenclue.com',
    code: 'RS',
    color: 'bg-blue-600'
  },
  'Events & Webinars': {
    name: 'Mrunmayee Bodhe',
    forenclueId: 'FC-MNT-2026-004',
    email: 'mrunmayee.bodhe@forenclue.com',
    code: 'EW',
    color: 'bg-purple-600'
  },
  'Cyber & Digital Forensics': {
    name: 'Alex Sterling',
    forenclueId: 'FC-MNT-2026-005',
    email: 'alex.sterling@forenclue.com',
    code: 'CF',
    color: 'bg-indigo-600'
  }
};

export const Profile = () => {
  const { user, logout, token, setUser } = useAuthStore();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'tasks' | 'edit'>('overview');

  // Copy ID State
  const [copiedId, setCopiedId] = useState(false);

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // User Tasks
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setBioInput(
        user.bio || 
        "Dedicated forensic member participating in evidence examination, academic investigations, and forensic taskforce operations."
      );
    }
  }, [user]);

  // Fetch Tasks for this user
  useEffect(() => {
    if (!token) return;
    setLoadingTasks(true);
    fetch('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMyTasks(data);
        }
      })
      .catch(err => {
        console.error('Failed to load user tasks:', err);
      })
      .finally(() => setLoadingTasks(false));
  }, [token]);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isMentor = user.role === 'MENTOR';
  const userDept = user.department || 'Creative & Design';
  const mentorInfo = DEPARTMENT_MENTORS[userDept] || DEPARTMENT_MENTORS['Creative & Design'];

  const todoTasks = myTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED');
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 100;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.forenclueId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setProfileSaveError('Name cannot be blank');
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError('');
    setProfileSaveSuccess(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: nameInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser({
        ...user,
        ...data.user,
        bio: bioInput.trim()
      });

      setProfileSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      setProfileSaveError(err.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Profile Header */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        {/* Banner with Forensic Hexagonal Pattern */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 relative p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-semibold">
                <Shield className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                ForenClue Forensic Taskforce
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Clearance: Level 3 Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end -mt-14 sm:-mt-16 mb-5 gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md">
                {user.name.charAt(0)}
              </div>
              <span className="absolute bottom-1 right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full" title="Online & Active" />
            </div>
            
            {/* Identity Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{user.name}</h1>
                {isSuperAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Crown className="h-3 w-3 mr-1 text-amber-600" />
                    Super Admin
                  </span>
                )}
                {isMentor && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <Award className="h-3 w-3 mr-1 text-purple-600" />
                    Lead Mentor
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center space-x-1.5 font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                  title="Click to copy ForenClue ID"
                >
                  <Hash className="h-3 w-3 text-blue-500" />
                  <span>{user.forenclueId}</span>
                  {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                </button>

                <span className="text-slate-300">•</span>

                <span className="flex items-center text-slate-600">
                  <Briefcase className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  {user.department || 'Creative & Design'}
                </span>

                <span className="text-slate-300 hidden sm:inline">•</span>

                <span className="hidden sm:flex items-center text-slate-500">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Joined {new Date(user.joiningDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 pt-2 sm:pt-0 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                id="edit-profile-btn"
                onClick={() => {
                  setActiveTab('edit');
                  setIsEditing(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-50/50 transition-colors cursor-pointer min-h-[38px]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                id="sign-out-btn"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer min-h-[38px]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold">
                <ListTodo className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Allotted Tasks</p>
                <p className="text-sm font-bold text-slate-900">{myTasks.length}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
                <p className="text-sm font-bold text-slate-900">{completedTasks.length}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
                <p className="text-xs font-bold text-slate-900 truncate">{userDept}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Completion</p>
                <p className="text-sm font-bold text-slate-900">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-2">
        <button
          type="button"
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Overview & Credentials</span>
        </button>

        <button
          type="button"
          id="tab-tasks"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo className="h-4 w-4" />
          <span>Assigned Tasks ({myTasks.length})</span>
        </button>

        <button
          type="button"
          id="tab-security"
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          id="tab-edit"
          onClick={() => {
            setActiveTab('edit');
            setIsEditing(true);
          }}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'edit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Information</span>
        </button>
      </div>

      {/* TAB CONTENT: Overview & Credentials */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Official Digital ID Card */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Digital Forensic ID Badge
            </h3>

            {/* Official Forensic ID Card */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
              {/* Micro-chip pattern watermark */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="font-bold text-xs tracking-wider uppercase text-blue-300">ForenClue ID Badge</span>
                </div>
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
              </div>

              {/* Hologram Card Center */}
              <div className="py-5 flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-blue-400/40 mb-3 relative">
                  {user.name.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 p-0.5 rounded-full border border-blue-400">
                    <Fingerprint className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                </div>

                <h4 className="font-bold text-base text-white">{user.name}</h4>
                <p className="text-xs text-blue-300 font-semibold tracking-wide uppercase mt-0.5">
                  {user.role.replace('_', ' ')}
                </p>
                <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-950/80 border border-blue-500/30 rounded-lg text-blue-200 font-mono text-xs font-bold">
                  <span>{user.forenclueId}</span>
                </div>
              </div>

              {/* Card Meta & Barcode simulation */}
              <div className="pt-4 border-t border-slate-700/80 space-y-2.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department</span>
                  <span className="font-semibold text-white">{userDept}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 font-bold">Verified Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Clearance</span>
                  <span className="text-blue-400 font-semibold">Tier-3 Forensic</span>
                </div>

                {/* Simulated Barcode */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="h-5 w-full bg-[repeating-linear-gradient(90deg,#94a3b8,#94a3b8_2px,transparent_2px,transparent_4px,#94a3b8_4px,#94a3b8_6px,transparent_6px,transparent_7px)] opacity-50 rounded" />
                  <span className="text-[9px] font-mono text-slate-400 mt-1">FC-AUTH-{user.forenclueId}</span>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyId}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              {copiedId ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">ForenClue ID Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy Official ForenClue ID</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Credentials & Department Assignment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Official Credentials Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Official Workspace Credentials</span>
                <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Identity
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 flex items-center mb-1">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Official Email
                  </span>
                  <span className="font-semibold text-slate-900 break-all">{user.email}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 flex items-center mb-1">
                    <Hash className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    ForenClue ID
                  </span>
                  <span className="font-mono font-bold text-blue-700">{user.forenclueId}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 flex items-center mb-1">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Induction / Join Date
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(user.joiningDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 flex items-center mb-1">
                    <Shield className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Role & Authorization
                  </span>
                  <span className="font-semibold text-slate-900">{user.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Department & Mentor Assignment Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Department & Lead Mentor
                </h3>
                <Link
                  to={`/teams`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>View All Teams</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className={`h-11 w-11 rounded-xl ${mentorInfo.color} text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0`}>
                    {mentorInfo.code}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-sm">{userDept}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full">
                        Assigned Unit
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                      <Crown className="h-3 w-3 mr-1 text-amber-500 flex-shrink-0" />
                      <span>Lead Mentor: <strong className="text-slate-800">{mentorInfo.name}</strong> ({mentorInfo.forenclueId})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <Link
                    to={`/chat?directUser=${encodeURIComponent(mentorInfo.forenclueId)}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Message Mentor</span>
                  </Link>

                  <Link
                    to={`/chat?group=${encodeURIComponent(userDept)}`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    <span>Group Chat</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Forensic Specialty & Bio Statement */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Forensic Focus & Taskforce Bio
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('edit');
                    setIsEditing(true);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit Bio</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <p>
                  {user.bio || "Dedicated forensic member participating in evidence examination, academic investigations, and forensic taskforce operations."}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Cryptographic Identity: FC-SEC-{user.forenclueId}</span>
                  <span>Active Workspace Clearance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Assigned Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Allotted Workspace Tasks</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks assigned directly to your ForenClue profile by Administrators and Lead Mentors.
              </p>
            </div>
            <Link
              to="/tasks"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ListTodo className="h-4 w-4" />
              <span>Open Task Board</span>
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          {loadingTasks ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading allotted tasks...
            </div>
          ) : myTasks.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Pending Tasks</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You currently have no tasks allotted. When an administrator or mentor assigns a forensic task to your ID, it will appear here.
              </p>
              <Link
                to="/tasks"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Check Department Board</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {myTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const isProgress = task.status === 'IN_PROGRESS';

                return (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isProgress
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'URGENT' || task.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{task.dueDate ? `Due: ${task.dueDate}` : 'No deadline set'}</span>
                      <Link
                        to="/tasks"
                        className="font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>Update in Tasks</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Security & Password */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Password Update */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your authentication credentials. Use at least 8 characters with a mix of letters and symbols.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Your password has been successfully updated and verified.</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>{passwordLoading ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Security Standing & Clearance */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Standing
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Active Credential</h4>
                  <p className="text-[11px] text-slate-500">Forensic Workspace Token Valid</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Temp Password Changed</span>
                  <span className="font-bold text-emerald-600">Yes</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Session Type</span>
                  <span className="font-mono text-slate-900">JWT Authenticated</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Authorization Scope</span>
                  <span className="font-semibold text-blue-600">{user.role}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <p className="font-semibold text-blue-950 mb-0.5">Credential Policy</p>
                <p className="text-blue-800">
                  Do not share your ForenClue credentials or session tokens. All task updates and messages are cryptographically logged with your ForenClue ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Edit Profile */}
      {activeTab === 'edit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Member Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your display name and forensic focus statement visible to team members and mentors.
            </p>
          </div>

          {profileSaveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {profileSaveError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{profileSaveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter full name..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ForenClue ID (Read-only)
              </label>
              <input
                type="text"
                value={user.forenclueId}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Official ID numbers are permanently generated and can only be altered by Super Admins.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Forensic Focus / Profile Statement
              </label>
              <textarea
                rows={4}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Describe your role, investigation focus, and methodology..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNameInput(user.name);
                  setBioInput(user.bio || '');
                  setActiveTab('overview');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
