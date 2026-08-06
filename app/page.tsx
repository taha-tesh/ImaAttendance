'use client';

import { useState } from 'react';
import Kiosk from '@/components/kiosk';
import AdminLogin from '@/components/admin-login';
import AdminPanel from '@/components/admin-panel';
import AssetManagement from '@/components/asset-management';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const [view, setView] = useState<'kiosk' | 'admin' | 'assets'>('kiosk');
  const { isAdmin, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                إثبات الحضور
              </h1>
              <p className="text-xs text-muted-foreground">نظام حضور وانصراف الموظفين</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => setView('kiosk')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:px-4 ${
                view === 'kiosk'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              تسجيل الحضور
            </button>
            <button
              onClick={() => setView('admin')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:px-4 ${
                view === 'admin'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              لوحة الإدارة
            </button>
            <button
              onClick={() => setView('assets')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:px-4 ${
                view === 'assets'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              إدارة المشتريات
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {view === 'kiosk' ? (
          <Kiosk />
        ) : view === 'assets' ? (
          isAdmin ? (
            <AssetManagement />
          ) : loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-muted-foreground">جارٍ التحميل…</div>
            </div>
          ) : (
            <AdminLogin />
          )
        ) : loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-muted-foreground">جارٍ التحميل…</div>
          </div>
        ) : isAdmin ? (
          <AdminPanel />
        ) : (
          <AdminLogin />
        )}
      </main>

      <footer className="no-print border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        إثبات الحضور © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
