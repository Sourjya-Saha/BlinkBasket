'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icon set ────────────────────────────────────────────────
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const PackageIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

// ── Constants ────────────────────────────────────────────────
const STATUS_META = {
  placed:           { label: 'Placed',          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  processing:       { label: 'Processing',       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  out_for_delivery: { label: 'Out for Delivery', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  delivered:        { label: 'Delivered',        color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  completed:        { label: 'Completed',        color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)' },
};
const PAYMENT_META = {
  paid:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  unpaid: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)'  },
};
const ORDER_STATUSES = ['placed', 'processing', 'out_for_delivery', 'delivered', 'completed'];

// ── Single order row ─────────────────────────────────────────
function OrderRow({ order, session, onStatusUpdate, onMarkPaid }) {
  const [isOpen, setIsOpen]         = useState(false);
  const [localStatus, setLocalStatus] = useState(order.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [paidSaving, setPaidSaving]   = useState(false);

  const sm = STATUS_META[order.status] || STATUS_META.placed;
  const pm = PAYMENT_META[order.payment_status] || PAYMENT_META.unpaid;

  async function applyStatus() {
    if (localStatus === order.status) return;
    setStatusSaving(true);
    await onStatusUpdate(order.id, localStatus);
    setStatusSaving(false);
  }

  async function handleMarkPaid() {
    setPaidSaving(true);
    await onMarkPaid(order.id);
    setPaidSaving(false);
  }

  const deliveryAddr = order.delivery_address
    ? typeof order.delivery_address === 'object'
      ? Object.values(order.delivery_address).filter(Boolean).join(', ')
      : order.delivery_address
    : null;

  return (
    <div className="ao-card">
      {/* HEADER ROW */}
      <div className="ao-card-header" onClick={() => setIsOpen(o => !o)}>
        <div className="ao-header-left">
          <div>
            <div className="ao-order-id">Order #{order.id}</div>
            <div className="ao-invoice-id">{order.invoice_id}</div>
          </div>
          <div className="ao-customer-info">
            <div className="ao-customer-name">{order.users?.full_name || '—'}</div>
            <div className="ao-customer-email">{order.users?.email || ''}</div>
          </div>
        </div>
        <div className="ao-header-right">
          <span className="ao-badge" style={{ background: sm.bg, borderColor: sm.border, color: sm.color }}>
            {sm.label}
          </span>
          <span className="ao-badge" style={{ background: pm.bg, borderColor: pm.border, color: pm.color }}>
            {order.payment_status} · {order.payment_method.toUpperCase()}
          </span>
          <span className="ao-amount">₹{parseFloat(order.total).toFixed(2)}</span>
          <button className="ao-expand-btn" aria-label="Toggle">
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {isOpen && (
        <div className="ao-expanded">
          <div className="ao-expanded-grid">
            {/* Items */}
            <div className="ao-expand-col">
              <p className="ao-expand-label">Order Items</p>
              <div className="ao-items-list">
                {(order.order_items || []).map(item => (
                  <div key={item.id} className="ao-item-row">
                    <div className="ao-item-icon"><PackageIcon /></div>
                    <div className="ao-item-name">
                      {item.products?.name}
                      {item.variant_name ? <span className="ao-item-variant"> ({item.variant_name})</span> : null}
                    </div>
                    <div className="ao-item-right">
                      <span className="ao-item-qty">×{item.quantity}</span>
                      <span className="ao-item-price">₹{item.price}</span>
                    </div>
                  </div>
                ))}
                <div className="ao-items-total">
                  <span>Total</span>
                  <span style={{ color: '#fb923c', fontWeight: 700 }}>₹{parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery + Controls */}
            <div className="ao-expand-col">
              {deliveryAddr && (
                <>
                  <p className="ao-expand-label">Delivery Address</p>
                  <div className="ao-addr-box">
                    <MapPinIcon />
                    <span>{deliveryAddr}{order.pincode ? ` — ${order.pincode}` : ''}</span>
                  </div>
                </>
              )}

              <p className="ao-expand-label" style={{ marginTop: deliveryAddr ? '1rem' : 0 }}>Update Status</p>
              <div className="ao-status-controls">
                <select
                  className="ao-status-select"
                  value={localStatus}
                  onChange={e => setLocalStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                  ))}
                </select>
                <button
                  className="ao-apply-btn"
                  onClick={applyStatus}
                  disabled={statusSaving || localStatus === order.status}
                >
                  {statusSaving
                    ? <><div className="ao-btn-spinner" /> Saving…</>
                    : <><RefreshIcon /> Apply</>
                  }
                </button>
              </div>

              {order.payment_status === 'unpaid' && order.payment_method === 'cod' && (
                <button
                  className="ao-paid-btn"
                  onClick={handleMarkPaid}
                  disabled={paidSaving}
                >
                  {paidSaving
                    ? <><div className="ao-btn-spinner" style={{ borderTopColor: '#6ee7b7' }} /> Marking…</>
                    : <><CheckCircleIcon /> Mark as Paid</>
                  }
                </button>
              )}

              {/* Order meta */}
              <div className="ao-order-meta">
                <div className="ao-meta-row">
                  <span>Placed</span>
                  <span>{order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                {order.payment_reference && (
                  <div className="ao-meta-row">
                    <span>Payment Ref</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{order.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function AdminOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  const LIMIT = 15;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus)  params.set('status', filterStatus);
      if (filterPayment) params.set('payment_status', filterPayment);
      const res  = await fetch(`${API_BASE}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const json = await res.json();
      setOrders(json.data || []);
      setTotal(json.count || 0);
    } catch { showToast('error', 'Failed to load orders'); }
    finally { setLoading(false); }
  }, [session, page, filterStatus, filterPayment]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3200); }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast('success', `Order #${orderId} updated to ${STATUS_META[newStatus]?.label || newStatus}`);
    } catch { showToast('error', 'Status update failed'); }
  }

  async function handleMarkPaid(orderId) {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o));
      showToast('success', `Order #${orderId} marked as paid`);
    } catch { showToast('error', 'Failed to mark as paid'); }
  }

  const totalPages = Math.ceil(total / LIMIT);
  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  // Summary counts
  const statusCounts = ORDER_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ao-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .ao-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 65% 45% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%); }
        .ao-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px; }

        .ao-main { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }

        /* PAGE HEADER */
        .ao-page-header { margin-bottom: 2rem; }
        .ao-page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .ao-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }

        /* STATUS SUMMARY CHIPS */
        .ao-status-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .ao-status-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 8px;
          font-size: 0.72rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; border: 1px solid;
          transition: all 0.15s;
        }
        .ao-status-chip.active { opacity: 1; transform: scale(1.02); }
        .ao-status-chip:not(.active) { opacity: 0.55; }
        .ao-status-chip:hover { opacity: 1; }
        .ao-chip-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* FILTERS */
        .ao-filters { display: flex; gap: 0.65rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
        .ao-filter-label { font-size: 0.72rem; font-weight: 600; color: #4b5563; display: flex; align-items: center; gap: 5px; }
        .ao-select {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 9px;
          padding: 0.5rem 0.9rem; color: #e5e7eb;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
          outline: none; cursor: pointer; transition: border-color 0.2s;
        }
        .ao-select:focus { border-color: rgba(251,146,60,0.4); }
        .ao-reset-btn {
          padding: 0.5rem 0.9rem; border-radius: 9px;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280; font-size: 0.78rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .ao-reset-btn:hover { border-color: rgba(255,255,255,0.15); color: #9ca3af; }
        .ao-total-badge {
          margin-left: auto; background: rgba(251,146,60,0.1);
          border: 1px solid rgba(251,146,60,0.25); border-radius: 6px;
          padding: 4px 10px; font-size: 0.72rem; color: #fb923c; font-weight: 600;
        }

        /* ORDER CARD */
        .ao-card {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
          margin-bottom: 0.75rem; overflow: hidden;
          transition: border-color 0.18s;
        }
        .ao-card:hover { border-color: rgba(255,255,255,0.1); }

        .ao-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 1.3rem; cursor: pointer;
          gap: 0.75rem; flex-wrap: wrap;
          transition: background 0.15s;
        }
        .ao-card-header:hover { background: rgba(255,255,255,0.015); }

        .ao-header-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; flex: 1; min-width: 0; }
        .ao-order-id { font-family: 'Syne', sans-serif; font-size: 0.92rem; font-weight: 800; color: #fff; }
        .ao-invoice-id { font-size: 0.68rem; color: #374151; font-family: monospace; margin-top: 2px; }
        .ao-customer-name { font-size: 0.82rem; font-weight: 500; color: #d1d5db; }
        .ao-customer-email { font-size: 0.72rem; color: #6b7280; margin-top: 1px; }

        .ao-header-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0; }
        .ao-amount { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #fb923c; }
        .ao-badge {
          display: inline-block; padding: 3px 9px; border-radius: 5px;
          font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; border: 1px solid;
        }
        .ao-expand-btn {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .ao-expand-btn:hover { background: rgba(255,255,255,0.09); color: #9ca3af; }

        /* EXPANDED BODY */
        .ao-expanded {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 1.3rem;
          background: rgba(255,255,255,0.012);
        }
        .ao-expanded-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .ao-expand-col {}
        .ao-expand-label {
          font-size: 0.68rem; font-weight: 700; color: #374151;
          text-transform: uppercase; letter-spacing: 0.09em;
          margin-bottom: 0.75rem;
        }

        /* ITEMS LIST */
        .ao-items-list { display: flex; flex-direction: column; gap: 0; }
        .ao-item-row {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .ao-item-row:last-child { border-bottom: none; }
        .ao-item-icon { color: #374151; flex-shrink: 0; }
        .ao-item-name { flex: 1; font-size: 0.82rem; color: #d1d5db; min-width: 0; }
        .ao-item-variant { color: #6b7280; }
        .ao-item-right { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
        .ao-item-qty { font-size: 0.75rem; color: #6b7280; }
        .ao-item-price { font-size: 0.82rem; font-weight: 600; color: #9ca3af; }
        .ao-items-total {
          display: flex; justify-content: space-between;
          padding: 0.55rem 0 0; border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 0.82rem; color: #6b7280; font-weight: 500;
          margin-top: 4px;
        }

        /* ADDR */
        .ao-addr-box {
          display: flex; align-items: flex-start; gap: 7px;
          padding: 0.75rem 0.9rem; border-radius: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          font-size: 0.8rem; color: #9ca3af; line-height: 1.5;
        }
        .ao-addr-box svg { flex-shrink: 0; margin-top: 2px; color: #fb923c; }

        /* CONTROLS */
        .ao-status-controls { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
   .ao-status-select {
  flex: 1;
  /* Use a solid color instead of just rgba to ensure the dropdown list inherits it */
  background-color: #0d1018; 
  background-image: none; /* Removes native arrows in some browsers to allow styling */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  padding: 0.48rem 0.8rem;
  color: #e5e7eb;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.18s;
}
        .ao-status-select:focus { border-color: rgba(251,146,60,0.4); }
        .ao-apply-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0.48rem 1rem; border-radius: 9px;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.28);
          color: #fb923c; font-size: 0.8rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap;
        }
        .ao-apply-btn:hover:not(:disabled) { background: rgba(251,146,60,0.18); }
        .ao-apply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ao-paid-btn {
          display: flex; align-items: center; gap: 6px; width: 100%;
          padding: 0.5rem 1rem; border-radius: 9px;
          background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25);
          color: #6ee7b7; font-size: 0.8rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
          justify-content: center; margin-bottom: 0.75rem;
        }
        .ao-paid-btn:hover:not(:disabled) { background: rgba(52,211,153,0.15); }
        .ao-paid-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ao-btn-spinner {
          width: 11px; height: 11px;
          border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c;
          border-radius: 50%; animation: aoSpin 0.7s linear infinite;
        }
        @keyframes aoSpin { to { transform: rotate(360deg); } }

        .ao-order-meta { margin-top: 0; }
        .ao-meta-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.45rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.78rem;
        }
        .ao-meta-row:first-child { border-top: 1px solid rgba(255,255,255,0.04); }
        .ao-meta-row span:first-child { color: #4b5563; }
        .ao-meta-row span:last-child  { color: #9ca3af; }

        /* PAGINATION */
        .ao-pag { display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
        .ao-pag-info { font-size: 0.8rem; color: #6b7280; }
        .ao-pag-btns { display: flex; gap: 0.5rem; }
        .ao-pag-btn { padding: 6px 14px; border-radius: 8px; background: rgba(13,16,24,0.8); border: 1px solid rgba(255,255,255,0.08); color: #9ca3af; font-size: 0.8rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .ao-pag-btn:hover:not(:disabled) { border-color: rgba(251,146,60,0.3); color: #fb923c; }
        .ao-pag-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ao-pag-cur { padding: 6px 14px; border-radius: 8px; background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.3); color: #fb923c; font-size: 0.8rem; }

        /* EMPTY */
        .ao-empty { text-align: center; padding: 4rem; background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; }
        .ao-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(251,146,60,0.06); border: 1px solid rgba(251,146,60,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #374151; }

        /* TOAST */
        .ao-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(12px); animation: aoUp 0.25s ease; display: flex; align-items: center; gap: 8px; }
        .ao-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .ao-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes aoUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 700px) {
          .ao-main { padding: 1rem 1rem 3rem; }
          .ao-expanded-grid { grid-template-columns: 1fr; }
          .ao-header-right { display: none; }
          .ao-amount { display: block; }
        }
      `}</style>

      <div className="ao-root">
        <div className="ao-bg" />
        <div className="ao-grid" />
        <AdminNav />

        <main className="ao-main">
          {/* PAGE HEADER */}
          <div className="ao-page-header">
            <h1 className="ao-page-title">Orders</h1>
            <p className="ao-page-sub">View, filter, and manage all customer orders.</p>
          </div>

          {/* STATUS CHIPS */}
          <div className="ao-status-chips">
            {ORDER_STATUSES.map(s => {
              const m = STATUS_META[s];
              return (
                <button
                  key={s}
                  className={`ao-status-chip${filterStatus === s ? ' active' : ''}`}
                  style={{ background: m.bg, borderColor: m.border, color: m.color }}
                  onClick={() => { setFilterStatus(filterStatus === s ? '' : s); setPage(1); }}
                >
                  <span className="ao-chip-dot" style={{ background: m.color }} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* FILTERS */}
          <div className="ao-filters">
            <span className="ao-filter-label"><FilterIcon /> Filters</span>
            <select className="ao-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
            </select>
            <select className="ao-select" value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1); }}>
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid (COD)</option>
            </select>
            {(filterStatus || filterPayment) && (
              <button className="ao-reset-btn" onClick={() => { setFilterStatus(''); setFilterPayment(''); setPage(1); }}>
                Clear filters
              </button>
            )}
            <span className="ao-total-badge">{total} order{total !== 1 ? 's' : ''}</span>
          </div>

          {/* ORDERS */}
          {loading ? (
            <div className="ao-empty">
              <div className="ao-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="ao-empty">
              <div className="ao-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>No orders found</p>
              <p style={{ fontSize: '0.82rem', color: '#4b5563' }}>Try adjusting your filters.</p>
            </div>
          ) : (
            orders.map(order => (
              <OrderRow
                key={order.id}
                order={order}
                session={session}
                onStatusUpdate={handleStatusUpdate}
                onMarkPaid={handleMarkPaid}
              />
            ))
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="ao-pag">
              <span className="ao-pag-info">Page {page} of {totalPages} · {total} total</span>
              <div className="ao-pag-btns">
                <button className="ao-pag-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                <span className="ao-pag-cur">{page}</span>
                <button className="ao-pag-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
              </div>
            </div>
          )}
        </main>

        {toast && (
          <div className={`ao-toast ${toast.type}`}>
            {toast.type === 'success'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

function FullPageSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(251,146,60,0.15)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}