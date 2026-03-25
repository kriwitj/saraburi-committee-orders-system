'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('admin@sarorders.local');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) window.location.href = '/';
  }, [user, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const errMsg = await login(email, pass);
    if (errMsg) { setErr(errMsg); setBusy(false); }
    else window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-white text-2xl font-extrabold">ระบบคำสั่งจังหวัดสระบุรี</h1>
          <p className="text-blue-200 text-sm mt-1">คณะกรรมการ / คณะทำงาน</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">เข้าสู่ระบบ</h2>

          {err && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
              ⚠️ {err}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมล์</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@sarorders.local" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="รหัสผ่าน" />
          </div>

          <button type="submit" disabled={busy}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer text-sm">
            {busy ? 'กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
          </button>

          <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500">
            <p className="font-semibold mb-1">ข้อมูล Admin เริ่มต้น:</p>
            <p>Email: admin@sarorders.local</p>
            <p>Password: Admin@1234</p>
            <p className="mt-1 text-amber-600">⚠️ กรุณาเปลี่ยนรหัสผ่านหลังเข้าใช้งานครั้งแรก</p>
          </div>
        </form>
      </div>
    </div>
  );
}
