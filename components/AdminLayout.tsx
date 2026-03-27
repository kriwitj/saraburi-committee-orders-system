'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './providers';
import { usePathname } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = { ADMIN: 'ผู้ดูแล', EDITOR: 'ผู้แก้ไข', VIEWER: 'ผู้ชม' };

interface NavItem { href: string; icon: string; label: string; show: boolean; }

interface Props { children: React.ReactNode; title?: string; }

export function AdminLayout({ children, title }: Props) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: '/orders',         icon: '📋', label: 'รายการคำสั่ง',   show: true },
    { href: '/my-orders',      icon: '🏢', label: 'คำสั่งหน่วยงาน', show: !!user && user.role !== 'ADMIN' },
    { href: '/settings',       icon: '⚙️', label: 'ตั้งค่าระบบ',    show: user?.role === 'ADMIN' },
    { href: '/settings/users', icon: '👤', label: 'ผู้ใช้งาน',       show: user?.role === 'ADMIN' },
  ].filter(n => n.show);

  const isActive = (href: string) =>
    href === '/settings' ? pathname === '/settings' : pathname.startsWith(href);

  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50
          transition-transform duration-300 ease-in-out shadow-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-slate-700/60 flex-shrink-0">
          <Link href="/orders" onClick={closeSidebar} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-lg flex-shrink-0
              group-hover:bg-blue-500 transition-colors shadow-md">
              📋
            </div>
            <div>
              <div className="text-white font-extrabold text-sm leading-tight">ระบบคำสั่ง</div>
              <div className="text-slate-400 text-xs">จังหวัดสระบุรี</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold px-3 py-2 uppercase tracking-wider select-none">
            เมนูหลัก
          </p>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={e => {
                // Prevent full-page reload when already on this route
                if (isActive(item.href)) e.preventDefault();
                closeSidebar();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="text-base w-5 text-center flex-shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive(item.href) && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
              )}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs font-semibold px-3 py-1 uppercase tracking-wider select-none mb-1">
              สาธารณะ
            </p>
            <Link href="/search" onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 group">
              <span className="text-base w-5 text-center flex-shrink-0 transition-transform group-hover:scale-110">🔍</span>
              <span className="flex-1">ค้นหาสาธารณะ</span>
            </Link>
          </div>
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-slate-700/60 p-3 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
                text-white text-sm font-bold flex-shrink-0">
                {(user.name || user.email)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{user.name || user.email}</p>
                <p className="text-slate-400 text-xs">{ROLE_LABELS[user.role] || user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs
                text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors cursor-pointer"
            >
              <span>🚪</span> ออกจากระบบ
            </button>
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center
          justify-between flex-shrink-0 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            aria-label="เปิดเมนู"
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-gray-600 rounded-full" />
              <span className="block w-5 h-0.5 bg-gray-600 rounded-full" />
              <span className="block w-4 h-0.5 bg-gray-600 rounded-full" />
            </div>
          </button>
          <span className="font-bold text-gray-800 text-sm">{title || 'ระบบคำสั่งจังหวัดสระบุรี'}</span>
          <div className="w-9" />
        </header>

        {/* Desktop top strip */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-white border-b
          border-gray-100 shadow-sm flex-shrink-0 sticky top-0 z-20">
          <h1 className="text-sm font-semibold text-gray-500">{title || 'ระบบคำสั่งจังหวัดสระบุรี'}</h1>
          {user && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user.name || user.email}</span>
              <span className="text-gray-300">·</span>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
