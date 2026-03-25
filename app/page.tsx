'use client';
import { useEffect, useState } from 'react';

const FEATURES = [
  { icon: '📋', title: 'จัดการคำสั่ง', desc: 'สร้าง แก้ไข และติดตามสถานะคำสั่งจังหวัดได้ครบถ้วน ทั้งคำสั่งคณะกรรมการ คณะทำงาน และคณะอนุกรรมการ' },
  { icon: '👥', title: 'รายชื่อคณะ', desc: 'บริหารจัดการรายชื่อกรรมการและสมาชิกในแต่ละคณะย่อยได้อย่างเป็นระเบียบ' },
  { icon: '📎', title: 'แนบไฟล์คำสั่ง', desc: 'แนบไฟล์เอกสารคำสั่ง (PDF, Word, Excel) พร้อมดาวน์โหลดได้ทันที' },
  { icon: '🏢', title: 'จัดการตามหน่วยงาน', desc: 'กรองและค้นหาคำสั่งตามหน่วยงานที่รับผิดชอบได้สะดวก' },
  { icon: '📊', title: 'ส่งออกเอกสาร', desc: 'ส่งออกรายชื่อคณะกรรมการเป็นไฟล์ Word หรือ Excel สำหรับใช้งานต่อ' },
  { icon: '🔒', title: 'ควบคุมสิทธิ์', desc: 'กำหนดสิทธิ์การเข้าถึงแยกตามระดับ: ผู้ดูแล ผู้แก้ไข และผู้ชม' },
];

const ROLE_LABELS: Record<string, string> = { ADMIN: 'ผู้ดูแลระบบ', EDITOR: 'ผู้แก้ไข', VIEWER: 'ผู้ชม' };

interface AuthUser { name: string | null; email: string; role: string; }

export default function LandingPage() {
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setOrderCount(d.orders); }).catch(() => {});
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => setAuthUser(d?.user ?? null)).catch(() => setAuthUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Header */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📋</span>
          <div>
            <div className="text-white font-extrabold text-base leading-tight">ระบบคำสั่งจังหวัดสระบุรี</div>
            <div className="text-blue-300 text-xs">คณะกรรมการ / คณะทำงาน</div>
          </div>
        </div>

        {/* Auth buttons */}
        {authUser === undefined ? (
          <div className="w-24 h-9 rounded-lg bg-white/10 animate-pulse" />
        ) : authUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {(authUser.name || authUser.email)[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white text-xs font-semibold leading-tight">{authUser.name || authUser.email}</div>
                <div className="text-blue-300 text-xs">{ROLE_LABELS[authUser.role] || authUser.role}</div>
              </div>
            </div>
            <a href="/orders"
              className="bg-white text-blue-900 font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors shadow-md">
              เข้าหน้าจัดการ →
            </a>
          </div>
        ) : (
          <a href="/login"
            className="bg-white text-blue-900 font-bold px-5 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
            เข้าสู่ระบบ
          </a>
        )}
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          ระบบบริหารจัดการ<br />
          <span className="text-blue-300">คำสั่งจังหวัดสระบุรี</span>
        </h1>
        <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
          ศูนย์กลางการจัดการคำสั่งแต่งตั้งคณะกรรมการ คณะทำงาน และคณะอนุกรรมการ สำหรับหน่วยงานในจังหวัดสระบุรี
        </p>

        {/* Order count badge */}
        {orderCount !== null && (
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-10">
            <span className="text-4xl font-black text-white">{orderCount.toLocaleString()}</span>
            <span className="text-blue-200 text-sm text-left">คำสั่ง<br />ในระบบ</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          {authUser ? (
            <a href="/orders"
              className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl text-base hover:bg-blue-50 transition-colors shadow-lg">
              เข้าหน้าจัดการคำสั่ง →
            </a>
          ) : (
            <a href="/login"
              className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl text-base hover:bg-blue-50 transition-colors shadow-lg">
              เข้าสู่ระบบ →
            </a>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-center text-white font-bold text-xl mb-8 opacity-80">ฟีเจอร์หลักของระบบ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm
              hover:bg-white/15 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-1.5">{f.title}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 text-blue-400 text-xs border-t border-white/10">
        จังหวัดสระบุรี · ระบบคำสั่งออนไลน์
      </div>
    </div>
  );
}
