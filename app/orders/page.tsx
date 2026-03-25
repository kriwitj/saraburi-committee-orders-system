'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers';
import { AdminLayout } from '@/components/AdminLayout';
import { ListView } from '@/components/ListView';
import { DetailView } from '@/components/DetailView';
import type { Order } from '@/types';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await fetch('/api/orders');
      if (r.ok) setOrders(await r.json());
    } finally { setFetching(false); }
  }, []);

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
    <AdminLayout title="รายการคำสั่ง">
      {/* Breadcrumb (detail view only) */}
      {page === 'detail' && selected && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <button className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => setPage('list')}>
              รายการคำสั่ง
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-blue-700 font-semibold">{selected.orderNumber}</span>
            <span className="text-gray-400 hidden sm:inline truncate max-w-sm">— {selected.title}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-5">
        {page === 'list' ? (
          <ListView
            orders={orders}
            onSelect={id => { setSelectedId(id); setPage('detail'); }}
            onRefresh={fetchOrders}
          />
        ) : selected ? (
          <div className="animate-fade-in">
            <DetailView order={selected} onBack={() => setPage('list')} onRefresh={fetchOrders} />
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
