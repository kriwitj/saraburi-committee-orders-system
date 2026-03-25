'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers';
import { AdminLayout } from '@/components/AdminLayout';
import { DetailView } from '@/components/DetailView';
import { Badge, StatusBadge, Empty } from '@/components/ui';
import type { Order } from '@/types';
import { getTypeColor } from '@/types';
import { formatThDate } from '@/lib/utils';

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await fetch('/api/orders');
      if (r.ok) {
        const all: Order[] = await r.json();
        const filtered = user?.agencyId
          ? all.filter(o => o.agencyId === user.agencyId)
          : all;
        setOrders(filtered);
      }
    } finally { setFetching(false); }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login';
    if (!loading && user) fetchOrders();
  }, [loading, user, fetchOrders]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-3 animate-spin">⟳</div>
          <p className="text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const selected = orders.find(o => o.id === selectedId);

  return (
    <AdminLayout title="คำสั่งหน่วยงาน">
      {selectedId && selected ? (
        <>
          <div className="bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5 text-sm text-gray-500">
              <button className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => setSelectedId(null)}>
                คำสั่งหน่วยงาน
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-blue-700 font-semibold">{selected.orderNumber}</span>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 py-5 animate-fade-in">
            <DetailView order={selected} onBack={() => setSelectedId(null)} onRefresh={fetchOrders} />
          </div>
        </>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900">
              🏢 คำสั่งเฉพาะหน่วยงานตนเอง
              <span className="ml-2 text-sm font-normal text-gray-500">({orders.length} รายการ)</span>
            </h1>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm">
              <Empty icon="📋" text="ไม่มีคำสั่งของหน่วยงานนี้" sub="ยังไม่มีคำสั่งที่ระบุหน่วยงานของคุณ" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {orders.map(o => {
                const tColor = getTypeColor(o.type);
                const totalM = o.subCommittees.reduce((s, sc) => s + sc.members.length, 0);
                return (
                  <div key={o.id}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    style={{ borderLeft: `4px solid ${tColor}` }}
                    onClick={() => setSelectedId(o.id)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge color={tColor}>{o.type}</Badge>
                          <StatusBadge status={o.status} />
                          <span className="font-bold text-gray-900">ที่ {o.orderNumber}</span>
                          {o.orderDate && <span className="text-xs text-gray-400">📅 {formatThDate(o.orderDate)}</span>}
                          {o.attachments?.length > 0 && <span className="text-xs text-gray-400">📎 {o.attachments.length}</span>}
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-2 line-clamp-2">{o.title}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>📁 {o.subCommittees.length} คณะย่อย</span>
                          <span>👥 {totalM} รายชื่อ</span>
                          {o.signedBy && <span>✍️ {o.signedBy}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
