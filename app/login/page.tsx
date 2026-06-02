'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';

const SSO_ENABLED = process.env.NEXT_PUBLIC_SSO_ENABLED === 'true';

const SSO_ERRORS: Record<string, string> = {
  sso_failed:         'เข้าสู่ระบบด้วย SSO ไม่สำเร็จ กรุณาลองใหม่',
  invalid_state:      'เซสชันไม่ถูกต้อง กรุณาลองใหม่',
  no_email:           'ไม่พบข้อมูลอีเมลจาก Keycloak',
  sso_not_configured: 'ยังไม่ได้ตั้งค่า SSO',
  access_denied:      'ไม่ได้รับอนุญาตจาก Keycloak',
};

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) window.location.href = '/orders';
  }, [user, loading]);

  // แสดง error จาก Keycloak callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('error');
    if (e) setErr(SSO_ERRORS[e] || `SSO error: ${e}`);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const errMsg = await login(email, pass);
    if (errMsg) { setErr(errMsg); setBusy(false); }
    else window.location.href = '/orders';
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-900 to-blue-700
      flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            📋
          </div>
          <h1 className="text-white text-2xl font-extrabold">ระบบคำสั่งจังหวัดสระบุรี</h1>
          <p className="text-blue-300 text-sm mt-1">คณะกรรมการ / คณะทำงาน</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-5">เข้าสู่ระบบ</h2>

          {err && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
              ⚠️ {err}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล์</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="อีเมล์ของคุณ" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={pass} onChange={e => setPass(e.target.value)} required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-11 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="รหัสผ่าน" />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                  hover:text-gray-600 transition-colors cursor-pointer select-none text-lg"
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold
              py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer text-sm
              shadow-md shadow-blue-900/25">
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-base">⟳</span> กำลังเข้าสู่ระบบ...
              </span>
            ) : '🔐 เข้าสู่ระบบ'}
          </button>

          {SSO_ENABLED && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3 w-fit mx-auto">
                  หรือ
                </div>
              </div>
              <a href="/api/auth/keycloak"
                className="flex items-center justify-center gap-2.5 w-full border border-gray-300
                  text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50
                  transition-colors cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#4A90D9"/>
                  <path d="M9 10h6l5 6-5 6H9l5-6-5-6z" fill="white"/>
                  <path d="M17 10h6l-5 6 5 6h-6l-5-6 5-6z" fill="white" opacity="0.6"/>
                </svg>
                เข้าสู่ระบบด้วย Keycloak SSO
              </a>
            </>
          )}
        </form>

        <p className="text-center mt-5 text-blue-300 text-xs">
          <a href="/" className="hover:text-white transition-colors">← กลับหน้าหลัก</a>
        </p>
      </div>
    </div>
  );
}
