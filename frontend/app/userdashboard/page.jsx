'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch full user profile from /me endpoint
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
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
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0c10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(163,230,53,0.2)',
          borderTopColor: '#a3e635',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const user = profile || session?.user;
  const initials = (user?.full_name || user?.name || user?.email || 'U')
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

        .ud-root {
          min-height: 100vh;
          background: #0a0c10;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .ud-root::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%, rgba(163,230,53,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 100%, rgba(163,230,53,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .ud-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(163,230,53,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* NAV */
        .ud-nav {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          background: rgba(10,12,16,0.8);
        }

        .ud-nav-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
        }

        .ud-nav-icon {
          width: 32px; height: 32px; background: #a3e635;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }

        .ud-nav-brand {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem; font-weight: 800;
          color: #fff; letter-spacing: -0.02em;
        }

        .ud-nav-right {
          display: flex; align-items: center; gap: 0.75rem;
        }

        .ud-nav-link {
          padding: 0.45rem 0.9rem; border-radius: 8px;
          font-size: 0.85rem; color: #9ca3af;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }

        .ud-nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .ud-logout-btn {
          padding: 0.45rem 1rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          font-size: 0.85rem; font-weight: 500;
          color: #fca5a5; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
        }

        .ud-logout-btn:hover:not(:disabled) {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.4);
        }

        .ud-logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* MAIN */
        .ud-main {
          position: relative; z-index: 1;
          max-width: 900px; margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .ud-welcome {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem; font-weight: 800;
          color: #fff; letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
        }

        .ud-welcome span { color: #a3e635; }

        .ud-welcome-sub {
          font-size: 0.875rem; color: #6b7280;
          margin-bottom: 2rem;
        }

        /* PROFILE CARD */
        .ud-profile-card {
          background: #111318;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 1.5rem;
          display: flex; align-items: flex-start; gap: 1.5rem;
        }

        .ud-avatar {
          width: 64px; height: 64px; flex-shrink: 0;
          background: rgba(163,230,53,0.15);
          border: 1px solid rgba(163,230,53,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.35rem; font-weight: 700;
          color: #a3e635;
        }

        .ud-profile-info { flex: 1; }

        .ud-profile-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem; font-weight: 700;
          color: #fff; margin-bottom: 0.25rem;
        }

        .ud-profile-email {
          font-size: 0.875rem; color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .ud-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        .ud-badge {
          padding: 3px 10px; border-radius: 6px;
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .ud-badge-role {
          background: rgba(163,230,53,0.12);
          border: 1px solid rgba(163,230,53,0.25);
          color: #a3e635;
        }

        .ud-badge-provider {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #9ca3af;
        }

        /* DETAILS GRID */
        .ud-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .ud-detail-card {
          background: #111318;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1.1rem 1.25rem;
        }

        .ud-detail-label {
          font-size: 0.75rem; font-weight: 500;
          color: #4b5563; text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 0.4rem;
        }

        .ud-detail-value {
          font-size: 0.95rem; color: #e5e7eb; font-weight: 400;
        }

        .ud-detail-value.empty { color: #374151; font-style: italic; }

        /* QUICK ACTIONS */
        .ud-actions-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem; font-weight: 700;
          color: #9ca3af; text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
        }

        .ud-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
        }

        .ud-action {
          background: #111318;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 1.1rem;
          text-decoration: none;
          transition: border-color 0.18s, transform 0.15s;
          display: flex; flex-direction: column; gap: 0.5rem;
        }

        .ud-action:hover {
          border-color: rgba(163,230,53,0.3);
          transform: translateY(-2px);
        }

        .ud-action-icon { font-size: 1.3rem; }

        .ud-action-label {
          font-size: 0.875rem; font-weight: 500; color: #e5e7eb;
        }

        .ud-action-desc { font-size: 0.78rem; color: #6b7280; }

        /* SPINNER */
        .ud-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(252,165,165,0.3);
          border-top-color: #fca5a5;
          border-radius: 50%;
          animation: ud-spin 0.7s linear infinite;
          display: inline-block; vertical-align: middle;
          margin-right: 5px;
        }

        @keyframes ud-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .ud-nav { padding: 0.9rem 1rem; }
          .ud-profile-card { flex-direction: column; gap: 1rem; }
        }
      `}</style>

      <div className="ud-root">
        <div className="ud-grid" />

        {/* NAV */}
        <nav className="ud-nav">
          <Link href="/" className="ud-nav-logo">
            <div className="ud-nav-icon">🛒</div>
            <span className="ud-nav-brand">BlinkBasket</span>
          </Link>
          <div className="ud-nav-right">
            <Link href="/userdashboard/products" className="ud-nav-link">Shop</Link>
            <Link href="/userdashboard/orders" className="ud-nav-link">Orders</Link>
            <Link href="/userdashboard/cart" className="ud-nav-link">Cart</Link>
            <button
              className="ud-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut && <span className="ud-spinner" />}
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <main className="ud-main">
          <h1 className="ud-welcome">
            Hey, <span>{user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="ud-welcome-sub">Here's your account overview.</p>

          {/* Profile Card */}
          {loadingProfile ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Loading profile…
            </div>
          ) : (
            <div className="ud-profile-card">
              <div className="ud-avatar">{initials}</div>
              <div className="ud-profile-info">
                <p className="ud-profile-name">
                  {user?.full_name || user?.name || 'No name set'}
                </p>
                <p className="ud-profile-email">{user?.email}</p>
                <div className="ud-badges">
                  <span className="ud-badge ud-badge-role">{user?.role || 'user'}</span>
                  <span className="ud-badge ud-badge-provider">
                    {user?.provider === 'google' ? 'Google account' : 'Email account'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="ud-details-grid">
            <div className="ud-detail-card">
              <p className="ud-detail-label">User ID</p>
              <p className="ud-detail-value" style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#6b7280' }}>
                {user?.id || '—'}
              </p>
            </div>
            <div className="ud-detail-card">
              <p className="ud-detail-label">Phone</p>
              <p className={`ud-detail-value${!user?.phone ? ' empty' : ''}`}>
                {user?.phone || 'Not added'}
              </p>
            </div>
            <div className="ud-detail-card">
              <p className="ud-detail-label">Member since</p>
              <p className="ud-detail-value">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div className="ud-detail-card">
              <p className="ud-detail-label">Sign-in method</p>
              <p className="ud-detail-value">
                {user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <p className="ud-actions-title">Quick actions</p>
          <div className="ud-actions">
            <Link href="/userdashboard/products" className="ud-action">
              <span className="ud-action-icon">🛍️</span>
              <span className="ud-action-label">Browse products</span>
              <span className="ud-action-desc">Shop all categories</span>
            </Link>
            <Link href="/userdashboard/cart" className="ud-action">
              <span className="ud-action-icon">🛒</span>
              <span className="ud-action-label">My cart</span>
              <span className="ud-action-desc">View & checkout</span>
            </Link>
            <Link href="/userdashboard/orders" className="ud-action">
              <span className="ud-action-icon">📦</span>
              <span className="ud-action-label">My orders</span>
              <span className="ud-action-desc">Track & history</span>
            </Link>
            <Link href="/userdashboard/userprofile" className="ud-action">
              <span className="ud-action-icon">✏️</span>
              <span className="ud-action-label">Edit profile</span>
              <span className="ud-action-desc">Update your info</span>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}