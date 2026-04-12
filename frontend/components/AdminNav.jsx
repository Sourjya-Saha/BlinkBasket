'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

// SVG Icon components — no emojis
export const Icons = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Factory: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),

  Reports: () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="10"/>
    <line x1="12" y1="21" x2="12" y2="4"/>
    <line x1="20" y1="21" x2="20" y2="14"/>
  </svg>
),
};

const NAV_LINKS = [
  { href: '/admindashboard', label: 'Dashboard', Icon: Icons.Dashboard },
  { href: '/admindashboard/products', label: 'Products', Icon: Icons.Box },
  { href: '/admindashboard/categories', label: 'Categories', Icon: Icons.Tag },
  { href: '/admindashboard/manufacturers', label: 'Brands', Icon: Icons.Factory },
  { href: '/admindashboard/orders', label: 'Orders', Icon: Icons.ShoppingBag },
  { href: '/admindashboard/users', label: 'Users', Icon: Icons.Users },
  { href: '/admindashboard/locations', label: 'Locations', Icon: Icons.MapPin },
   { href: '/admindashboard/reports', label: 'Reports', Icon: Icons.Reports },
];

export default function AdminNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const initials = (user?.name || user?.email || 'A')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  }

  const isActive = (href) => {
    if (href === '/admindashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

   /* Update these specific classes in your <style> tag */

.anav-wrapper {
  position: fixed; /* Changed from sticky to fixed for true top-of-screen behavior */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100; /* Increased to ensure it stays above page content */
  padding: 12px 16px; /* Restored padding for the floating effect */
  pointer-events: none; /* Allows clicking things 'behind' the transparent areas */
}

.anav-bar {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem 0.6rem 1.2rem;
  border-radius: 25px;
  background: rgba(13, 16, 24, 0.75); /* Slightly more opaque for better readability over content */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  pointer-events: auto; /* Re-enable clicks for the nav itself */
}

        /* LOGO */
        .anav-logo {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none; flex-shrink: 0;
        }
        .anav-logo-icon {
          width: 34px; height: 34px;
        
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          
          flex-shrink: 0;
        }
          .bbu-logo-icon{ height: 60px;
  width: 60px;
  object-fit: cover;}
      
        .anav-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 800;
          color: #fff; letter-spacing: -0.03em;
        }
        .anav-logo-badge {
          background: rgba(251,146,60,0.15);
          border: 1px solid rgba(251,146,60,0.3);
          border-radius: 5px;
          padding: 1px 7px;
          font-size: 0.62rem; font-weight: 700;
          color: #fb923c; letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        /* CENTER LINKS */
        .anav-links {
          display: flex; align-items: center; gap: 2px;
          flex: 1; justify-content: center;
          overflow-x: auto;
        }
        .anav-links::-webkit-scrollbar { display: none; }

        .anav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 0.42rem 0.7rem;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.18s ease;
          white-space: nowrap;
          position: relative;
        }
        .anav-link:hover {
          background: rgba(255,255,255,0.07);
          color: #e5e7eb;
        }
        .anav-link.active {
          
          color: #fb923c;
          
        }
        .anav-link-icon { flex-shrink: 0; opacity: 0.8; }
        .anav-link.active .anav-link-icon { opacity: 1; }

        /* RIGHT */
        .anav-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

        /* PROFILE */
        .anav-profile-btn {
          display: flex; align-items: center; gap: 8px;
         
          border-radius: 12px;
          
          
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          position: relative;
        }
        
        .anav-avatar {
          width: 32px; height: 32px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(251,146,60,0.25) 0%, rgba(251,146,60,0.1) 100%);
          border: 1px solid rgba(251,146,60,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 0.68rem; font-weight: 700;
          color: #fb923c;
          flex-shrink: 0;
        }
        .anav-profile-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem; font-weight: 500;
          color: #d1d5db; max-width: 90px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .anav-profile-chevron { color: #6b7280; transition: transform 0.2s; }
        .anav-profile-btn:hover .anav-profile-chevron { color: #9ca3af; }

        /* DROPDOWN */
        .anav-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 200px;
          background: rgba(13, 16, 24, 0.95);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: anav-drop 0.18s ease;
          z-index: 200;
        }
        @keyframes anav-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anav-drop-item {
          display: flex; align-items: center; gap: 8px;
          padding: 0.55rem 0.75rem;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: #9ca3af;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          width: 100%; background: none; border: none;
          text-align: left;
        }
        .anav-drop-item:hover { background: rgba(255,255,255,0.06); color: #e5e7eb; }
        .anav-drop-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
        .anav-drop-item.danger { color: #fca5a5; }
        .anav-drop-item.danger:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }

        /* LOGOUT BTN (standalone) */
        .anav-logout {
          display: flex; align-items: center; gap: 6px;
          padding: 0.44rem 0.9rem;
          border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem; font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .anav-logout:hover:not(:disabled) { background: rgba(239,68,68,0.16); }
        .anav-logout:disabled { opacity: 0.5; cursor: not-allowed; }

        /* HAMBURGER (mobile) */
        .anav-hamburger {
          display: none;
          flex-direction: column; gap: 4px;
          width: 32px; height: 32px;
          align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 15px;
          cursor: pointer;
        }
        .anav-hamburger span {
          display: block; width: 16px; height: 1.5px;
          background: #9ca3af; border-radius: 2px;
          transition: all 0.2s;
        }

        /* MOBILE DRAWER */
        .anav-mobile-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 99;
        }
        .anav-mobile-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 260px;
          background: rgba(10, 12, 20, 0.98);
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 1.5rem 1rem;
          z-index: 100;
          display: flex; flex-direction: column; gap: 4px;
          overflow-y: auto;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .anav-mobile-drawer.open { transform: translateX(0); }

        /* SPINNER */
        .anav-spin {
          width: 12px; height: 12px;
          border: 2px solid rgba(252,165,165,0.3);
          border-top-color: #fca5a5;
          border-radius: 50%;
          animation: anavSpin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes anavSpin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .anav-links { display: none; }
          .anav-hamburger { display: flex; }
          .anav-profile-name { display: none; }
          .anav-profile-chevron { display: none; }
        }
        @media (max-width: 640px) {
          .anav-wrapper { top: 8px; padding: 0 10px; }
          .anav-bar { padding: 0.5rem 0.75rem; border-radius: 24px; }
          .anav-logout { display: none; }
        }
      `}</style>
<div style={{ height: '80px' }} />
      <div className="anav-wrapper">
        <div className="anav-bar">
          {/* LOGO */}
          <Link href="/admindashboard" className="anav-logo">
            <div className="anav-logo-icon">  <img
  src="/Blinkbasketlogonew.png"
  alt="BlinkBasket Logo"
  className="bbu-logo-icon"
/></div>
            
            
          </Link>

          {/* CENTER NAV */}
          <nav className="anav-links">
            {NAV_LINKS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`anav-link${isActive(href) ? ' active' : ''}`}>
                <span className="anav-link-icon"><Icon /></span>
                {label}
              </Link>
            ))}
          </nav>

          {/* RIGHT */}
          <div className="anav-right">
            {/* Profile dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="anav-profile-btn"
                onClick={() => setProfileOpen(p => !p)}
              >
                <div className="anav-avatar">{initials}</div>
                <span className="anav-profile-name">
                  {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="anav-profile-chevron" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <Icons.ChevronDown />
                </span>
              </button>
              {profileOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setProfileOpen(false)} />
                  <div className="anav-dropdown" style={{ zIndex: 200 }}>
                    <div style={{ padding: '0.5rem 0.75rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                        {user?.name || 'Admin'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '2px' }}>{user?.email}</div>
                    </div>
                    <Link href="/admindashboard/profile" className="anav-drop-item" onClick={() => setProfileOpen(false)}>
                      <Icons.User /> Profile & Settings
                    </Link>
                    <div className="anav-drop-divider" />
                    <button className="anav-drop-item danger" onClick={handleLogout} disabled={loggingOut}>
                      {loggingOut ? <span className="anav-spin" /> : <Icons.LogOut />}
                      {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button className="anav-hamburger" onClick={() => setMobileOpen(true)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="anav-mobile-overlay" style={{ display: 'block' }} onClick={() => setMobileOpen(false)} />
      )}
      <div className={`anav-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>BlinkBasket</span>
        </div>
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`anav-link${isActive(href) ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }} onClick={() => setMobileOpen(false)}>
            <span className="anav-link-icon"><Icon /></span>{label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/admindashboard/profile" className="anav-link" style={{ justifyContent: 'flex-start', marginBottom: 4 }} onClick={() => setMobileOpen(false)}>
            <Icons.User /> Profile
          </Link>
          <button className="anav-drop-item danger" onClick={handleLogout} disabled={loggingOut} style={{ width: '100%' }}>
            {loggingOut ? <span className="anav-spin" /> : <Icons.LogOut />}
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}