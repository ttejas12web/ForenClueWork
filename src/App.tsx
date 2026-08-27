import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { ForcePasswordChange } from './pages/ForcePasswordChange';
import { Dashboard } from './pages/Dashboard';
import { AdminConsole } from './pages/AdminConsole';
import { Tasks } from './pages/Tasks';
import { Teams } from './pages/Teams';
import { Chat } from './pages/Chat';
import { Calendar } from './pages/Calendar';
import { Announcements } from './pages/Announcements';
import { Projects } from './pages/Projects';
import { Profile } from './pages/Profile';
import { Layout } from './layouts/Layout';

function ProtectedRoute({ requirePasswordChange = false }) {
  const { user, loading } = useAuthStore();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (requirePasswordChange) {
    if (user.tempPasswordChanged) return <Navigate to="/" replace />;
    return <Outlet />;
  }

  if (!user.tempPasswordChanged) return <Navigate to="/change-password" replace />;

  return <Outlet />;
}

export default function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white selection:bg-blue-500/30">
        <div className="relative animate-pulse mb-8">
          <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-xl opacity-20"></div>
          <img src="/app-icon.png" alt="ForenClue Logo" className="h-24 w-24 rounded-3xl shadow-2xl relative z-10 border border-slate-700/50" />
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase text-slate-200 mb-2">ForenClue</h1>
        <p className="text-xs text-slate-500 font-mono tracking-widest">WORKSPACE INITIALIZATION</p>
        <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute requirePasswordChange={true} />}>
          <Route path="/change-password" element={<ForcePasswordChange />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminConsole />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
