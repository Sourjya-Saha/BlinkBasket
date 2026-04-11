'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icon set ────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const FactoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
  </svg>
);
const FactoryLargeIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function AdminManufacturers() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [deleteId, setDeleteId]           = useState(null);
  const [formName, setFormName]           = useState('');
  const [formErr, setFormErr]             = useState('');
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState(null);
  const [search, setSearch]               = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  const fetchManufacturers = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/manufacturers`);
      const data = await res.json();
      setManufacturers(Array.isArray(data) ? data : []);
    } catch { showToast('error', 'Failed to load manufacturers'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchManufacturers(); }, [fetchManufacturers]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditTarget(null); setFormName(''); setFormErr(''); setShowModal(true);
  }
  function openEdit(mfg) {
    setEditTarget(mfg); setFormName(mfg.name || ''); setFormErr(''); setShowModal(true);
  }
  function closeModal() {
    setShowModal(false); setEditTarget(null); setFormName(''); setFormErr('');
  }

  async function handleSave() {
    if (!formName.trim()) { setFormErr('Name is required'); return; }
    setSaving(true);
    try {
      const url    = editTarget ? `${API_BASE}/api/manufacturers/${editTarget.id}` : `${API_BASE}/api/manufacturers`;
      const method = editTarget ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ name: formName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (editTarget) setManufacturers(prev => prev.map(m => m.id === editTarget.id ? data : m));
      else            setManufacturers(prev => [data, ...prev]);
      showToast('success', `Brand ${editTarget ? 'updated' : 'added'}!`);
      closeModal();
    } catch (err) {
      setFormErr(err.message);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/api/manufacturers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error();
      setManufacturers(prev => prev.filter(m => m.id !== id));
      showToast('success', 'Manufacturer deleted');
    } catch { showToast('error', 'Delete failed — may have linked products'); }
    finally { setDeleteId(null); }
  }

  const filtered = manufacturers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .am-root {
          min-height: 100vh; background: #060810;
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow-x: hidden;
        }
        .am-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 65% 45% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%),
                      radial-gradient(ellipse 40% 30% at 0% 100%, rgba(251,146,60,0.04) 0%, transparent 65%);
        }
        .am-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        .am-main {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 1.5rem 1.5rem 4rem;
        }

        /* PAGE HEADER */
        .am-page-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
        }
        .am-page-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; font-weight: 800;
          color: #fff; letter-spacing: -0.04em;
        }
        .am-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }
        .am-add-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 0.58rem 1.2rem; border-radius: 11px;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35);
          color: #fb923c; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .am-add-btn:hover { background: rgba(251,146,60,0.2); }

        /* TOOLBAR */
        .am-toolbar {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .am-search-wrap {
          position: relative; flex: 1; max-width: 380px;
        }
        .am-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: #4b5563; pointer-events: none;
        }
        .am-search {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 11px;
          padding: 0.58rem 1rem 0.58rem 2.4rem;
          width: 100%;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s;
        }
        .am-search:focus { border-color: rgba(251,146,60,0.4); }
        .am-search::placeholder { color: #4b5563; }
        .am-count {
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25);
          border-radius: 6px; padding: 4px 10px;
          font-size: 0.72rem; color: #fb923c; font-weight: 600;
        }

        /* STATS ROW */
        .am-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem; margin-bottom: 1.5rem;
        }
        .am-stat {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
          padding: 1.1rem 1.2rem;
          display: flex; align-items: center; gap: 0.85rem;
        }
        .am-stat-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.15);
          display: flex; align-items: center; justify-content: center; color: #fb923c;
        }
        .am-stat-label { font-size: 0.68rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .am-stat-value { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: #fff; }

        /* TABLE WRAPPER */
        .am-table-card {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 18px;
          overflow: hidden;
        }
        .am-table { width: 100%; border-collapse: collapse; }
        .am-table thead tr {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .am-table th {
          padding: 0.85rem 1.3rem; text-align: left;
          font-size: 0.68rem; font-weight: 700; color: #374151;
          text-transform: uppercase; letter-spacing: 0.09em;
        }
        .am-table td {
          padding: 0.9rem 1.3rem; font-size: 0.875rem; color: #e5e7eb;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .am-table tbody tr:last-child td { border-bottom: none; }
        .am-table tbody tr { transition: background 0.12s; }
        .am-table tbody tr:hover { background: rgba(255,255,255,0.025); }

        /* BRAND CELL */
        .am-brand-cell { display: flex; align-items: center; gap: 0.85rem; }
        .am-brand-avatar {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.18);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c;
        }
        .am-brand-name {
          font-family: 'Syne', sans-serif; font-size: 0.9rem;
          font-weight: 700; color: #f3f4f6;
        }
        .am-brand-id {
          font-size: 0.68rem; color: #374151;
          font-family: monospace; margin-top: 2px;
        }
        .am-date { font-size: 0.78rem; color: #6b7280; }
        .am-actions-cell { display: flex; gap: 0.4rem; }
        .am-edit-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 7px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af; font-size: 0.75rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .am-edit-btn:hover { background: rgba(255,255,255,0.09); color: #e5e7eb; }
        .am-del-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 7px;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
          color: #f87171; font-size: 0.75rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
        }
        .am-del-btn:hover { background: rgba(239,68,68,0.14); }

        /* MOBILE CARDS */
        .am-mobile-cards { display: none; flex-direction: column; gap: 0.6rem; }
        .am-mobile-card {
          background: rgba(13,16,24,0.8); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 1rem;
          display: flex; align-items: center; gap: 0.85rem;
          transition: border-color 0.18s;
        }
        .am-mobile-card:hover { border-color: rgba(251,146,60,0.2); }
        .am-mobile-info { flex: 1; min-width: 0; }

        /* MODAL */
        .am-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .am-modal {
          background: rgba(10,12,20,0.97); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
          width: 100%; max-width: 440px; padding: 2rem;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: amSlide 0.22s ease;
        }
        @keyframes amSlide {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        .am-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .am-modal-title {
          font-family: 'Syne', sans-serif; font-size: 1.1rem;
          font-weight: 800; color: #fff;
        }
        .am-modal-close {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          color: #6b7280; cursor: pointer; width: 30px; height: 30px;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .am-modal-close:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }

        /* FORM PREVIEW (brand avatar in modal) */
        .am-modal-preview {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.85rem 1rem; border-radius: 12px;
          background: rgba(251,146,60,0.05); border: 1px solid rgba(251,146,60,0.12);
          margin-bottom: 1.25rem;
        }
        .am-modal-preview-avatar {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.2);
          display: flex; align-items: center; justify-content: center; color: #fb923c;
        }
        .am-modal-preview-text {
          font-family: 'Syne', sans-serif; font-size: 0.88rem;
          font-weight: 700; color: #e5e7eb;
        }
        .am-modal-preview-sub { font-size: 0.72rem; color: #6b7280; margin-top: 2px; }

        .am-field { display: flex; flex-direction: column; gap: 0.32rem; }
        .am-label {
          font-size: 0.68rem; font-weight: 700; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .am-input {
          background: #0e1117; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.65rem 0.9rem;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
        }
        .am-input:focus {
          border-color: rgba(251,146,60,0.5);
          box-shadow: 0 0 0 3px rgba(251,146,60,0.07);
        }
        .am-input.err { border-color: rgba(239,68,68,0.45); }
        .am-input-error { font-size: 0.7rem; color: #f87171; margin-top: 3px; }

        .am-modal-footer {
          display: flex; gap: 0.75rem; justify-content: flex-end;
          margin-top: 1.5rem; padding-top: 1.2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .am-btn-cancel {
          padding: 0.6rem 1.3rem; border-radius: 10px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: #9ca3af; font-size: 0.875rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .am-btn-cancel:hover { background: rgba(255,255,255,0.06); color: #e5e7eb; }
        .am-btn-save {
          display: flex; align-items: center; gap: 7px;
          padding: 0.6rem 1.6rem; border-radius: 10px;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.4);
          color: #fb923c; font-size: 0.875rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
        }
        .am-btn-save:hover:not(:disabled) { background: rgba(251,146,60,0.22); }
        .am-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .am-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c;
          border-radius: 50%; animation: amSpin 0.7s linear infinite;
        }
        @keyframes amSpin { to { transform: rotate(360deg); } }

        /* CONFIRM */
        .am-confirm-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .am-confirm-box {
          background: rgba(10,12,20,0.98); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; padding: 2rem; max-width: 360px; text-align: center;
        }
        .am-confirm-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; color: #f87171;
        }
        .am-confirm-title {
          font-family: 'Syne', sans-serif; font-size: 1rem;
          font-weight: 700; color: #fff; margin-bottom: 0.4rem;
        }
        .am-confirm-sub {
          font-size: 0.82rem; color: #6b7280;
          margin-bottom: 1.5rem; line-height: 1.6;
        }
        .am-confirm-btns { display: flex; gap: 0.75rem; justify-content: center; }
        .am-confirm-cancel {
          padding: 0.55rem 1.2rem; border-radius: 9px; background: transparent;
          border: 1px solid rgba(255,255,255,0.1); color: #9ca3af;
          font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .am-confirm-del {
          padding: 0.55rem 1.3rem; border-radius: 9px;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; font-size: 0.875rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        /* TOAST */
        .am-toast {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
          padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif; border: 1px solid;
          backdrop-filter: blur(12px); animation: amUp 0.25s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .am-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .am-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes amUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* EMPTY STATE */
        .am-empty {
          text-align: center; padding: 4rem;
          background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
        }
        .am-empty-icon {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(251,146,60,0.06); border: 1px solid rgba(251,146,60,0.12);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; color: #374151;
        }
        .am-empty-title {
          font-family: 'Syne', sans-serif; font-size: 1rem;
          font-weight: 700; color: #e5e7eb; margin-bottom: 6px;
        }
        .am-empty-sub { font-size: 0.82rem; color: #4b5563; }

        /* LOADING ROWS */
        .am-loading-cell { text-align: center; padding: 3.5rem; color: #4b5563; font-size: 0.875rem; }

        @media (max-width: 768px) {
          .am-main { padding: 1rem 1rem 3rem; }
          .am-table-card { display: none; }
          .am-mobile-cards { display: flex; }
        }
      `}</style>

      <div className="am-root">
        <div className="am-bg" />
        <div className="am-grid" />
        <AdminNav />

        <main className="am-main">
          {/* PAGE HEADER */}
          <div className="am-page-header">
            <div>
              <h1 className="am-page-title">Manufacturers</h1>
              <p className="am-page-sub">Manage brands and product manufacturers.</p>
            </div>
            <button className="am-add-btn" onClick={openAdd}>
              <PlusIcon /> Add Manufacturer
            </button>
          </div>

          {/* STATS */}
          <div className="am-stats">
            <div className="am-stat">
              <div className="am-stat-icon"><FactoryIcon /></div>
              <div>
                <div className="am-stat-label">Total Brands</div>
                <div className="am-stat-value">{manufacturers.length}</div>
              </div>
            </div>
            <div className="am-stat">
              <div className="am-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <div className="am-stat-label">Active</div>
                <div className="am-stat-value">{filtered.length}</div>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="am-toolbar">
            <div className="am-search-wrap">
              <span className="am-search-icon"><SearchIcon /></span>
              <input
                className="am-search"
                placeholder="Search manufacturers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="am-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── DESKTOP TABLE ── */}
          <div className="am-table-card">
            {loading ? (
              <table className="am-table">
                <tbody><tr><td className="am-loading-cell" colSpan={4}>Loading manufacturers…</td></tr></tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div className="am-empty">
                <div className="am-empty-icon"><FactoryLargeIcon /></div>
                <div className="am-empty-title">{search ? 'No matches found' : 'No manufacturers yet'}</div>
                <div className="am-empty-sub">{search ? 'Try a different search term.' : 'Add your first brand to get started.'}</div>
              </div>
            ) : (
              <table className="am-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>ID</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="am-brand-cell">
                          <div className="am-brand-avatar"><FactoryIcon /></div>
                          <div>
                            <div className="am-brand-name">{m.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4b5563' }}>
                          #{m.id}
                        </span>
                      </td>
                      <td>
                        <span className="am-date">
                          {m.created_at
                            ? new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="am-actions-cell">
                          <button className="am-edit-btn" onClick={() => openEdit(m)}>
                            <EditIcon /> Edit
                          </button>
                          <button className="am-del-btn" onClick={() => setDeleteId(m.id)}>
                            <TrashIcon /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="am-mobile-cards">
            {loading ? (
              <div className="am-empty">
                <div className="am-empty-icon"><FactoryLargeIcon /></div>
                <div className="am-empty-sub">Loading…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="am-empty">
                <div className="am-empty-icon"><FactoryLargeIcon /></div>
                <div className="am-empty-title">{search ? 'No matches' : 'No manufacturers yet'}</div>
              </div>
            ) : filtered.map(m => (
              <div key={m.id} className="am-mobile-card">
                <div className="am-brand-avatar"><FactoryIcon /></div>
                <div className="am-mobile-info">
                  <div className="am-brand-name">{m.name}</div>
                  <div className="am-date" style={{ marginTop: 3 }}>
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div className="am-actions-cell">
                  <button className="am-edit-btn" onClick={() => openEdit(m)} style={{ padding: '5px 9px' }}>
                    <EditIcon />
                  </button>
                  <button className="am-del-btn" onClick={() => setDeleteId(m.id)} style={{ padding: '5px 9px' }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ── ADD / EDIT MODAL ── */}
        {showModal && (
          <div className="am-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="am-modal">
              <div className="am-modal-header">
                <span className="am-modal-title">
                  {editTarget ? 'Edit Manufacturer' : 'Add Manufacturer'}
                </span>
                <button className="am-modal-close" onClick={closeModal}>✕</button>
              </div>

              {/* Live preview */}
              <div className="am-modal-preview">
                <div className="am-modal-preview-avatar"><FactoryIcon /></div>
                <div>
                  <div className="am-modal-preview-text">
                    {formName.trim() || 'Brand name preview'}
                  </div>
                  <div className="am-modal-preview-sub">Manufacturer</div>
                </div>
              </div>

              <div className="am-field">
                <label className="am-label">Manufacturer / Brand Name *</label>
                <input
                  className={`am-input${formErr ? ' err' : ''}`}
                  value={formName}
                  onChange={e => { setFormName(e.target.value); setFormErr(''); }}
                  placeholder="e.g. Nestlé India"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                {formErr && <span className="am-input-error">{formErr}</span>}
              </div>

              <div className="am-modal-footer">
                <button className="am-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="am-btn-save" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><div className="am-spinner" /> Saving…</>
                    : editTarget ? 'Update Brand' : 'Add Brand'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleteId && (
          <div className="am-confirm-overlay">
            <div className="am-confirm-box">
              <div className="am-confirm-icon"><TrashIcon /></div>
              <p className="am-confirm-title">Delete Manufacturer?</p>
              <p className="am-confirm-sub">
                This will permanently delete the manufacturer. Products linked to it will lose their brand assignment.
              </p>
              <div className="am-confirm-btns">
                <button className="am-confirm-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="am-confirm-del" onClick={() => handleDelete(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`am-toast ${toast.type}`}>
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