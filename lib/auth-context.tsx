'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchJson } from '@/lib/api';

type AuthContextType = {
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  loading: true,
  login: async () => false,
  signOut: () => {},
});

const STORAGE_KEY = 'attendance_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      setIsAdmin(stored === '1');
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await fetchJson<{ ok: boolean }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.ok) {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
          // ignore storage failures
        }
        setIsAdmin(true);
        return true;
      }
    } catch {
      // ignore error
    }
    return false;
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
