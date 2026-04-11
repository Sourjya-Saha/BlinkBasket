'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav, { Icons } from '../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'admin' || !session?.accessToken) return;
    const headers = { Authorization: `Bearer ${session.accessToken}` };

    fetch(`${API_BASE}/me`, { headers })
      .then(r => r.json()).then(d => { setProfile(d); setLoadingProfile(false); })
      .catch(() => setLoadingProfile(false));

    fetch(`${API_BASE}/admin/orders?limit=5&page=1`, { headers })
      .then(r => r.json()).then(d => {
        setRecentOrders(d.data || []);
        setStats(prev => ({ ...prev, totalOrders: d.count || 0 }));
      });

    fetch(`${API_BASE}/admin/users?limit=1&page=1`, { headers })
      .then(r => r.json()).then(d => setStats(prev => ({ ...prev, totalUsers: d.count || 0 })));

    fetch(`${API_BASE}/api/products?limit=1&page=1`, { headers })
      .then(r => r.json()).then(d => setStats(prev => ({ ...prev, totalProducts: d.count || 0 })));

    fetch(`${API_BASE}/admin/reports/sales`, { headers })
      .then(r => r.json()).then(d => {
        const arr = Array.isArray(d) ? d : [];
        const revenue = arr.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
        setStats(prev => ({ ...prev, totalRevenue: revenue }));
        setTopProducts(arr.slice(0, 5));
      });
  }, [status, session]);

  if (status === 'loading' || status === 'unauthenticated' ||
    (status === 'authenticated' && session?.user?.role !== 'admin')) {
    return <FullPageSpinner />;
  }

  const user = profile || session?.user;
  const initials = (user?.full_name || user?.name || user?.email || 'A')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const STATUS_META = {
    placed:           { label: 'Placed',          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
    processing:       { label: 'Processing',       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
    out_for_delivery: { label: 'Out for Delivery', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    delivered:        { label: 'Delivered',        color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
    completed:        { label: 'Completed',        color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.25)' },
  };

  const QUICK_ACTIONS = [
    { href: '/admindashboard/products', Icon: Icons.Box, label: 'Products', desc: 'Add, edit, manage stock' },
    { href: '/admindashboard/categories', Icon: Icons.Tag, label: 'Categories', desc: 'Organise product groups' },
    { href: '/admindashboard/manufacturers', Icon: Icons.Factory, label: 'Brands', desc: 'Manage manufacturers' },
    { href: '/admindashboard/orders', Icon: Icons.ShoppingBag, label: 'Orders', desc: 'View & update status' },
    { href: '/admindashboard/users', Icon: Icons.Users, label: 'Users', desc: 'Manage roles & accounts' },
    { href: '/admindashboard/locations', Icon: Icons.MapPin, label: 'Locations', desc: 'Delivery zones' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-root {
          min-height: 100vh;
          background: #060810;
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow-x: hidden;
        }
        .ad-bg-glow {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 70% 50% at 110% -10%, rgba(251,146,60,0.07) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at -10% 110%, rgba(251,146,60,0.05) 0%, transparent 65%);
        }
        .ad-grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(251,146,60,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,146,60,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .ad-main {
          position: relative; z-index: 1;
          max-width: 1140px; margin: 0 auto;
          padding: 1.5rem 1.5rem 4rem;
        }

        /* PAGE TITLE */
        .ad-page-header { margin-bottom: 2rem; }
        .ad-greeting {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.4rem, 3vw, 1.9rem);
          font-weight: 800; color: #fff;
          letter-spacing: -0.04em; line-height: 1.15;
        }
        .ad-greeting span { color: #fb923c; }
        .ad-greeting-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.3rem; }

        /* STATS GRID */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem; margin-bottom: 1.75rem;
        }
        .ad-stat {
          background: rgba(13,16,24,0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.4rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem;
          transition: border-color 0.2s, transform 0.2s;
          position: relative; overflow: hidden;
        }
        .ad-stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        .ad-stat:hover { border-color: rgba(251,146,60,0.2); transform: translateY(-2px); }
        .ad-stat-header { display: flex; align-items: center; justify-content: space-between; }
        .ad-stat-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.2);
          color: #fb923c;
        }
        .ad-stat-label { font-size: 0.72rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.07em; }
        .ad-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.5rem, 3vw, 1.9rem);
          font-weight: 800; color: #fff; line-height: 1;
        }
        .ad-stat-value.orange { color: #fb923c; }

        /* PROFILE CARD */
        .ad-profile-card {
          background: rgba(13,16,24,0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; padding: 1.75rem;
          margin-bottom: 1.5rem;
          display: flex; align-items: flex-start; gap: 1.5rem;
          position: relative; overflow: hidden;
        }
        .ad-profile-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 60% at 90% 10%, rgba(251,146,60,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .ad-avatar {
          width: 68px; height: 68px; flex-shrink: 0;
          background: rgba(251,146,60,0.1);
          border: 1px solid rgba(251,146,60,0.3);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800;
          color: #fb923c;
        }
        .ad-profile-name { font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
        .ad-profile-email { font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem; }
        .ad-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .ad-badge-pill { padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .ad-badge-admin { background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.3); color: #fb923c; }
        .ad-badge-provider { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; }

        /* DETAILS */
        .ad-details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.75rem; }
        .ad-detail-card {
          background: rgba(13,16,24,0.7); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.1rem 1.25rem;
        }
        .ad-detail-label { font-size: 0.7rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.4rem; }
        .ad-detail-value { font-size: 0.9rem; color: #e5e7eb; }
        .ad-detail-value.empty { color: #374151; font-style: italic; }

        /* TWO COL */
        .ad-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.75rem; }
        .ad-section-card {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.4rem;
        }
        .ad-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .ad-section-title { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: #e5e7eb; }
        .ad-section-link { font-size: 0.75rem; color: #fb923c; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .ad-section-link:hover { text-decoration: underline; }

        .ad-order-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 0.5rem; flex-wrap: wrap; }
        .ad-order-row:last-child { border-bottom: none; }
        .ad-order-id { font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700; color: #fff; }
        .ad-order-customer { font-size: 0.72rem; color: #6b7280; }
        .ad-order-amount { font-size: 0.85rem; font-weight: 600; color: #fb923c; }
        .ad-order-badge { padding: 2px 8px; border-radius: 4px; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid; }

        .ad-product-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 0.5rem; }
        .ad-product-row:last-child { border-bottom: none; }
        .ad-product-name { font-size: 0.82rem; color: #d1d5db; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ad-product-rev { font-size: 0.85rem; font-weight: 600; color: #fb923c; }
        .ad-product-qty { font-size: 0.7rem; color: #4b5563; }

        /* QUICK ACTIONS */
        .ad-actions-title { font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 0.85rem; }
        .ad-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 0.75rem; }
        .ad-action {
          background: rgba(13,16,24,0.7); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
          padding: 1.2rem 1.1rem; text-decoration: none;
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .ad-action:hover { border-color: rgba(251,146,60,0.28); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .ad-action-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c;
        }
        .ad-action-label { font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; color: #e5e7eb; }
        .ad-action-desc { font-size: 0.75rem; color: #6b7280; }

        .ad-empty-row { text-align: center; padding: 2rem; font-size: 0.8rem; color: #374151; }

        @media (max-width: 700px) {
          .ad-main { padding: 1rem 1rem 3rem; }
          .ad-profile-card { flex-direction: column; gap: 1rem; }
          .ad-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ad-root">
        <div className="ad-bg-glow" />
        <div className="ad-grid-bg" />
        <AdminNav />
        <main className="ad-main">
          <div className="ad-page-header">
            <h1 className="ad-greeting">
              Good day, <span>{user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="ad-greeting-sub">BlinkBasket control panel — here's your overview.</p>
          </div>

          {/* STATS */}
          <div className="ad-stats">
            {[
              { Icon: Icons.ShoppingBag, label: 'Total Orders', value: stats?.totalOrders ?? '…', orange: false },
              { Icon: Icons.Users, label: 'Total Users', value: stats?.totalUsers ?? '…', orange: false },
              { Icon: Icons.Box, label: 'Active Products', value: stats?.totalProducts ?? '…', orange: false },
              { Icon: null, label: 'Total Revenue', value: stats?.totalRevenue != null ? `₹${Math.round(stats.totalRevenue).toLocaleString('en-IN')}` : '…', orange: true },
            ].map(({ Icon, label, value, orange }, i) => (
              <div key={i} className="ad-stat">
                <div className="ad-stat-header">
                  <div className="ad-stat-icon">
                    {Icon ? <Icon /> : <span style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'Syne, sans-serif' }}>₹</span>}
                  </div>
                  <span className="ad-stat-label">{label}</span>
                </div>
                <div className={`ad-stat-value${orange ? ' orange' : ''}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* PROFILE
          {loadingProfile ? (
            <div style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Loading profile…</div>
          ) : (
            <div className="ad-profile-card">
              <div className="ad-avatar">{initials}</div>
              <div style={{ flex: 1 }}>
                <p className="ad-profile-name">{user?.full_name || user?.name || 'No name set'}</p>
                <p className="ad-profile-email">{user?.email}</p>
                <div className="ad-badges">
                  <span className="ad-badge-pill ad-badge-admin">Admin</span>
                  <span className="ad-badge-pill ad-badge-provider">
                    {user?.provider === 'google' ? 'Google Account' : 'Email Account'}
                  </span>
                </div>
              </div>
              <Link href="/admindashboard/profile" style={{ padding: '0.45rem 1rem', borderRadius: 10, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.User /> View Profile
              </Link>
            </div>
          )} */}

          {/* DETAILS
          <div className="ad-details-grid">
            <div className="ad-detail-card">
              <p className="ad-detail-label">Admin ID</p>
              <p className="ad-detail-value" style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#6b7280' }}>{user?.id || '—'}</p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Phone</p>
              <p className={`ad-detail-value${!user?.phone ? ' empty' : ''}`}>{user?.phone || 'Not added'}</p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Account Created</p>
              <p className="ad-detail-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="ad-detail-card">
              <p className="ad-detail-label">Sign-in Method</p>
              <p className="ad-detail-value">{user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}</p>
            </div>
          </div> */}

          {/* RECENT ORDERS + TOP PRODUCTS */}
          <div className="ad-two-col">
            <div className="ad-section-card">
              <div className="ad-section-header">
                <span className="ad-section-title">Recent Orders</span>
                <Link href="/admindashboard/orders" className="ad-section-link">View all →</Link>
              </div>
              {recentOrders.length === 0 ? <div className="ad-empty-row">No orders yet.</div> : recentOrders.map(order => {
                const sm = STATUS_META[order.status] || STATUS_META.placed;
                return (
                  <div key={order.id} className="ad-order-row">
                    <div>
                      <div className="ad-order-id">#{order.id}</div>
                      <div className="ad-order-customer">{order.users?.email || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="ad-order-badge" style={{ background: sm.bg, borderColor: sm.border, color: sm.color }}>{sm.label}</span>
                      <span className="ad-order-amount">₹{parseFloat(order.total).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ad-section-card">
              <div className="ad-section-header">
                <span className="ad-section-title">Top Products</span>
                <Link href="/admindashboard/products" className="ad-section-link">View all →</Link>
              </div>
              {topProducts.length === 0 ? <div className="ad-empty-row">No sales data yet.</div> : topProducts.map((p, i) => (
                <div key={p.product_id} className="ad-product-row">
                  <span style={{ color: '#374151', fontSize: '0.72rem', marginRight: '0.5rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>#{i + 1}</span>
                  <span className="ad-product-name">{p.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ad-product-rev">₹{Math.round(p.total_revenue).toLocaleString('en-IN')}</div>
                    <div className="ad-product-qty">{p.total_qty} units</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <p className="ad-actions-title">Admin Tools</p>
          <div className="ad-actions">
            {QUICK_ACTIONS.map(({ href, Icon, label, desc }) => (
              <Link key={href} href={href} className="ad-action">
                <div className="ad-action-icon"><Icon /></div>
                <span className="ad-action-label">{label}</span>
                <span className="ad-action-desc">{desc}</span>
              </Link>
            ))}
          </div>
        </main>
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