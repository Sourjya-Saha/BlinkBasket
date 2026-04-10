'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/userdashboard');
    }
  }, [status, session, router]);

  // Fetch full admin profile from /me endpoint
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && session?.user?.role === 'admin') {
      fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setLoadingProfile(false);
        })
        .catch(() => setLoadingProfile(false));
    }
  }, [status, session]);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  }

  // Loading / auth-check screen
  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    (status === 'authenticated' && session?.user?.role !== 'admin')
  ) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(251,146,60,0.2)',
          borderTopColor: '#fb923c',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const user = profile || session?.user;
  const initials = (user?.full_name || user?.name || user?.email || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-root {
          min-height: 100vh;
          background: #080a0f;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .ad-root::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(251,146,60,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 0% 100%, rgba(251,146,60,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .ad-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(251,146,60,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,146,60,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* NAV */
        .ad-nav {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          background: rgba(8,10,15,0.85);
        }

        .ad-nav-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
        }

        .ad-nav-icon {
          width: 32px; height: 32px; background: #fb923c;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }

        .ad-nav-brand {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem; font-weight: 800;
          color: #fff; letter-spacing: -0.02em;
        }

        .ad-badge {
          background: rgba(251,146,60,0.12);
          border: 1px solid rgba(251,146,60,0.3);
          border-radius: 5px; padding: 2px 8px;
          font-size: 0.68rem; color: #fb923c;
          font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; margin-left: 4px;
        }

        .ad-nav-right {
          display: flex; align-items: center; gap: 0.75rem;
        }

        .ad-nav-link {
          padding: 0.45rem 0.9rem; border-radius: 8px;
          font-size: 0.85rem; color: #9ca3af;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }

        .ad-nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .ad-logout-btn {
          padding: 0.45rem 1rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          font-size: 0.85rem; font-weight: 500;
          color: #fca5a5; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
        }

        .ad-logout-btn:hover:not(:disabled) {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.4);
        }

        .ad-logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* MAIN */
        .ad-main {
          position: relative; z-index: 1;
          max-width: 960px; margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .ad-welcome {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem; font-weight: 800;
          color: #fff; letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
        }

        .ad-welcome span { color: #fb923c; }

        .ad-welcome-sub {
          font-size: 0.875rem; color: #6b7280;
          margin-bottom: 2rem;
        }

        /* PROFILE CARD */
        .ad-profile-card {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 1.5rem;
          display: flex; align-items: flex-start; gap: 1.5rem;
        }

        .ad-avatar {
          width: 64px; height: 64px; flex-shrink: 0;
          background: rgba(251,146,60,0.12);
          border: 1px solid rgba(251,146,60,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.35rem; font-weight: 700;
          color: #fb923c;
        }

        .ad-profile-info { flex: 1; }

        .ad-profile-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem; font-weight: 700;
          color: #fff; margin-bottom: 0.25rem;
        }

        .ad-profile-email {
          font-size: 0.875rem; color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .ad-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        .ad-badge-pill {
          padding: 3px 10px; border-radius: 6px;
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .ad-badge-admin {
          background: rgba(251,146,60,0.12);
          border: 1px solid rgba(251,146,60,0.3);
          color: #fb923c;
        }

        .ad-badge-provider {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #9ca3af;
        }

        /* DETAILS GRID */
        .ad-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .ad-detail-card {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1.1rem 1.25rem;
        }

        .ad-detail-label {
          font-size: 0.75rem; font-weight: 500;
          color: #4b5563; text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 0.4rem;
        }

        .ad-detail-value {
          font-size: 0.95rem; color: #e5e7eb;
        }

        .ad-detail-value.empty { color: #374151; font-style: italic; }

        /* ADMIN ACTIONS */
        .ad-actions-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem; font-weight: 700;
          color: #9ca3af; text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
        }

        .ad-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 0.75rem;
        }

        .ad-action {
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 1.1rem;
          text-decoration: none;
          transition: border-color 0.18s, transform 0.15s;
          display: flex; flex-direction: column; gap: 0.5rem;
        }

        .ad-action:hover {
          border-color: rgba(251,146,60,0.3);
          transform: translateY(-2px);
        }

        .ad-action-icon { font-size: 1.3rem; }

        .ad-action-label {
          font-size: 0.875rem; font-weight: 500; color: #e5e7eb;
        }

        .ad-action-desc { font-size: 0.78rem; color: #6b7280; }

        /* SPINNER */
        .ad-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(252,165,165,0.3);
          border-top-color: #fca5a5;
          border-radius: 50%;
          animation: ad-spin 0.7s linear infinite;
          display: inline-block; vertical-align: middle;
          margin-right: 5px;
        }

        @keyframes ad-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .ad-nav { padding: 0.9rem 1rem; }
          .ad-profile-card { flex-direction: column; gap: 1rem; }
        }
      `}</style>

      <div className="ad-root">
        <div className="ad-grid" />

        {/* NAV */}
        <nav className="ad-nav">
          <div className="ad-nav-logo">
            <div className="ad-nav-icon">⚙️</div>
            <span className="ad-nav-brand">BlinkBasket</span>
            <span className="ad-badge">Admin</span>
          </div>
          <div className="ad-nav-right">
            <Link href="/admindashboard/products" className="ad-nav-link">Products</Link>
            <Link href="/admindashboard/orders" className="ad-nav-link">Orders</Link>
            <Link href="/admindashboard/users" className="ad-nav-link">Users</Link>
            <button
              className="ad-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut && <span className="ad-spinner" />}
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <main className="ad-main">
          <h1 className="ad-welcome">
            Welcome, <span>{user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <p className="ad-welcome-sub">BlinkBasket admin panel — full control dashboard.</p>

          {/* Profile Card */}
          {loadingProfile ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Loading profile…
            </div>
          ) : (
            <div className="ad-profile-card">
              <div className="ad-avatar">{initials}</div>
              <div className="ad-profile-info">
                <p className="ad-profile-name">
                  {user?.full_name || user?.name || 'No name set'}
                </p>
                <p className="ad-profile-email">{user?.email}</p>
                <div className="ad-badges">
                  <span className="ad-badge-pill ad-badge-admin">Admin</span>
                  <span className="ad-badge-pill ad-badge-provider">
                    {user?.provider === 'google' ? 'Google account' : 'Email account'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="ad-details-grid">
            <div className="ad-detail-card">
              <p className="ad-detail-label">Admin ID</p>
              <p className="ad-detail-value" style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#6b7280' }}>
                {user?.id || '—'}
              </p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Phone</p>
              <p className={`ad-detail-value${!user?.phone ? ' empty' : ''}`}>
                {user?.phone || 'Not added'}
              </p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Account created</p>
              <p className="ad-detail-value">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Sign-in method</p>
              <p className="ad-detail-value">
                {user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}
              </p>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <p className="ad-actions-title">Admin tools</p>
          <div className="ad-actions">
            <Link href="/admindashboard/products" className="ad-action">
              <span className="ad-action-icon">📦</span>
              <span className="ad-action-label">Products</span>
              <span className="ad-action-desc">Add, edit, manage stock</span>
            </Link>
            <Link href="/admindashboard/orders" className="ad-action">
              <span className="ad-action-icon">🧾</span>
              <span className="ad-action-label">Orders</span>
              <span className="ad-action-desc">View & update status</span>
            </Link>
            <Link href="/admindashboard/users" className="ad-action">
              <span className="ad-action-icon">👥</span>
              <span className="ad-action-label">Users</span>
              <span className="ad-action-desc">Manage roles & accounts</span>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}