import { create } from 'zustand';
import { User } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  login: (token: string, user: User) => void;
  logout: () => void;
}

function sanitizeAuthUser(u: User | null): User | null {
  if (!u) return null;
  const name = (u.name || '').toLowerCase();
  const email = (u.email || '').toLowerCase();
  if (
    u.id === 'user_emp_004' ||
    u.forenclueId === 'FC-EMP-2026-004' ||
    name.includes('purva') ||
    name.includes('bhawsar') ||
    name.includes('hawser') ||
    email.includes('purva')
  ) {
    return null;
  }
  if (
    u.forenclueId === 'FC-EMP-2026-001' ||
    u.email?.toLowerCase() === 'ttapse12@gmail.com' ||
    u.id === 'user_admin_001'
  ) {
    return {
      ...u,
      name: 'Tejas Tapse',
      forenclueId: 'FC-EMP-2026-001',
      email: 'ttapse12@gmail.com',
      role: 'SUPER_ADMIN',
      department: u.department || 'Cyber & Digital Forensics',
      designation: u.designation || 'Founder & Forensic Lead'
    };
  }
  return u;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return sanitizeAuthUser(parsed);
    } catch {
      return null;
    }
  })(),
  token: (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  })(),
  loading: true,
  
  setUser: (rawUser) => {
    const user = sanitizeAuthUser(rawUser);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) {
          localStorage.setItem('auth_user', JSON.stringify(user));
          localStorage.setItem('auth_user_id', user.id);
        } else {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_id');
        }
      }
    } catch {}
    set({ user });
  },

  login: (token, rawUser) => {
    const user = sanitizeAuthUser(rawUser) || rawUser;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_user_id', user.id);
      }
    } catch {}
    set({ user, token, loading: false });
  },

  logout: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_id');
      }
    } catch {}
    set({ user: null, token: null, loading: false });
  },

  initialize: async () => {
    let token: string | null = null;
    let storedUserStr: string | null = null;
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        token = localStorage.getItem('auth_token');
        storedUserStr = localStorage.getItem('auth_user');
      }
    } catch {
      token = null;
      storedUserStr = null;
    }
    
    if (!token || !storedUserStr) {
      set({ user: null, token: null, loading: false });
      return;
    }

    try {
      const cachedUser = sanitizeAuthUser(JSON.parse(storedUserStr));
      if (cachedUser) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('auth_user', JSON.stringify(cachedUser));
          }
        } catch {}
      }
      set({ user: cachedUser, token, loading: false });

      // Refresh latest user record from Firestore in background (non-blocking)
      if (cachedUser?.id) {
        getDoc(doc(db, 'users', cachedUser.id)).then(userDoc => {
          if (userDoc.exists()) {
            const freshData = sanitizeAuthUser({ ...userDoc.data(), id: userDoc.id } as User);
            if (freshData) {
              try {
                if (typeof window !== 'undefined' && window.localStorage) {
                  localStorage.setItem('auth_user', JSON.stringify(freshData));
                }
              } catch {}
              set({ user: freshData });
            }
          }
        }).catch(err => {
          console.warn('Background user refresh skipped:', err);
        });
      }
    } catch (error) {
      console.warn('Auth state refresh:', error);
      set({ loading: false });
    }
  }
}));
