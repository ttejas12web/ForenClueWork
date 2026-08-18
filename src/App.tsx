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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
