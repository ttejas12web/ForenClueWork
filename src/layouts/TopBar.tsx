import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, Menu, Shield, Crown, User, Check, X, CheckSquare, Sparkles, ExternalLink, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { subscribeToUserNotifications, markNotificationRead, markAllNotificationsRead, type FirestoreNotification } from '../lib/firestoreService';

interface TopBarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const knownNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = subscribeToUserNotifications(String(user.id), (fetchedNotifications) => {
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
      
      // Check for new notifications to push
      const currentIds = new Set(knownNotifIds.current);
      fetchedNotifications.forEach(notif => {
        if (!currentIds.has(notif.id) && !notif.read) {
          // This is a new notification!
          knownNotifIds.current.add(notif.id);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notif.title, {
              body: notif.message,
              icon: '/favicon.ico', // Optional icon
            });
          }
        }
      });
      
      // Initialize known IDs if first load
      if (currentIds.size === 0) {
        fetchedNotifications.forEach(n => knownNotifIds.current.add(n.id));
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllNotificationsRead(String(user.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: FirestoreNotification) => {
    if (!notif.read) {
      try {
        await markNotificationRead(notif.id);
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/chat')) return 'Workspace Chat';
    if (path.startsWith('/tasks')) return 'Task Management';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/teams')) return 'Departments & Teams';
    if (path.startsWith('/resources')) return 'Resource Library';
    if (path.startsWith('/calendar')) return 'Calendar & Events';
    if (path.startsWith('/announcements')) return 'Announcements';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/admin')) return 'Admin Console';
    return 'Workspace';
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-3.5 sm:px-6 shrink-0 z-30 sticky top-0 shadow-2xs">
      {/* Left: Mobile Menu Trigger + Page Title / Breadcrumb */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2 min-w-0">
          <div className="hidden sm:flex h-7 w-7 rounded-lg bg-blue-50 text-blue-600 items-center justify-center font-bold text-xs flex-shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {getPageTitle()}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 truncate">
              ForenClue Forensic Intelligence Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Right: Search, Notifications & User Dropdown */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Role Badge on Desktop */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-[11px] text-slate-700 font-medium">
          {isSuperAdmin ? (
            <>
              <Crown className="h-3 w-3 text-amber-500" />
              <span className="font-bold text-amber-700">SUPER ADMIN</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="capitalize">{user?.role?.replace('_', ' ') || 'Member'}</span>
            </>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Workspace Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop for mobile & desktop outside click */}
              <div 
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] sm:bg-transparent"
                onClick={() => setShowNotifications(false)}
                aria-hidden="true"
              />

              <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-1 sm:mt-2 max-w-[calc(100vw-24px)] sm:max-w-none sm:w-96 mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Workspace Panel Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex-shrink-0">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center space-x-0.5"
                        title="Mark all as read"
                      >
                        <CheckCheck className="h-3 w-3 mr-0.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <div className="h-10 w-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No Notifications Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        When Super Admin allots tasks or updates your deliverables, alerts will appear here in your panel.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left flex items-start space-x-3 ${
                          !notif.read ? 'bg-blue-50/40 border-l-3 border-l-blue-600' : ''
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          notif.type === 'TASK_ASSIGNED'
                            ? 'bg-blue-100 text-blue-700'
                            : notif.type === 'TASK_UPDATE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          <CheckSquare className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-bold truncate ${!notif.read ? 'text-blue-950' : 'text-slate-800'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <Link
                    to="/tasks"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Workspace Task Board →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Pill & Quick Sign Out */}
        <div className="flex items-center space-x-2">
          <Link
            to="/profile"
            className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-all text-left"
          >
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] font-mono text-slate-400">{user?.forenclueId}</p>
            </div>
          </Link>

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

