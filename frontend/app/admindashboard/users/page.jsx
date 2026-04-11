'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icon set ────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const EmailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.97a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Role colors ──────────────────────────────────────────────
const ROLE_STYLES = {
  admin: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)' },
  user:  { color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)' },
};

// ── User initials ────────────────────────────────────────────
function getInitials(user) {
  return (user.full_name || user.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Avatar color from string hash ───────────────────────────
function avatarColor(str) {
  const palette = [
    ['rgba(251,146,60,0.15)', 'rgba(251,146,60,0.3)', '#fb923c'],
    ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.3)', '#a5b4fc'],
    ['rgba(52,211,153,0.15)', 'rgba(52,211,153,0.3)', '#34d399'],
    ['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.3)', '#a78bfa'],
    ['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.3)', '#fbbf24'],
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]       = useState(true);
  const [roleLoading, setRoleLoading] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [toast, setToast]           = useState(null);

  const LIMIT = 15;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  const fetchUsers = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search.trim()) params.set('search', search.trim());
      const res  = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const json = await res.json();
      setUsers(json.data || []);
      setTotal(json.count || 0);
    } catch { showToast('error', 'Failed to fetch users'); }
    finally { setLoading(false); }
  }, [session, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3200); }

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setRoleLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast('success', `${user.email.split('@')[0]} is now ${newRole}`);
    } catch { showToast('error', 'Role update failed'); }
    finally { setRoleLoading(null); }
  }

  const filtered  = roleFilter ? users.filter(u => u.role === roleFilter) : users;
  const totalPages = Math.ceil(total / LIMIT);
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .au-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .au-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 65% 45% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%),
                      radial-gradient(ellipse 40% 30% at 0% 100%, rgba(99,102,241,0.04) 0%, transparent 65%); }
        .au-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px; }

        .au-main { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }

        /* PAGE HEADER */
        .au-page-header { margin-bottom: 2rem; }
        .au-page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .au-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }

        /* STATS */
        .au-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .au-stat {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
          padding: 1.1rem 1.2rem; display: flex; align-items: center; gap: 0.85rem;
          cursor: pointer; transition: all 0.18s;
        }
        .au-stat:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
        .au-stat.active { border-color: rgba(251,146,60,0.3); background: rgba(251,146,60,0.05); }
        .au-stat-icon { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .au-stat-label { font-size: 0.68rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .au-stat-value { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: #fff; }

        /* TOOLBAR */
        .au-toolbar { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .au-search-wrap { position: relative; flex: 1; max-width: 380px; }
        .au-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #4b5563; pointer-events: none; }
        .au-search {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 11px;
          padding: 0.58rem 1rem 0.58rem 2.4rem; width: 100%;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s;
        }
        .au-search:focus { border-color: rgba(251,146,60,0.4); }
        .au-search::placeholder { color: #4b5563; }
        .au-total-badge { margin-left: auto; background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25); border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; color: #fb923c; font-weight: 600; }

        /* TABLE */
        .au-table-card { background: rgba(13,16,24,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; }
        .au-table { width: 100%; border-collapse: collapse; }
        .au-table thead tr { background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .au-table th { padding: 0.85rem 1.25rem; text-align: left; font-size: 0.68rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.09em; }
        .au-table td { padding: 0; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .au-table tbody tr:last-child td { border-bottom: none; }
        .au-table tbody tr { transition: background 0.12s; cursor: pointer; }
        .au-table tbody tr:hover { background: rgba(255,255,255,0.025); }
        .au-table tbody tr.expanded { background: rgba(251,146,60,0.03); border-color: rgba(251,146,60,0.1); }

        .au-td-inner { padding: 0.9rem 1.25rem; }

        /* USER CELL */
        .au-user-cell { display: flex; align-items: center; gap: 0.85rem; }
        .au-avatar {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 800;
        }
        .au-user-name { font-weight: 600; color: #f3f4f6; font-size: 0.85rem; margin-bottom: 2px; }
        .au-user-email { font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 4px; }

        /* BADGES */
        .au-role-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 6px;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; border: 1px solid;
        }
        .au-provider-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #9ca3af; border-radius: 6px; padding: 3px 9px;
          font-size: 0.7rem; font-weight: 500;
        }

        /* DATE */
        .au-date { font-size: 0.78rem; color: #6b7280; display: flex; align-items: center; gap: 5px; }

        /* ROLE TOGGLE BTN */
        .au-role-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 7px; cursor: pointer;
          font-size: 0.75rem; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid; transition: opacity 0.15s, transform 0.12s;
          background: transparent;
        }
        .au-role-btn:hover:not(:disabled) { opacity: 0.8; transform: scale(0.97); }
        .au-role-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .au-role-btn.to-admin { color: #fb923c; border-color: rgba(251,146,60,0.35); }
        .au-role-btn.to-admin:hover:not(:disabled) { background: rgba(251,146,60,0.08); }
        .au-role-btn.to-user  { color: #a5b4fc; border-color: rgba(99,102,241,0.3); }
        .au-role-btn.to-user:hover:not(:disabled)  { background: rgba(99,102,241,0.08); }

        /* EXPANDED ROW */
        .au-expanded-row td { padding: 0; }
        .au-expanded-panel {
          padding: 1rem 1.25rem 1.25rem;
          background: rgba(255,255,255,0.015);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .au-expanded-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
        .au-exp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem; }
        .au-exp-label { font-size: 0.65rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
        .au-exp-value { font-size: 0.85rem; color: #d1d5db; word-break: break-all; }
        .au-exp-value.empty { color: #374151; font-style: italic; font-size: 0.8rem; }

        /* MOBILE CARDS */
        .au-mobile-cards { display: none; flex-direction: column; gap: 0.6rem; }
        .au-mobile-card { background: rgba(13,16,24,0.8); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 1rem; transition: border-color 0.18s; }
        .au-mobile-card:hover { border-color: rgba(251,146,60,0.2); }
        .au-mobile-top { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.75rem; }
        .au-mobile-info { flex: 1; min-width: 0; }
        .au-mobile-bottom { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }

        /* PAGINATION */
        .au-pag { display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
        .au-pag-info { font-size: 0.8rem; color: #6b7280; }
        .au-pag-btns { display: flex; gap: 0.5rem; }
        .au-pag-btn { padding: 6px 14px; border-radius: 8px; background: rgba(13,16,24,0.8); border: 1px solid rgba(255,255,255,0.08); color: #9ca3af; font-size: 0.8rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .au-pag-btn:hover:not(:disabled) { border-color: rgba(251,146,60,0.3); color: #fb923c; }
        .au-pag-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .au-pag-cur { padding: 6px 14px; border-radius: 8px; background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.3); color: #fb923c; font-size: 0.8rem; }

        /* EMPTY */
        .au-empty { text-align: center; padding: 4rem; background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; }
        .au-empty-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(251,146,60,0.06); border: 1px solid rgba(251,146,60,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #374151; }

        /* TOAST */
        .au-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(12px); animation: auUp 0.25s ease; display: flex; align-items: center; gap: 8px; }
        .au-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .au-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes auUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* SPINNER (btn) */
        .au-btn-spin { width: 11px; height: 11px; border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c; border-radius: 50%; animation: auSpin 0.7s linear infinite; }
        @keyframes auSpin { to { transform: rotate(360deg); } }

        @media (max-width: 800px) {
          .au-main { padding: 1rem 1rem 3rem; }
          .au-table-card { display: none; }
          .au-mobile-cards { display: flex; }
        }
      `}</style>

      <div className="au-root">
        <div className="au-bg" />
        <div className="au-grid" />
        <AdminNav />

        <main className="au-main">
          {/* PAGE HEADER */}
          <div className="au-page-header">
            <h1 className="au-page-title">Users</h1>
            <p className="au-page-sub">Manage accounts, roles, and permissions.</p>
          </div>

          {/* STATS — clickable as filters */}
          <div className="au-stats">
            {[
              { key: '',      label: 'Total Users', value: total,        icon: <UsersIcon />, iconBg: 'rgba(251,146,60,0.08)', iconBorder: 'rgba(251,146,60,0.18)', iconColor: '#fb923c' },
              { key: 'admin', label: 'Admins',      value: adminCount,   icon: <ShieldIcon />, iconBg: 'rgba(251,146,60,0.08)', iconBorder: 'rgba(251,146,60,0.18)', iconColor: '#fb923c' },
              { key: 'user',  label: 'Users',        value: total - adminCount, icon: <UserIcon />, iconBg: 'rgba(99,102,241,0.08)', iconBorder: 'rgba(99,102,241,0.18)', iconColor: '#a5b4fc' },
            ].map(({ key, label, value, icon, iconBg, iconBorder, iconColor }) => (
              <div
                key={key}
                className={`au-stat${roleFilter === key ? ' active' : ''}`}
                onClick={() => setRoleFilter(roleFilter === key ? '' : key)}
              >
                <div className="au-stat-icon" style={{ background: iconBg, border: `1px solid ${iconBorder}`, color: iconColor }}>
                  {icon}
                </div>
                <div>
                  <div className="au-stat-label">{label}</div>
                  <div className="au-stat-value">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div className="au-toolbar">
            <div className="au-search-wrap">
              <span className="au-search-icon"><SearchIcon /></span>
              <input
                className="au-search"
                placeholder="Search by email or name…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <span className="au-total-badge">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── DESKTOP TABLE ── */}
          <div className="au-table-card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#4b5563', fontSize: '0.875rem' }}>
                Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="au-empty">
                <div className="au-empty-icon"><UsersIcon /></div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>No users found</p>
                <p style={{ fontSize: '0.82rem', color: '#4b5563' }}>Try adjusting your search.</p>
              </div>
            ) : (
              <table className="au-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Provider</th>
                    <th>Joined</th>
                    {/* <th>Action</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const [avatarBg, avatarBorder, avatarTextColor] = avatarColor(u.email || u.id || '');
                    const rs = ROLE_STYLES[u.role] || ROLE_STYLES.user;
                    const isExpanded = expandedUser === u.id;
                    return [
                      <tr
                        key={u.id}
                        className={isExpanded ? 'expanded' : ''}
                        onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                      >
                        <td>
                          <div className="au-td-inner">
                            <div className="au-user-cell">
                              <div className="au-avatar" style={{ background: avatarBg, border: `1px solid ${avatarBorder}`, color: 'white' }}>
                                {getInitials(u)}
                              </div>
                              <div>
                                <div className="au-user-name">{u.full_name || <span style={{ color: '#374151', fontStyle: 'italic' }}>No name</span>}</div>
                                <div className="au-user-email">
                                  <EmailIcon />
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="au-td-inner">
                            <span className="au-role-badge" style={{ background: rs.bg, borderColor: rs.border, color: rs.color }}>
                              {u.role === 'admin' ? <ShieldIcon /> : <UserIcon />}
                              {u.role}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="au-td-inner">
                            <span className="au-provider-badge">
                              {u.provider === 'google' ? <GoogleIcon /> : <EmailIcon />}
                              {u.provider === 'google' ? 'Google' : 'Email'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="au-td-inner">
                            <span className="au-date">
                              <CalendarIcon />
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </div>
                        </td>
                        {/* <td onClick={e => e.stopPropagation()}>
                          <div className="au-td-inner">
                            <button
                              className={`au-role-btn ${u.role === 'admin' ? 'to-user' : 'to-admin'}`}
                              onClick={() => toggleRole(u)}
                              disabled={roleLoading === u.id}
                            >
                              {roleLoading === u.id
                                ? <><div className="au-btn-spin" /> Saving…</>
                                : u.role === 'admin'
                                  ? <><UserIcon /> Revoke Admin</>
                                  : <><ShieldIcon /> Make Admin</>
                              }
                            </button>
                          </div>
                        </td> */}
                      </tr>,

                      /* EXPANDED PANEL */
                      isExpanded && (
                        <tr key={`${u.id}-exp`} className="au-expanded-row">
                          <td colSpan={5}>
                            <div className="au-expanded-panel">
                              <div className="au-expanded-grid">
                                <div className="au-exp-card">
                                  <div className="au-exp-label"><UserIcon /> User ID</div>
                                  <div className="au-exp-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>{u.id}</div>
                                </div>
                                <div className="au-exp-card">
                                  <div className="au-exp-label"><PhoneIcon /> Phone</div>
                                  <div className={`au-exp-value${!u.phone ? ' empty' : ''}`}>{u.phone || 'Not provided'}</div>
                                </div>
                                <div className="au-exp-card">
                                  <div className="au-exp-label"><CalendarIcon /> Full Name</div>
                                  <div className={`au-exp-value${!u.full_name ? ' empty' : ''}`}>{u.full_name || 'Not set'}</div>
                                </div>
                                <div className="au-exp-card">
                                  <div className="au-exp-label">
                                    {u.provider === 'google' ? <GoogleIcon /> : <EmailIcon />} Sign-in
                                  </div>
                                  <div className="au-exp-value">{u.provider === 'google' ? 'Google OAuth' : 'Email & Password'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    ].filter(Boolean);
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="au-mobile-cards">
            {loading ? (
              <div className="au-empty">
                <div className="au-empty-icon"><UsersIcon /></div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Loading users…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="au-empty">
                <div className="au-empty-icon"><UsersIcon /></div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>No users found</p>
              </div>
            ) : filtered.map(u => {
              const [avBg, avBorder, avColor] = avatarColor(u.email || u.id || '');
              const rs = ROLE_STYLES[u.role] || ROLE_STYLES.user;
              return (
                <div key={u.id} className="au-mobile-card">
                  <div className="au-mobile-top">
                    <div className="au-avatar" style={{ background: avBg, border: `1px solid ${avBorder}`, color: avColor, width: 40, height: 40, borderRadius: 10 }}>
                      {getInitials(u)}
                    </div>
                    <div className="au-mobile-info">
                      <div className="au-user-name">{u.full_name || <span style={{ color: '#374151', fontStyle: 'italic', fontWeight: 400 }}>No name</span>}</div>
                      <div className="au-user-email"><EmailIcon />{u.email}</div>
                    </div>
                  </div>
                  <div className="au-mobile-bottom">
                    <span className="au-role-badge" style={{ background: rs.bg, borderColor: rs.border, color: rs.color }}>
                      {u.role === 'admin' ? <ShieldIcon /> : <UserIcon />}{u.role}
                    </span>
                    <span className="au-provider-badge">
                      {u.provider === 'google' ? <GoogleIcon /> : <EmailIcon />}
                      {u.provider === 'google' ? 'Google' : 'Email'}
                    </span>
                    {/* <button
                      className={`au-role-btn ${u.role === 'admin' ? 'to-user' : 'to-admin'}`}
                      onClick={() => toggleRole(u)}
                      disabled={roleLoading === u.id}
                      style={{ marginLeft: 'auto' }}
                    >
                      {roleLoading === u.id
                        ? <><div className="au-btn-spin" /> …</>
                        : u.role === 'admin' ? 'Revoke' : 'Make Admin'
                      }
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="au-pag">
              <span className="au-pag-info">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="au-pag-btns">
                <button className="au-pag-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                <span className="au-pag-cur">{page} / {totalPages}</span>
                <button className="au-pag-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
              </div>
            </div>
          )}
        </main>

        {toast && (
          <div className={`au-toast ${toast.type}`}>
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