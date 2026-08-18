import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { 
  Home, 
  MessageSquare, 
  CheckSquare, 
  Briefcase, 
  Users, 
  Calendar as CalendarIcon, 
  Megaphone,
  User as UserIcon,
  Settings,
  Shield,
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: Home, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'Workspace Chat', path: '/chat', icon: MessageSquare, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'Tasks & Sprints', path: '/tasks', icon: CheckSquare, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'Projects', path: '/projects', icon: Briefcase, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'Departments & Teams', path: '/teams', icon: Users, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
  ];

  const secondaryNavItems = [
    { name: 'Calendar & Events', path: '/calendar', icon: CalendarIcon, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
    { name: 'My Profile', path: '/profile', icon: UserIcon, roles: ['SUPER_ADMIN', 'MENTOR', 'EMPLOYEE', 'VOLUNTEER', 'CAMPUS_AMBASSADOR'] },
  ];

  const adminNavItems = [
    { name: 'Admin Console', path: '/admin', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const filterByRole = (items: typeof mainNavItems) => 
    items.filter(item => user?.role && item.roles.includes(user.role));

  const allowedMain = filterByRole(mainNavItems);
  const allowedSecondary = filterByRole(secondaryNavItems);
  const allowedAdmin = filterByRole(adminNavItems);

  const renderNavList = (items: typeof mainNavItems) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group font-medium text-xs",
              isActive 
                ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30" 
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            )}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <item.icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
              )} />
              <span className="truncate">{item.name}</span>
            </div>
            {isActive && (
              <div className="h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link 
          to="/" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center space-x-3 group"
        >
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-white font-bold text-base tracking-tight">ForenClue</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Forensic Intelligence Portal</p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        <div>
          <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Workspace
          </p>
          {renderNavList(allowedMain)}
        </div>

        <div>
          <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Resources & Events
          </p>
          {renderNavList(allowedSecondary)}
        </div>

        {allowedAdmin.length > 0 && (
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center justify-between">
              <span>Administration</span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">SUPER ADMIN</span>
            </p>
            {renderNavList(allowedAdmin)}
          </div>
        )}
      </div>

      {/* User Status & Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono text-slate-400 truncate">{user?.forenclueId}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Sign out of workspace"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 hidden md:block h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
