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
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return sanitizeAuthUser(parsed);
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('auth_token'),
  loading: true,
  
  setUser: (rawUser) => {
    const user = sanitizeAuthUser(rawUser);
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_user_id', user.id);
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_user_id');
    }
    set({ user });
  },

  login: (token, rawUser) => {
    const user = sanitizeAuthUser(rawUser) || rawUser;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_user_id', user.id);
    set({ user, token, loading: false });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_id');
    set({ user: null, token: null, loading: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    const storedUserStr = localStorage.getItem('auth_user');
    
    if (!token || !storedUserStr) {
      set({ user: null, token: null, loading: false });
      return;
    }

    try {
      const cachedUser = sanitizeAuthUser(JSON.parse(storedUserStr));
      if (cachedUser) {
        localStorage.setItem('auth_user', JSON.stringify(cachedUser));
      }
      set({ user: cachedUser, token, loading: false });

      // Refresh latest user record from Firestore in background
      if (cachedUser?.id) {
        const userDoc = await getDoc(doc(db, 'users', cachedUser.id));
        if (userDoc.exists()) {
          const freshData = sanitizeAuthUser({ ...userDoc.data(), id: userDoc.id } as User);
          if (freshData) {
            localStorage.setItem('auth_user', JSON.stringify(freshData));
            set({ user: freshData });
          }
        }
      }
    } catch (error) {
      console.warn('Auth state refresh:', error);
      set({ loading: false });
    }
  }
}));
