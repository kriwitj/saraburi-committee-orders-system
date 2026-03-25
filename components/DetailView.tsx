'use client';
import { useState, useCallback } from 'react';
import type { Order, SubCommittee, Member } from '@/types';
import { getTypeColor, getRoleColor } from '@/types';
import { Badge, RoleBadge, StatusBadge, Btn, ConfirmModal, Empty, Toast } from './ui';
import { OrderForm, SCForm, MemberForm, StatusForm, ImportForm } from './forms';
import { AttachmentsPanel } from './AttachmentsPanel';
import { formatThDate } from '@/lib/utils';
import { useAuth } from './providers';

interface Props { order: Order; onBack: () => void; onRefresh: () => void; }

export function DetailView({ order, onBack, onRefresh }: Props) {
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';
  const [openSC, setOpenSC] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ sc?: SubCommittee; scId?: string; m?: Member; mId?: string }>({});
  const [toast, setToast] = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'content'|'files'>('content');

  const notify = (msg: string, type: 'ok'|'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const sorted = [...order.subCommittees].sort((a, b) => (a.seq||0) - (b.seq||0));
  const totalM = order.subCommittees.reduce((s, sc) => s + sc.members.length, 0);
  const tColor = getTypeColor(order.type);

  // ── API helpers ─────────────────────────────────────────────────
  async function patchOrder(data: object) {
    const r = await fetch(`/api/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); notify('บันทึกแล้ว');
  }

  async function changeStatus(status: string, cancelReason: string) {
    const r = await fetch(`/api/orders/${order.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, cancelReason }) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); setModal(null); notify('เปลี่ยนสถานะแล้ว');
  }

  async function addSC(data: object) {
    const r = await fetch(`/api/orders/${order.id}/sub-committees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); setModal(null); notify('เพิ่มคณะย่อยแล้ว');
  }

  async function editSC(data: object) {
    const r = await fetch(`/api/orders/${order.id}/sub-committees/${ctx.scId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); setModal(null); notify('แก้ไขแล้ว');
  }

  async function delSC() {
    setDelBusy(true);
    await fetch(`/api/orders/${order.id}/sub-committees/${ctx.scId}`, { method: 'DELETE' });
    setDelBusy(false); onRefresh(); setModal(null); notify('ลบแล้ว');
  }

  async function addMember(data: object) {
    const r = await fetch(`/api/orders/${order.id}/sub-committees/${ctx.scId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); setModal(null); notify('เพิ่มรายชื่อแล้ว');
  }

  async function editMember(data: object) {
    const r = await fetch(`/api/orders/${order.id}/sub-committees/${ctx.scId}/members/${ctx.mId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    onRefresh(); setModal(null); notify('แก้ไขแล้ว');
  }

  async function delMember() {
    setDelBusy(true);
    await fetch(`/api/orders/${order.id}/sub-committees/${ctx.scId}/members/${ctx.mId}`, { method: 'DELETE' });
    setDelBusy(false); onRefresh(); setModal(null); notify('ลบแล้ว');
  }

  const handleImportDone = useCallback((count: number) => {
    onRefresh(); setModal(null); notify(`นำเข้า ${count} รายชื่อแล้ว`);
  }, [onRefresh]);

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer">
        ← กลับรายการ
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-4" style={{ borderLeft: `4px solid ${tColor}` }}>
        {order.status === 'CANCELLED' && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm">
            ⚠️ <b>คำสั่งนี้ถูยกเลิกแล้ว</b>{order.cancelReason && ` — ${order.cancelReason}`}
          </div>
        )}
        {order.status === 'DRAFT' && (
          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 text-sm">
            📝 คำสั่งนี้อยู่ในสถานะ <b>ร่าง</b> ยังไม่มีผลบังคับ
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge color={tColor}>{order.type}</Badge>
              <StatusBadge status={order.status} />
              <span className="font-bold text-lg text-gray-900">คำสั่งจังหวัดสระบุรี ที่ {order.orderNumber}</span>
            </div>
            <div className="font-semibold text-base text-gray-800 mb-3">{order.title}</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
              {order.orderDate && <span>📅 วันที่ออก: <b className="text-gray-700">{formatThDate(order.orderDate)}</b></span>}
              {order.effectiveDate && <span>⚡ มีผลบังคับ: <b className="text-gray-700">{formatThDate(order.effectiveDate)}</b></span>}
              <span>📁 {order.subCommittees.length} คณะย่อย</span>
              <span>👥 {totalM} รายชื่อ</span>
              <span>📎 {order.attachments.length} ไฟล์</span>
            </div>
            {(order.signedBy || order.signedByTitle) && (
              <p className="mt-2 text-sm text-gray-600">✍️ <b>{order.signedBy}</b>{order.signedByTitle && ` (${order.signedByTitle})`}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <a href={`/api/orders/${order.id}/export?format=pdf`} target="_blank" rel="noreferrer">
              <Btn size="sm" variant="secondary">📄 พิมพ์ PDF</Btn>
            </a>
            <a href={`/api/orders/${order.id}/export?format=word`} download>
              <Btn size="sm" variant="secondary">📝 ดาวน์โหลด Word</Btn>
            </a>
            {canEdit && (
              <>
                <Btn size="sm" variant="secondary" onClick={() => setModal('editOrder')}>✏️ แก้ไข</Btn>
                <Btn size="sm" variant="secondary" onClick={() => setModal('status')}>🔄 สถานะ</Btn>
              </>
            )}
          </div>
        </div>

        {order.background && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">หลักการและเหตุผล</p>
            <p className="text-sm text-gray-600 leading-relaxed">{order.background}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm w-fit">
        {([['content','📋 คณะย่อย / รายชื่อ'],['files','📎 ไฟล์แนบ']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
              ${activeTab === tab ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label} {tab === 'files' && order.attachments.length > 0 && `(${order.attachments.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'files' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <AttachmentsPanel orderId={order.id} attachments={order.attachments} onRefresh={onRefresh} />
        </div>
      )}

      {activeTab === 'content' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">คณะย่อย / ฝ่าย ({sorted.length})</h2>
            {canEdit && <Btn size="sm" onClick={() => setModal('addSC')}>+ เพิ่มคณะย่อย</Btn>}
          </div>

          {sorted.length === 0 && <div className="bg-white rounded-xl shadow-sm"><Empty icon="📁" text="ยังไม่มีคณะย่อย" sub="กดปุ่ม + เพิ่มคณะย่อย" /></div>}

          {sorted.map((sc, idx) => (
            <div key={sc.id} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
              <div onClick={() => setOpenSC(p => ({ ...p, [sc.id]: !p[sc.id] }))}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${openSC[sc.id] ? 'bg-blue-50 border-b border-blue-100' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center" style={{ background: tColor }}>{idx + 1}</span>
                  <span className="font-semibold text-sm text-gray-800 truncate">{sc.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{sc.members.length} คน</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                  {canEdit && <>
                    <Btn size="sm" variant="secondary" onClick={() => { setCtx({ sc, scId: sc.id }); setModal('editSC'); }}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => { setCtx({ scId: sc.id }); setModal('delSC'); }}>🗑</Btn>
                  </>}
                  <span className="text-gray-400 text-xs ml-1">{openSC[sc.id] ? '▲' : '▼'}</span>
                </div>
              </div>

              {openSC[sc.id] && (
                <div className="p-4">
                  {sc.duties && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 border-l-4 border-blue-400">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">หน้าที่และอำนาจ</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{sc.duties}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">รายชื่อ ({sc.members.length})</span>
                    {canEdit && (
                      <div className="flex gap-1.5">
                        <Btn size="sm" variant="secondary" onClick={() => { setCtx({ scId: sc.id }); setModal('import'); }}>📥 Import Excel</Btn>
                        <Btn size="sm" onClick={() => { setCtx({ scId: sc.id }); setModal('addMember'); }}>+ เพิ่ม</Btn>
                      </div>
                    )}
                  </div>

                  {sc.members.length === 0
                    ? <p className="text-center text-sm text-gray-400 py-3">ยังไม่มีรายชื่อ</p>
                    : <div className="border border-gray-100 rounded-lg overflow-hidden">
                        {sc.members.map((m, i) => (
                          <div key={m.id} className={`flex items-center gap-2 px-3 py-2 ${i < sc.members.length - 1 ? 'border-b border-gray-50' : ''} ${i % 2 ? 'bg-gray-50/40' : 'bg-white'}`}>
                            <span className="text-gray-300 text-xs w-6 text-right flex-shrink-0">{i + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-800">
                                {m.name && <span className="font-bold text-blue-700 mr-1">{m.name}</span>}
                                {m.agencyPosition}
                              </div>
                              {m.agency && <div className="text-xs text-gray-400">{m.agency}</div>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <RoleBadge role={m.role || ''} color={getRoleColor(m.role || '')} />
                              {canEdit && <>
                                <button className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer text-sm"
                                  onClick={() => { setCtx({ scId: sc.id, m, mId: m.id }); setModal('editMember'); }}>✏️</button>
                                <button className="text-red-300 hover:text-red-500 p-0.5 cursor-pointer text-sm"
                                  onClick={() => { setCtx({ scId: sc.id, mId: m.id }); setModal('delMember'); }}>🗑</button>
                              </>}
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Modals */}
      {modal === 'editOrder' && <OrderForm initial={order} onSave={patchOrder} onClose={() => setModal(null)} />}
      {modal === 'status' && <StatusForm current={order.status} onSave={changeStatus} onClose={() => setModal(null)} />}
      {modal === 'addSC' && <SCForm onSave={addSC} onClose={() => setModal(null)} />}
      {modal === 'editSC' && ctx.sc && <SCForm initial={ctx.sc} onSave={editSC} onClose={() => setModal(null)} />}
      {modal === 'addMember' && ctx.scId && <MemberForm onSave={addMember} onClose={() => setModal(null)} />}
      {modal === 'editMember' && ctx.m && <MemberForm initial={ctx.m} onSave={editMember} onClose={() => setModal(null)} />}
      {modal === 'import' && ctx.scId && <ImportForm scId={ctx.scId} onDone={handleImportDone} onClose={() => setModal(null)} />}
      {modal === 'delSC' && <ConfirmModal text="ต้องการลบคณะย่อยนี้และรายชื่อทั้งหมดหรือไม่?" onConfirm={delSC} onClose={() => setModal(null)} loading={delBusy} />}
      {modal === 'delMember' && <ConfirmModal text="ต้องการลบรายชื่อนี้หรือไม่?" onConfirm={delMember} onClose={() => setModal(null)} loading={delBusy} />}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
