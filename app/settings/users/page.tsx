'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers';
import { AdminLayout } from '@/components/AdminLayout';
import { Btn, Toast, Modal, FG, Input, Select } from '@/components/ui';
import type { Agency } from '@/types';

const PAGE_SIZE = 10;
const PREFIX_OPTIONS = ['', 'นาย', 'นาง', 'นางสาว', 'ดร.', 'นพ.', 'ทพ.', 'ว่าที่ ร.ต.', 'พ.ต.อ.', 'พ.ต.ท.', 'พ.ต.ต.'];
const ROLES_OPTIONS = ['ADMIN', 'EDITOR', 'VIEWER'];
const ROLE_LABELS: Record<string, string> = { ADMIN: 'ผู้ดูแล', EDITOR: 'ผู้แก้ไข', VIEWER: 'ผู้ชม' };
const ROLE_COLORS: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', EDITOR: 'bg-blue-100 text-blue-700', VIEWER: 'bg-gray-100 text-gray-600' };

interface UserRow { id: string; email: string; prefix: string | null; name: string | null; agencyId: string | null; role: string; createdAt: string; }
type UserForm = { email: string; prefix: string; name: string; password: string; role: string; agencyId: string; };
const EMPTY_FORM: UserForm = { email: '', prefix: '', name: '', password: '', role: 'VIEWER', agencyId: '' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok'|'err' } | null>(null);

  const notify = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [ur, ar] = await Promise.all([fetch('/api/users'), fetch('/api/agencies')]);
    if (ur.ok) setUsers(await ur.json());
    if (ar.ok) setAgencies(await ar.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter + paginate
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.name||'').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setCurrentPage(1); }, [search]);

  async function addUser() {
    if (!form.email || !form.password) { notify('กรุณากรอกอีเมล์และรหัสผ่าน', 'err'); return; }
    setBusy(true);
    const r = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, prefix: form.prefix || null, agencyId: form.agencyId || null }),
    });
    const d = await r.json(); setBusy(false);
    if (r.ok) { setAddModal(false); setForm(EMPTY_FORM); fetchAll(); notify('เพิ่มผู้ใช้แล้ว'); }
    else notify(d.error || 'เกิดข้อผิดพลาด', 'err');
  }

  async function saveEdit() {
    if (!editUser) return;
    setBusy(true);
    const r = await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name || null, prefix: form.prefix || null,
        role: form.role, agencyId: form.agencyId || null,
      }),
    });
    setBusy(false);
    if (r.ok) { setEditUser(null); fetchAll(); notify('อัปเดตแล้ว'); }
    else notify('เกิดข้อผิดพลาด', 'err');
  }

  async function doResetPassword() {
    if (!resetUser || !newPassword.trim()) { notify('กรุณากรอกรหัสผ่านใหม่', 'err'); return; }
    if (newPassword.length < 6) { notify('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'err'); return; }
    setBusy(true);
    const r = await fetch(`/api/users/${resetUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    setBusy(false);
    if (r.ok) { setResetUser(null); setNewPassword(''); notify(`รีเซ็ตรหัสผ่านของ ${resetUser.name || resetUser.email} แล้ว`); }
    else notify('เกิดข้อผิดพลาด', 'err');
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`ต้องการลบผู้ใช้ "${name}"?`)) return;
    const r = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (r.ok) { fetchAll(); notify('ลบแล้ว'); }
    else { const d = await r.json(); notify(d.error || 'ลบไม่สำเร็จ', 'err'); }
  }

  if (me?.role !== 'ADMIN') {
    return (
      <AdminLayout title="ผู้ใช้งาน">
        <div className="max-w-lg mx-auto p-8 text-center text-gray-500 mt-10">
          <div className="text-4xl mb-3">🔒</div><p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </AdminLayout>
    );
  }

  function openEdit(u: UserRow) {
    setForm({ email: u.email, prefix: u.prefix || '', name: u.name || '', password: '', role: u.role, agencyId: u.agencyId || '' });
    setEditUser(u);
  }

  const agencyName = (id: string | null) => agencies.find(a => a.id === id)?.name || '';

  return (
    <AdminLayout title="ผู้ใช้งาน">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-xl font-bold text-gray-900">👤 จัดการผู้ใช้งาน</h1>
          <Btn size="sm" onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}>+ เพิ่มผู้ใช้</Btn>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-3.5 mb-4 flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  ค้นหาชื่อหรืออีเมล์..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-xs text-gray-400 shrink-0">{filtered.length} คน</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-2xl animate-spin mb-2">⟳</div><p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {paged.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">ไม่พบผู้ใช้</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {paged.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                      {(u.name || u.email)[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {[u.prefix, u.name].filter(Boolean).join(' ') || <span className="text-gray-400 font-normal">—</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {u.email}{agencyName(u.agencyId) ? ` · ${agencyName(u.agencyId)}` : ''}
                      </p>
                    </div>
                    {/* Role badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(u)} title="แก้ไข"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer text-sm">✏️</button>
                      <button onClick={() => { setResetUser(u); setNewPassword(''); setShowNewPass(false); }} title="รีเซ็ตรหัสผ่าน"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer text-sm">🔑</button>
                      {u.id !== me?.id && (
                        <button onClick={() => deleteUser(u.id, u.name || u.email)} title="ลบ"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-sm">🗑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold cursor-pointer transition-colors
                  ${p === currentPage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer">→</button>
          </div>
        )}
      </div>

      {/* ── Add Modal ──────────────────────────────────────────────── */}
      {addModal && (
        <Modal title="เพิ่มผู้ใช้ใหม่" onClose={() => setAddModal(false)} wide>
          <div className="grid grid-cols-2 gap-x-3">
            <FG label="คำนำหน้า">
              <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.prefix} onChange={e => setForm(p => ({ ...p, prefix: e.target.value }))}>
                {PREFIX_OPTIONS.map(o => <option key={o} value={o}>{o || '-- ไม่ระบุ --'}</option>)}
              </select>
            </FG>
            <FG label="ชื่อ-นามสกุล">
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
            </FG>
          </div>
          <FG label="อีเมล์" required>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@domain.com" />
          </FG>
          <FG label="รหัสผ่าน" required>
            <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="อย่างน้อย 6 ตัวอักษร" />
          </FG>
          <FG label="หน่วยงาน">
            <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.agencyId} onChange={e => setForm(p => ({ ...p, agencyId: e.target.value }))}>
              <option value="">-- ไม่ระบุ --</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FG>
          <FG label="สิทธิ์">
            <Select options={ROLES_OPTIONS} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
          </FG>
          <div className="text-xs text-gray-400 mb-4 bg-gray-50 p-2.5 rounded-lg">
            ADMIN = แก้ไข + ลบ + ตั้งค่า / EDITOR = แก้ไขได้ / VIEWER = ดูอย่างเดียว
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <Btn variant="secondary" onClick={() => setAddModal(false)}>ยกเลิก</Btn>
            <Btn onClick={addUser} loading={busy}>💾 เพิ่มผู้ใช้</Btn>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────── */}
      {editUser && (
        <Modal title={`แก้ไข: ${editUser.name || editUser.email}`} onClose={() => setEditUser(null)} wide>
          <div className="grid grid-cols-2 gap-x-3">
            <FG label="คำนำหน้า">
              <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.prefix} onChange={e => setForm(p => ({ ...p, prefix: e.target.value }))}>
                {PREFIX_OPTIONS.map(o => <option key={o} value={o}>{o || '-- ไม่ระบุ --'}</option>)}
              </select>
            </FG>
            <FG label="ชื่อ-นามสกุล">
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
            </FG>
          </div>
          <FG label="อีเมล์">
            <Input value={form.email} disabled className="opacity-60 cursor-not-allowed" />
          </FG>
          <FG label="หน่วยงาน">
            <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.agencyId} onChange={e => setForm(p => ({ ...p, agencyId: e.target.value }))}>
              <option value="">-- ไม่ระบุ --</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FG>
          <FG label="สิทธิ์">
            <Select options={ROLES_OPTIONS} value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              disabled={editUser.id === me?.id} />
          </FG>
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <Btn variant="secondary" onClick={() => setEditUser(null)}>ยกเลิก</Btn>
            <Btn onClick={saveEdit} loading={busy}>💾 บันทึก</Btn>
          </div>
        </Modal>
      )}

      {/* ── Reset Password Modal ───────────────────────────────────── */}
      {resetUser && (
        <Modal title={`รีเซ็ตรหัสผ่าน: ${resetUser.name || resetUser.email}`} onClose={() => setResetUser(null)}>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            ⚠️ ตั้งรหัสผ่านใหม่สำหรับผู้ใช้นี้ แล้วแจ้งรหัสผ่านใหม่ให้ผู้ใช้ทราบด้วยตนเอง
          </div>
          <FG label="รหัสผ่านใหม่" required>
            <div className="relative">
              <Input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
              <button type="button" onClick={() => setShowNewPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">
                {showNewPass ? '🙈' : '👁️'}
              </button>
            </div>
          </FG>
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <Btn variant="secondary" onClick={() => setResetUser(null)}>ยกเลิก</Btn>
            <Btn variant="danger" onClick={doResetPassword} loading={busy}>🔑 รีเซ็ตรหัสผ่าน</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
