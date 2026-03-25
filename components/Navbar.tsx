'use client';
import { useState } from 'react';
import { useAuth } from './providers';

const ROLE_LABELS: Record<string, string> = { ADMIN: 'ผู้ดูแล', EDITOR: 'ผู้แก้ไข', VIEWER: 'ผู้ชม' };

export function Navbar({ stats }: { stats?: { orders: number; scs: number; members: number } }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📋</span>
          <div>
            <div className="text-white font-extrabold text-base leading-tight">ระบบคำสั่งจังหวัดสระบุรี</div>
            <div className="text-blue-200 text-xs">คณะกรรมการ / คณะทำงาน</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden md:flex gap-4 text-xs text-blue-200">
              <span>{stats.orders} คำสั่ง</span>
              <span>{stats.scs} คณะย่อย</span>
              <span>{stats.members} รายชื่อ</span>
            </div>
          )}

          {user && (
            <div className="relative">
              <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 text-sm text-white transition-colors cursor-pointer">
                <span className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                  {(user.name || user.email)[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-28 truncate">{user.name || user.email}</span>
                <span className="text-blue-200 text-xs">{ROLE_LABELS[user.role]}</span>
                <span className="text-xs text-blue-300">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name || user.email}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
                  </div>
                  {user.role === 'ADMIN' && (
                    <a href="/settings" onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      ⚙️ ตั้งค่าระบบ
                    </a>
                  )}
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                    🚪 ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
