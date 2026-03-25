'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useSettings } from '@/components/providers';
import { Navbar } from '@/components/Navbar';
import { Btn, Toast, Modal, FG, Input, Select } from '@/components/ui';

interface UserRow { id: string; email: string; name: string|null; role: string; created_at: string; }

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, reload } = useSettings();
  const [activeTab, setActiveTab] = useState<'types'|'roles'|'users'>('types');
  const [toast, setToast] = useState<{ msg: string; type: 'ok'|'err' }|null>(null);
  const [busy, setBusy] = useState(false);

  // Types
  const [orderTypes, setOrderTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  // Roles
  const [memberRoles, setMemberRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userModal, setUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email:'', name:'', password:'', role:'VIEWER' });

  const notify = (msg: string, type: 'ok'|'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = useCallback(async () => {
    const r = await fetch('/api/users');
    if (r.ok) setUsers(await r.json());
  }, []);

  useEffect(() => {
    setOrderTypes(settings.orderTypes);
    setMemberRoles(settings.memberRoles);
  }, [settings]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function saveTypes() {
    setBusy(true);
    const r = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderTypes }) });
    setBusy(false);
    if (r.ok) { await reload(); notify('บันทึกแล้ว'); } else notify('เกิดข้อผิดพลาด', 'err');
  }

  async function saveRoles() {
    setBusy(true);
    const r = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberRoles }) });
    setBusy(false);
    if (r.ok) { await reload(); notify('บันทึกแล้ว'); } else notify('เกิดข้อผิดพลาด', 'err');
  }

  async function addUser() {
    if (!newUser.email || !newUser.password) { notify('กรุณากรอกข้อมูลให้ครบ', 'err'); return; }
    const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    const d = await r.json();
    if (r.ok) { setUserModal(false); setNewUser({ email:'', name:'', password:'', role:'VIEWER' }); fetchUsers(); notify('เพิ่มผู้ใช้แล้ว'); }
    else notify(d.error || 'เกิดข้อผิดพลาด', 'err');
  }

  async function deleteUser(id: string) {
    if (!confirm('ต้องการลบผู้ใช้นี้?')) return;
    const r = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (r.ok) { fetchUsers(); notify('ลบแล้ว'); }
    else { const d = await r.json(); notify(d.error || 'ลบไม่สำเร็จ', 'err'); }
  }

  async function changeRole(id: string, role: string) {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    fetchUsers(); notify('อัปเดตแล้ว');
  }

  if (user?.role !== 'ADMIN') {
    return <div className="min-h-screen bg-slate-100"><Navbar /><div className="max-w-4xl mx-auto p-8 text-center text-gray-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</div></div>;
  }

  const tabCls = (t: string) => `px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${activeTab === t ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  const ROLES_OPTIONS = ['ADMIN', 'EDITOR', 'VIEWER'];
  const ROLE_LABELS: Record<string, string> = { ADMIN:'ผู้ดูแล', EDITOR:'ผู้แก้ไข', VIEWER:'ผู้ชม' };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← กลับหน้าหลัก</a>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">⚙️ ตั้งค่าระบบ</h1>
        </div>

        <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm w-fit">
          {[['types','📋 ประเภทคำสั่ง'],['roles','👤 บทบาท'],['users','🔑 ผู้ใช้']] .map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t as 'types'|'roles'|'users')} className={tabCls(t)}>{l}</button>
          ))}
        </div>

        {/* Order Types */}
        {activeTab === 'types' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">ประเภทของคำสั่ง</h2>
            <div className="space-y-2 mb-4">
              {orderTypes.map((t, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm">{t}</span>
                  <button onClick={() => setOrderTypes(p => p.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-5">
              <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="เพิ่มประเภทใหม่..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={e => { if (e.key === 'Enter' && newType.trim()) { setOrderTypes(p => [...p, newType.trim()]); setNewType(''); }}} />
              <Btn size="sm" onClick={() => { if (newType.trim()) { setOrderTypes(p => [...p, newType.trim()]); setNewType(''); }}}>+ เพิ่ม</Btn>
            </div>
            <Btn onClick={saveTypes} loading={busy}>💾 บันทึก</Btn>
          </div>
        )}

        {/* Member Roles */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">บทบาทในคณะ</h2>
            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
              {memberRoles.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm">{r}</span>
                  <button onClick={() => setMemberRoles(p => p.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-5">
              <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="เพิ่มบทบาทใหม่..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={e => { if (e.key === 'Enter' && newRole.trim()) { setMemberRoles(p => [...p, newRole.trim()]); setNewRole(''); }}} />
              <Btn size="sm" onClick={() => { if (newRole.trim()) { setMemberRoles(p => [...p, newRole.trim()]); setNewRole(''); }}}>+ เพิ่ม</Btn>
            </div>
            <Btn onClick={saveRoles} loading={busy}>💾 บันทึก</Btn>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">ผู้ใช้งานระบบ</h2>
              <Btn size="sm" onClick={() => setUserModal(true)}>+ เพิ่มผู้ใช้</Btn>
            </div>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                    {(u.name || u.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{u.name || '—'}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    disabled={u.id === user?.id}
                    className="border border-gray-200 rounded px-2 py-1 text-xs bg-white disabled:opacity-60">
                    {ROLES_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  {u.id !== user?.id && (
                    <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 text-sm cursor-pointer">🗑</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {userModal && (
        <Modal title="เพิ่มผู้ใช้ใหม่" onClose={() => setUserModal(false)}>
          <FG label="ชื่อ"><Input value={newUser.name} onChange={e => setNewUser(p => ({...p, name: e.target.value}))} placeholder="ชื่อ-นามสกุล" /></FG>
          <FG label="อีเมล์" required><Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({...p, email: e.target.value}))} placeholder="email@domain.com" /></FG>
          <FG label="รหัสผ่าน" required><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))} placeholder="อย่างน้อย 8 ตัวอักษร" /></FG>
          <FG label="สิทธิ์"><Select options={ROLES_OPTIONS} value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))} /></FG>
          <div className="text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded">ADMIN = แก้ไข+ลบ+ตั้งค่า / EDITOR = แก้ไขได้ / VIEWER = ดูอย่างเดียว</div>
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <Btn variant="secondary" onClick={() => setUserModal(false)}>ยกเลิก</Btn>
            <Btn onClick={addUser}>💾 เพิ่มผู้ใช้</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
