'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { OrderStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

// ── Badge ──────────────────────────────────────────────────────────
export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold border whitespace-nowrap"
    style={{ background: color + '22', color, borderColor: color + '55' }}>{children}</span>;
}
export function RoleBadge({ role, color }: { role: string; color: string }) {
  return <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold border whitespace-nowrap"
    style={{ background: color + '18', color, borderColor: color + '33' }}>{role}</span>;
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status] || '#374151';
  return <Badge color={c}>{STATUS_LABELS[status] || status}</Badge>;
}

// ── Button ─────────────────────────────────────────────────────────
type V = 'primary' | 'secondary' | 'danger' | 'ghost';
const vs: Record<V, string> = {
  primary:   'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50',
  secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200',
  danger:    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  ghost:     'bg-transparent text-gray-500 hover:bg-gray-100',
};
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: V; size?: 'sm' | 'md'; loading?: boolean; }
export function Btn({ variant = 'primary', size = 'md', loading, children, className = '', ...p }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed
        ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'} ${vs[variant]} ${className}`}
      disabled={loading || p.disabled} {...p}>
      {loading ? <span className="animate-spin text-xs">⟳</span> : null}{children}
    </button>
  );
}

// ── Modal ──────────────────────────────────────────────────────────
// Rendered via Portal so position:fixed is always relative to viewport,
// not any transformed ancestor. Also locks body scroll while open.
export function Modal({
  title, onClose, children, wide,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-3 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-xl w-full flex flex-col shadow-2xl
          max-h-[90dvh] sm:max-h-[88vh]
          ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <span className="font-bold text-base text-gray-900">{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
          >×</button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );

  // Use portal to escape any transformed/overflow-hidden ancestor
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

// ── Confirm ────────────────────────────────────────────────────────
export function ConfirmModal({
  text, onConfirm, onClose, loading,
}: { text: string; onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  return (
    <Modal title="ยืนยัน" onClose={onClose}>
      <p className="text-gray-700 mb-5 whitespace-pre-line">{text}</p>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
        <Btn variant="danger" onClick={onConfirm} loading={loading}>ยืนยัน</Btn>
      </div>
    </Modal>
  );
}

// ── Form ───────────────────────────────────────────────────────────
export function FG({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
const ic = 'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 box-border';
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={ic} {...p} />; }
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={`${ic} resize-y`} {...p} />; }
export function Select({ options, ...p }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${ic} bg-white`} {...p}>
      <option value="">-- เลือก --</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Empty ──────────────────────────────────────────────────────────
export function Empty({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="text-center py-12 px-4 text-gray-400">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-base font-semibold text-gray-500 mb-1">{text}</div>
      {sub && <div className="text-sm">{sub}</div>}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────
export function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  // Also rendered via portal to avoid stacking issues
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-sm font-semibold animate-fade-in
      ${type === 'ok' ? 'bg-emerald-700 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'ok' ? '✓' : '✕'} {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">×</button>
    </div>,
    document.body,
  );
}
