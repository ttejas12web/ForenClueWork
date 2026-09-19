import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";
import { OfflineNetworkBanner } from "../components/UserNetworkTag";
import { useAuthStore } from "../store/authStore";
import { subscribeToChatGroups, subscribeToAnnouncements } from "../lib/firestoreService";
import { showDeviceNotification } from "../lib/pushNotifications";
import { Home, MessageSquare, CheckSquare, Users, Settings, User } from "lucide-react";
import { cn } from "../lib/utils";

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Push notifications listener for new messages & announcements
  const seenGroupsRef = useRef<Record<string, string>>({});
  const seenAnnsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;

    let isInitChat = true;
    let isInitAnn = true;

    const unsubChat = subscribeToChatGroups(String(user.id), (groups) => {
      groups.forEach(group => {
        const lastMsg = group.lastMessage;
        if (lastMsg && lastMsg.createdAt) {
          const prevTime = seenGroupsRef.current[group.id];
          if (!isInitChat && prevTime && prevTime !== lastMsg.createdAt) {
            if (lastMsg.senderId !== String(user.id)) {
              showDeviceNotification(
                group.isDirect ? lastMsg.senderName : `${group.name || 'Chat'}: ${lastMsg.senderName}`,
                {
                  body: lastMsg.content || 'Sent a file/attachment',
                  icon: '/app-icon-192.png',
                  badge: '/favicon.png',
                  url: `/chat?groupId=${group.id}`,
                  tag: `chat-${group.id}`
                }
              );
            }
          }
          seenGroupsRef.current[group.id] = lastMsg.createdAt;
        }
      });
      isInitChat = false;
    });

    const unsubAnn = subscribeToAnnouncements((anns) => {
      anns.forEach(ann => {
        if (!isInitAnn && !seenAnnsRef.current[ann.id]) {
          if (ann.authorId !== String(user.id)) {
            showDeviceNotification(`Announcement: ${ann.title}`, {
              body: ann.content,
              icon: '/app-icon-192.png',
              badge: '/favicon.png',
              url: '/announcements',
              tag: `ann-${ann.id}`
            });
          }
        }
        seenAnnsRef.current[ann.id] = true;
      });
      isInitAnn = false;
    });

    return () => {
      unsubChat();
      unsubAnn();
    };
  }, [user]);

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

  const isChatRoute = location.pathname.startsWith('/chat');

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-100/90 text-slate-900 antialiased font-sans">
      {/* Desktop Sidebar */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 w-full max-w-full overflow-hidden">
        {/* Offline Connectivity Warning Banner */}
        <OfflineNetworkBanner />

        {/* Top App Bar */}
        <TopBar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
        />

        {/* Page Viewport */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full",
          isChatRoute 
            ? "p-0 sm:p-4 lg:p-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6 flex flex-col" 
            : "p-3 sm:p-5 lg:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6"
        )}>
          <div className={cn(
            "w-full min-w-0 mx-auto",
            isChatRoute ? "h-full flex flex-col max-w-7xl" : "max-w-7xl"
          )}>
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Quick Navigation Bar (Visible on mobile screens < 768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 pb-[env(safe-area-inset-bottom)] flex items-center justify-around z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around w-full h-16 max-w-lg mx-auto">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 min-h-[48px] relative active:scale-95",
                    isActive
                      ? "text-blue-600 font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <div className={cn(
                    "px-3 py-1 rounded-xl transition-all flex items-center justify-center relative",
                    isActive ? "bg-blue-50 text-blue-600 shadow-2xs scale-105" : "hover:bg-slate-100"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform",
                      isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] tracking-tight mt-0.5 transition-colors font-medium",
                    isActive ? "text-blue-600 font-bold" : "text-slate-500"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <PwaInstallPrompt />
    </div>
  );
};
