'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserNav from '../../../components/UserNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icons ─────────────────────────────────────────────────────────────────────

const PackageIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const InvoiceIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const ShoppingBagIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_META = {
  placed:           { label: 'Placed',           color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)',   dot: '#60a5fa', step: 0 },
  processing:       { label: 'Processing',       color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',   dot: '#fbbf24', step: 1 },
  out_for_delivery: { label: 'Out for Delivery', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)',  dot: '#a78bfa', step: 2 },
  delivered:        { label: 'Delivered',        color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',   dot: '#34d399', step: 3 },
  completed:        { label: 'Completed',        color: '#6ee7b7', bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)',  dot: '#6ee7b7', step: 4 },
  cancelled:        { label: 'Cancelled',        color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)',  dot: '#f87171', step: -1 },
};

const TIMELINE_STEPS = [
  { key: 'placed',           label: 'Order Placed',      sub: 'We received your order' },
  { key: 'processing',       label: 'Processing',        sub: 'Being packed & prepared' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  sub: 'On its way to you' },
  { key: 'delivered',        label: 'Delivered',         sub: 'Enjoy your order!' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getProductImage(item) {
  try {
    const images = item.products?.images;
    if (!images) return '/placeholder-product.png';
    if (Array.isArray(images)) return images[0] || '/placeholder-product.png';
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder-product.png';
  } catch {
    return '/placeholder-product.png';
  }
}

function fmtDate(iso, opts = {}) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts
  });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cartCount, setCartCount]       = useState(0);
  const [toast, setToast]               = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json())
      .then(d => setCartCount(d.items?.length || 0))
      .catch(() => {});
  }, [session]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function downloadInvoice(orderId, invoiceId, e) {
    e?.stopPropagation();
    if (!session?.accessToken || invoiceLoading) return;
    setInvoiceLoading(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${invoiceId}.pdf`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
      showToast('success', 'Invoice downloaded successfully');
    } catch {
      showToast('error', 'Could not download invoice');
    } finally {
      setInvoiceLoading(null);
    }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#080a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bb-spinner" />
        <style>{`.bb-spinner{width:32px;height:32px;border:2px solid rgba(163,230,53,0.15);border-top-color:#a3e635;border-radius:50%;animation:bbspin .7s linear infinite}@keyframes bbspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── root ── */
        .op-root {
          min-height: 100vh;
          background: #080a0f;
          font-family: 'DM Sans', sans-serif;
          color: #e5e7eb;
          position: relative;
          overflow-x: hidden;
        }
        .op-root::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 70% 50% at 10% -10%, rgba(163,230,53,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 105%, rgba(163,230,53,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(96,165,250,0.02) 0%, transparent 70%);
        }

        /* ── main ── */
        .op-main {
          position: relative; z-index: 1;
          max-width: 1080px; margin: 0 auto;
          padding: 0 1.25rem 4rem;
        }

        /* ── page header ── */
        .op-page-header {
          padding: 1.75rem 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .op-header-left { display: flex; align-items: center; gap: 1rem; }
        .op-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.5rem 0.9rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #9ca3af;
          font-size: 0.8rem; font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .op-back-link:hover { border-color: rgba(163,230,53,0.3); color: #a3e635; background: rgba(163,230,53,0.05); }

        .op-page-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.35rem, 3vw, 1.7rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          display: flex;
    justify-content: center;
    align-items: center;
        }
        .op-page-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 26px; height: 22px;
          padding: 0 7px;
          background: rgba(163,230,53,0.12);
          border: 1px solid rgba(163,230,53,0.25);
          border-radius: 20px;
          font-size: 0.72rem; font-weight: 700;
          color: #a3e635;
          font-family: 'Syne', sans-serif;
          margin-left: 0.5rem;
        }

        /* ── spinner ── */
        @keyframes op-spin { to { transform: rotate(360deg); } }
        .op-spin { animation: op-spin 0.7s linear infinite; }

        /* ── empty state ── */
        .op-empty {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 5rem 1rem;
          animation: op-fadein 0.4s ease;
        }
        .op-empty-icon-ring {
          width: 90px; height: 90px;
          border-radius: 50%;
          background: rgba(163,230,53,0.06);
          border: 1px solid rgba(163,230,53,0.14);
          display: flex; align-items: center; justify-content: center;
          color: rgba(163,230,53,0.5);
          margin-bottom: 1.5rem;
          position: relative;
        }
        .op-empty-icon-ring::before {
          content: '';
          position: absolute; inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(163,230,53,0.06);
        }
        .op-empty-title {
          font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700;
          color: #fff; margin-bottom: 0.5rem;
        }
        .op-empty-sub { font-size: 0.875rem; color: #6b7280; margin-bottom: 1.75rem; max-width: 280px; }
        .op-browse-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0.8rem 1.6rem;
          background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);
          border: none; border-radius: 12px;
          color: #052e16; font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; font-weight: 700;
          text-decoration: none; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .op-browse-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(163,230,53,0.3); }

        /* ── order list ── */
        .op-list {
          display: flex; flex-direction: column; gap: 0.875rem;
          animation: op-fadein 0.35s ease;
        }
        @keyframes op-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── order card ── */
        .op-card {
          background: rgba(12,15,23,0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .op-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(163,230,53,0.15), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .op-card:hover { border-color: rgba(163,230,53,0.18); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .op-card:hover::before { opacity: 1; }

        .op-card-top {
          padding: 1.1rem 1.25rem 1rem;
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }

        .op-card-left { display: flex; flex-direction: column; gap: 4px; }

        .op-card-id-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .op-card-id {
          font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; color: #fff;
        }
        .op-card-date { font-size: 0.775rem; color: #4b5563; }

        .op-status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.28rem 0.75rem;
          border-radius: 20px;
          font-size: 0.55rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          border: 1px solid;
        }
        .op-status-dot {
          width: 6px; height: 6px; border-radius: 50; flex-shrink: 0;
          border-radius: 50%;
        }

        .op-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .op-card-total-label { font-size: 0.7rem; color: #4b5563; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
        .op-card-total {
          font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; color: #a3e635;
        }
        .op-card-pay-badge {
          font-size: 0.68rem; font-weight: 600;
          padding: 2px 7px; border-radius: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280; letter-spacing: 0.03em;
        }

        /* progress bar */
        .op-progress-bar {
          padding: 0 1.25rem 0.9rem;
        }
        .op-progress-track {
          display: flex; align-items: center; gap: 0;
          position: relative;
        }
        .op-progress-step {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          flex: 1; position: relative; z-index: 1;
        }
        .op-progress-circle {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .op-progress-step.done .op-progress-circle  { background: #34d399; border-color: #34d399; }
        .op-progress-step.active .op-progress-circle { background: #a3e635; border-color: #a3e635; }
        .op-progress-line {
          position: absolute; top: 9px; left: calc(50% + 9px);
          right: calc(-50% + 9px);
          height: 2px;
          background: rgba(255,255,255,0.07);
          z-index: 0;
        }
        .op-progress-step.done .op-progress-line  { background: rgba(52,211,153,0.4); }
        .op-progress-step.active .op-progress-line { background: rgba(163,230,53,0.2); }
        .op-progress-step:last-child .op-progress-line { display: none; }
        .op-progress-label {
          font-size: 0.6rem; color: #4b5563; font-weight: 500;
          white-space: nowrap; letter-spacing: 0.02em;
        }
        .op-progress-step.done .op-progress-label   { color: #34d399; }
        .op-progress-step.active .op-progress-label { color: #a3e635; }

        /* thumbs strip */
        .op-thumbs-strip {
          padding: 0 1.25rem 1rem;
          display: flex; gap: 0.5rem; overflow-x: auto;
        }
        .op-thumbs-strip::-webkit-scrollbar { display: none; }
        .op-thumb {
          width: 52px; height: 52px; border-radius: 10px;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.07);
          background: #0c111a;
        }
        .op-thumb-more {
          width: 52px; height: 52px; border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; color: #6b7280;
          flex-shrink: 0;
        }

        /* card footer */
        .op-card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.75rem; flex-wrap: wrap;
        }
        .op-card-items-label { font-size: 0.77rem; color: #4b5563; }
        .op-card-actions { display: flex; gap: 0.45rem; }

        .op-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.775rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          text-decoration: none; border: 1px solid;
        }
        .op-btn-ghost {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: #9ca3af;
        }
        .op-btn-ghost:hover {
          background: rgba(163,230,53,0.07);
          border-color: rgba(163,230,53,0.2); color: #a3e635;
        }
        .op-btn-primary {
          background: rgba(163,230,53,0.1);
          border-color: rgba(163,230,53,0.22);
          color: #a3e635;
        }
        .op-btn-primary:hover { background: rgba(163,230,53,0.16); border-color: rgba(163,230,53,0.35); }

        /* ───────────────────────────────────────────
           ORDER DETAIL MODAL
        ─────────────────────────────────────────── */
        .op-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(14px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: op-fadein 0.18s ease;
        }
        .op-modal {
          background: #0c0f18;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 22px;
          width: 100%; max-width: 680px;
          max-height: 92vh; overflow-y: auto;
          position: relative;
          animation: op-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1);
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .op-modal::-webkit-scrollbar { width: 4px; }
        .op-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes op-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* modal header */
        .op-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: sticky; top: 0; z-index: 2;
          background: rgba(12,15,24,0.98);
          backdrop-filter: blur(20px);
          border-radius: 22px 22px 0 0;
        }
        .op-modal-head-left { display: flex; flex-direction: column; gap: 3px; }
        .op-modal-head-title {
          font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: #fff;
        }
        .op-modal-head-sub { font-size: 0.75rem; color: #6b7280; }
        .op-modal-close {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: #6b7280; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .op-modal-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .op-modal-body { padding: 1.5rem; }

        /* status hero */
        .op-status-hero {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 14px;
          border: 1px solid;
          margin-bottom: 1.5rem;
        }
        .op-status-hero-icon {
          width: 42px; height: 42px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; flex-shrink: 0;
        }
        .op-status-hero-text { flex: 1; }
        .op-status-hero-label {
          font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700;
        }
        .op-status-hero-sub { font-size: 0.775rem; opacity: 0.7; margin-top: 2px; }

        /* timeline */
        .op-tl-wrap {
          margin-bottom: 1.5rem;
        }
        .op-tl-section-label {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
          color: #4b5563; text-transform: uppercase; margin-bottom: 0.9rem;
        }
        .op-tl {
          display: flex; flex-direction: column; gap: 0;
          padding-left: 0.25rem;
        }
        .op-tl-item {
          display: flex; gap: 1rem; position: relative;
       
        }
        .op-tl-item:last-child { padding-bottom: 0; }
        .op-tl-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .op-tl-dot {
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; z-index: 1;
          transition: all 0.2s;
        }
        .op-tl-item.tl-done .op-tl-dot   { background: #34d399; border-color: #34d399; }
        .op-tl-item.tl-active .op-tl-dot { background: #a3e635; border-color: #a3e635; box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }
        .op-tl-line {
          width: 2px; flex: 1; min-height: 30px;
          background: rgba(255,255,255,0.06);
          margin: 3px 0;
        }
        .op-tl-item.tl-done .op-tl-line { background: rgba(52,211,153,0.3); }
        .op-tl-item:last-child .op-tl-line { display: none; }

        .op-tl-content { padding-top: 1px; }
        .op-tl-title {
          font-size: 0.875rem; font-weight: 600; color: #e5e7eb; margin-bottom: 2px;
        }
        .op-tl-item.tl-active .op-tl-title { color: #a3e635; }
        .op-tl-item.tl-done .op-tl-title   { color: #6ee7b7; }
        .op-tl-sub { font-size: 0.75rem; color: #4b5563; }
        .op-tl-item.tl-done .op-tl-sub, .op-tl-item.tl-active .op-tl-sub { color: #6b7280; }

        /* section divider */
        .op-modal-divider {
          height: 1px; background: rgba(255,255,255,0.06);
          margin: 1.5rem 0;
        }

        /* items list */
        .op-modal-items-label {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
          color: #4b5563; text-transform: uppercase; margin-bottom: 0.9rem;
        }
        .op-modal-items-list { display: flex; flex-direction: column; gap: 0; }

        .op-mi {
          display: flex; gap: 0.9rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: center;
        }
        .op-mi:last-child { border-bottom: none; }
        .op-mi-img {
          width: 64px; height: 64px; border-radius: 11px;
          object-fit: cover; flex-shrink: 0;
          background: #0c111a;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .op-mi-body { flex: 1; min-width: 0; }
        .op-mi-name {
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700;
          color: #f3f4f6; margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .op-mi-variant {
          display: inline-block;
          font-size: 0.7rem; color: #9ca3af;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          padding: 2px 7px; border-radius: 5px; margin-bottom: 5px;
        }
        .op-mi-row { display: flex; align-items: center; gap: 0.75rem; }
        .op-mi-qty { font-size: 0.775rem; color: #6b7280; }
        .op-mi-unit { font-size: 0.775rem; color: #9ca3af; }
        .op-mi-price {
          margin-left: auto;
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #a3e635;
        }

        /* info cards */
        .op-info-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .op-info-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 0.9rem 1rem;
        }
        .op-info-card-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
          color: #4b5563; text-transform: uppercase; margin-bottom: 0.6rem;
        }
        .op-info-card-label svg { opacity: 0.6; }
        .op-info-val {
          font-size: 0.85rem; color: #d1d5db; line-height: 1.5; font-weight: 400;
        }
        .op-info-val strong { color: #e5e7eb; font-weight: 600; }

        /* summary box */
        .op-sum {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 1.1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .op-sum-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.65rem; font-size: 0.875rem;
        }
        .op-sum-row:last-child { margin-bottom: 0; }
        .op-sum-label { color: #6b7280; }
        .op-sum-val { color: #e5e7eb; }
        .op-sum-hr { height: 1px; background: rgba(255,255,255,0.07); margin: 0.85rem 0; }
        .op-sum-total-row {
          display: flex; justify-content: space-between; align-items: center;
        }
        .op-sum-total-label { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #fff; }
        .op-sum-total-val   { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: #a3e635; }

        /* modal footer buttons */
        .op-modal-footer {
          display: flex; gap: 0.6rem;
        }
        .op-mfbtn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 0.8rem;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          border: 1px solid;
        }
        .op-mfbtn-ghost {
          background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: #9ca3af;
        }
        .op-mfbtn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #e5e7eb; }
        .op-mfbtn-primary {
          background: rgba(163,230,53,0.1); border-color: rgba(163,230,53,0.25); color: #a3e635;
        }
        .op-mfbtn-primary:hover { background: rgba(163,230,53,0.18); border-color: rgba(163,230,53,0.4); }

        /* toast */
        .op-toast {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
          padding: 0.75rem 1.1rem;
          border-radius: 11px;
          font-size: 0.85rem; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 8px;
          border: 1px solid;
          backdrop-filter: blur(16px);
          animation: op-toast-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
          max-width: 320px;
        }
        .op-toast-success { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); color: #6ee7b7; }
        .op-toast-error   { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.25);  color: #fca5a5; }
        @keyframes op-toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── responsive ── */
        @media (max-width: 560px) {
          .op-info-row { grid-template-columns: 1fr; }
          .op-card-actions { flex-wrap: wrap; }
          .op-btn { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="op-root">
        <UserNav cartCount={cartCount} />

        <main className="op-main">
          {/* Page header */}
          <header className="op-page-header">
            <div className="op-header-left">
              <Link href="/userdashboard" className="op-back-link">
                <ArrowLeftIcon /> Dashboard
              </Link>
              <h1 className="op-page-title">
                My Orders
                {!loading && orders.length > 0 && (
                  <span className="op-page-count">{orders.length}</span>
                )}
              </h1>
            </div>
          </header>

          {/* Body */}
          {loading ? (
            <div className="op-empty">
              <div className="op-empty-icon-ring">
                <div style={{ width: 26, height: 26, border: '2px solid rgba(163,230,53,0.2)', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'op-spin 0.7s linear infinite' }} />
              </div>
              <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Loading your orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="op-empty">
              <div className="op-empty-icon-ring"><ShoppingBagIcon /></div>
              <h2 className="op-empty-title">No orders yet</h2>
              <p className="op-empty-sub">Your order history will appear here once you make a purchase.</p>
              <Link href="/userdashboard/products" className="op-browse-btn">Browse Products</Link>
            </div>
          ) : (
            <div className="op-list">
              {orders.map((order, cardIdx) => {
                const sm = STATUS_META[order.status] || STATUS_META.placed;
                const items = order.order_items || [];
                const currentStep = sm.step ?? 0;

                return (
                  <div
                    key={order.id}
                    className="op-card"
                    onClick={() => setSelectedOrder(order)}
                    style={{ animationDelay: `${cardIdx * 0.04}s` }}
                  >
                    {/* Top row */}
                    <div className="op-card-top">
                      <div className="op-card-left">
                        <div className="op-card-id-row">
                          <span className="op-card-id">#{order.invoice_id || order.id}</span>
                          <span className="op-status-badge" style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
                            <span className="op-status-dot" style={{ background: sm.dot }} />
                            {sm.label}
                          </span>
                        </div>
                        <span className="op-card-date">{fmtDate(order.created_at)} · {fmtTime(order.created_at)}</span>
                      </div>
                      <div className="op-card-right">
                        <span className="op-card-total-label">Total</span>
                        <span className="op-card-total">₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
                        <span className="op-card-pay-badge">{order.payment_method === 'cod' ? 'COD' : 'Paid Online'}</span>
                      </div>
                    </div>

                    {/* Progress bar (only if not cancelled) */}
                    {order.status !== 'cancelled' && (
                      <div className="op-progress-bar">
                        <div className="op-progress-track">
                          {TIMELINE_STEPS.map((s, i) => {
                            const isDone   = i < currentStep;
                            const isActive = i === currentStep;
                            return (
                              <div key={s.key} className={`op-progress-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}>
                                <div className="op-progress-circle">{isDone && <CheckIcon />}</div>
                                <div className="op-progress-line" />
                                <span className="op-progress-label">{s.label.split(' ')[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Product thumbnails */}
                    {items.length > 0 && (
                      <div className="op-thumbs-strip">
                        {items.slice(0, 6).map((item, i) => (
                          <img key={i} src={getProductImage(item)} alt={item.products?.name || ''} className="op-thumb" />
                        ))}
                        {items.length > 6 && (
                          <div className="op-thumb-more">+{items.length - 6}</div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="op-card-footer">
                      <span className="op-card-items-label">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                      <div className="op-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="op-btn op-btn-ghost" onClick={e => downloadInvoice(order.id, order.invoice_id, e)}>
                          {invoiceLoading === order.id
                            ? <div style={{ width:12,height:12,border:'1.5px solid rgba(255,255,255,0.2)',borderTopColor:'#9ca3af',borderRadius:'50%',animation:'op-spin .6s linear infinite'}} />
                            : <DownloadIcon />
                          }
                          Invoice
                        </button>
                        <button className="op-btn op-btn-primary" onClick={() => setSelectedOrder(order)}>
                          <EyeIcon /> Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── ORDER DETAIL MODAL ───────────────────────────────── */}
        {selectedOrder && (() => {
          const o  = selectedOrder;
          const sm = STATUS_META[o.status] || STATUS_META.placed;
          const items = o.order_items || [];
          const currentStep = sm.step ?? 0;
          const statusEmoji = { placed:'🛍️', processing:'⚙️', out_for_delivery:'🚴', delivered:'✅', completed:'🎉', cancelled:'❌' };

          return (
            <div className="op-overlay" onClick={() => setSelectedOrder(null)}>
              <div className="op-modal" onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div className="op-modal-head">
                  <div className="op-modal-head-left">
                    <span className="op-modal-head-title">Order #{o.invoice_id || o.id}</span>
                    <span className="op-modal-head-sub">Placed on {fmtDate(o.created_at, { weekday: 'short' })} at {fmtTime(o.created_at)}</span>
                  </div>
                  <button className="op-modal-close" onClick={() => setSelectedOrder(null)}><XIcon /></button>
                </div>

                <div className="op-modal-body">

                  {/* Status hero */}
                  <div className="op-status-hero" style={{ background: sm.bg, borderColor: sm.border, color: sm.color }}>
                    <div className="op-status-hero-icon" style={{ background: sm.bg }}>
                      <span style={{ fontSize: '1.3rem' }}>{statusEmoji[o.status] || '📦'}</span>
                    </div>
                    <div className="op-status-hero-text">
                      <div className="op-status-hero-label">{sm.label}</div>
                      <div className="op-status-hero-sub">
                        {o.status === 'placed' && 'We have received your order and are getting it ready.'}
                        {o.status === 'processing' && 'Your items are being packed carefully.'}
                        {o.status === 'out_for_delivery' && 'Your order is on its way to you right now!'}
                        {o.status === 'delivered' && 'Delivered successfully. Enjoy your purchase!'}
                        {o.status === 'completed' && 'Order complete. Thank you for shopping with us!'}
                        {o.status === 'cancelled' && 'This order has been cancelled.'}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  {o.status !== 'cancelled' && (
                    <div className="op-tl-wrap">
                      <p className="op-tl-section-label">Order Journey</p>
                      <div className="op-tl">
                        {TIMELINE_STEPS.map((step, i) => {
                          const isDone   = i < currentStep || o.status === 'completed';
                          const isActive = i === currentStep && o.status !== 'completed';
                          return (
                            <div key={step.key} className={`op-tl-item${isDone ? ' tl-done' : ''}${isActive ? ' tl-active' : ''}`}>
                              <div className="op-tl-left">
                                <div className="op-tl-dot">{isDone && <CheckIcon />}</div>
                                <div className="op-tl-line" />
                              </div>
                              <div className="op-tl-content">
                                <p className="op-tl-title">{step.label}</p>
                                <p className="op-tl-sub">
                                  {isDone || isActive ? step.sub : 'Pending'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="op-modal-divider" />

                  {/* Order items */}
                  <p className="op-modal-items-label">Items Ordered ({items.length})</p>
                  <div className="op-modal-items-list">
                    {items.map((item, i) => (
                      <div key={i} className="op-mi">
                        <img src={getProductImage(item)} alt={item.products?.name || 'Product'} className="op-mi-img" />
                        <div className="op-mi-body">
                          <div className="op-mi-name">{item.products?.name || 'Product'}</div>
                          {item.variant_name && <span className="op-mi-variant">{item.variant_name}</span>}
                          <div className="op-mi-row">
                            <span className="op-mi-qty">Qty: {item.quantity}</span>
                            <span className="op-mi-unit">× ₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                            <span className="op-mi-price">₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="op-modal-divider" />

                  {/* Info row */}
                  <div className="op-info-row">
                    <div className="op-info-card">
                      <div className="op-info-card-label"><MapPinIcon /> Delivery Address</div>
                      <div className="op-info-val">
                        {o.delivery_address}<br />
                        <strong>Pincode:</strong> {o.pincode}
                      </div>
                    </div>
                    <div className="op-info-card">
                      <div className="op-info-card-label"><CreditCardIcon /> Payment</div>
                      <div className="op-info-val">
                        <strong>{o.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong><br />
                        <span style={{ textTransform: 'capitalize', color: o.payment_status === 'paid' ? '#34d399' : '#fbbf24' }}>
                          {o.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="op-sum">
                    <div className="op-sum-row">
                      <span className="op-sum-label">Subtotal ({items.length} items)</span>
                      <span className="op-sum-val">₹{parseFloat(o.total).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="op-sum-row">
                      <span className="op-sum-label">Delivery fee</span>
                      <span style={{ color: '#a3e635', fontWeight: 600, fontSize: '0.875rem' }}>FREE</span>
                    </div>
                    {o.payment_method !== 'cod' && o.payment_reference && (
                      <div className="op-sum-row">
                        <span className="op-sum-label">Payment ref</span>
                        <span className="op-sum-val" style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6b7280' }}>{o.payment_reference}</span>
                      </div>
                    )}
                    <div className="op-sum-hr" />
                    <div className="op-sum-total-row">
                      <span className="op-sum-total-label">Total Paid</span>
                      <span className="op-sum-total-val">₹{parseFloat(o.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="op-modal-footer">
                    <button
                      className="op-mfbtn op-mfbtn-ghost"
                      onClick={() => downloadInvoice(o.id, o.invoice_id)}
                    >
                      {invoiceLoading === o.id
                        ? <div style={{ width:14,height:14,border:'1.5px solid rgba(255,255,255,0.2)',borderTopColor:'#9ca3af',borderRadius:'50%',animation:'op-spin .6s linear infinite'}} />
                        : <InvoiceIcon />
                      }
                      Download Invoice
                    </button>
                    <button className="op-mfbtn op-mfbtn-primary" onClick={() => setSelectedOrder(null)}>
                      Close
                    </button>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* Toast */}
        {toast && (
          <div className={`op-toast op-toast-${toast.type}`}>
            {toast.type === 'success'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            }
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}