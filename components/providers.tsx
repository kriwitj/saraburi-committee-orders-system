'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/types';

interface AuthUser { id: string; email: string; name: string | null; role: string; agencyId: string | null; }
interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}
interface SettingsCtx { settings: Settings; reload: () => Promise<void>; }

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => null, logout: async () => {} });
const SettingsContext = createContext<SettingsCtx>({ settings: { orderTypes: [], memberRoles: [] }, reload: async () => {} });

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ orderTypes: [], memberRoles: [] });

  const fetchSettings = useCallback(async () => {
    try {
      const r = await fetch('/api/settings');
      if (r.ok) setSettings(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setUser(d.user); fetchSettings(); } })
      .finally(() => setLoading(false));
  }, [fetchSettings]);

  const login = async (email: string, password: string) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const d = await r.json();
    if (!r.ok) return d.error || 'เข้าสู่ระบบไม่สำเร็จ';
    setUser(d.user);
    await fetchSettings();
    return null;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <SettingsContext.Provider value={{ settings, reload: fetchSettings }}>
        {children}
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);
