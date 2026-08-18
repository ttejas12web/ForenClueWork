import React, { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuthStore } from "../store/authStore";
import { Home, MessageSquare, CheckSquare, Users, Settings, User } from "lucide-react";
import { cn } from "../lib/utils";

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Bottom Nav items for mobile quick switching
  const mobileNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Teams', path: '/teams', icon: Users },
    isSuperAdmin 
      ? { name: 'Admin', path: '/admin', icon: Settings }
      : { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/90 text-slate-900 antialiased font-sans">
      {/* Desktop Sidebar */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top App Bar */}
        <TopBar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
        />

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Quick Navigation Bar (Visible on mobile screens < 768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 flex items-center justify-around z-30 shadow-lg">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 min-h-[44px]",
                  isActive
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <div className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive ? "bg-blue-50 text-blue-600" : ""
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
