'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useMemo } from 'react';

export const Icons = {
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
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
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
};

const NAV_LINKS = [
  { href: '/userdashboard', label: 'Home', Icon: Icons.Home },
  { href: '/userdashboard/products', label: 'Products', Icon: Icons.Box },
  { href: '/userdashboard/orders', label: 'Orders', Icon: Icons.Package },
  { href: '/userdashboard/cart', label: 'Cart', Icon: Icons.ShoppingBag },
];

export default function UserNav({ cartCount = 0 }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  
  const initials = useMemo(() => {
    return (user?.full_name || user?.name || user?.email || 'U')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  }

  // Exact match for home, partial match for sub-pages
  const isActive = (href) => {
    if (href === '/userdashboard') {
      return pathname === '/userdashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        /* FIXED WRAPPER */
        .unav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 12px 16px;
          z-index: 100;
          pointer-events: none; /* Allows interacting with things behind the padding */
        }

        /* SPACER to push page content down */
        .unav-spacer {
          height: 85px; 
        }

        .unav-bar {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1rem 0.6rem 1.2rem;
          border-radius: 25px;
          background: rgba(13, 16, 24, 0.75);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          pointer-events: auto; /* Re-enables clicks for the navbar itself */
        }

        /* LOGO */
        .unav-logo {
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
        .unav-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 800;
          color: #fff; letter-spacing: -0.02em;
        }

        /* CENTER LINKS */
        .unav-links {
          display: flex; align-items: center; gap: 4px;
          flex: 1; justify-content: center;
        }
        .unav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 0.5rem 0.8rem;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          color: #9ca3af;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .unav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .unav-link.active { color: #a3e635; }

        /* RIGHT SECTION - Always side-by-side */
        .unav-right { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          flex-shrink: 0;
        }

        /* CART BUTTON */
        .unav-cart-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          padding: 8px;
          border-radius: 12px;
          transition: all 0.2s;
          text-decoration: none;
        }
        .unav-cart-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .unav-cart-btn.active { color: #a3e635; background: rgba(163, 230, 53, 0.1); }

        /* NO SHADOW CART BADGE */
        .unav-cart-badge {
          position: absolute;
          top: 0px; 
          right: 0px;
          min-width: 16px; 
          height: 16px;
          border-radius: 50%;
          background: #a3e635;
          color: #052e16;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; 
          font-weight: 800;
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: none !important; /* Forces no shadow */
          border: none !important;     /* Removes border which can look like a shadow cutout */
        }

        /* PROFILE */
        .unav-profile-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          padding: 0;
        }
        .unav-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a3e635, #65a30d);
          color: #000;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 0.75rem;
          flex-shrink: 0;
        }
        .unav-profile-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          color: #e5e7eb;
        }
        .unav-profile-chevron { color: #6b7280; transition: transform 0.2s; }

        /* DROPDOWN */
        .unav-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 220px;
          background: rgba(13, 16, 24, 0.98);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          animation: unav-drop 0.15s ease;
          z-index: 200;
        }
        @keyframes unav-drop {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .unav-drop-item {
          display: flex; align-items: center; gap: 8px;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          color: #d1d5db;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%; background: none; border: none;
          text-align: left;
        }
        .unav-drop-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .unav-drop-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
        .unav-drop-item.danger { color: #fca5a5; }
        .unav-drop-item.danger:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }

        /* HAMBURGER */
        .unav-hamburger {
          display: none;
          background: none; border: none; color: #9ca3af; 
          cursor: pointer; padding: 4px;
          border-radius: 8px;
        }
        .unav-hamburger:hover { color: #fff; background: rgba(255,255,255,0.05); }

        /* MOBILE DRAWER */
        .unav-mobile-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 1000;
        }
        .unav-mobile-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 280px; max-width: 80vw;
          background: rgba(10, 12, 20, 0.98);
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 1.5rem;
          z-index: 1001;
          display: flex; flex-direction: column; gap: 8px;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .unav-mobile-drawer.open { transform: translateX(0); }

        /* SPINNER */
        .unav-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(252,165,165,0.3);
          border-top-color: #fca5a5;
          border-radius: 50%;
          animation: unavSpin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes unavSpin { to { transform: rotate(360deg); } }

        /* RESPONSIVE DESIGN */
        @media (max-width: 900px) {
          .unav-links { display: none; }
          .unav-hamburger { display: block; }
          .unav-profile-name { display: none; }
          .unav-profile-chevron { display: none; }
        }

        @media (max-width: 640px) {
          .unav-wrapper { padding: 10px; }
          .unav-bar { padding: 0.5rem 0.8rem; border-radius: 20px; }
          .unav-logo-text { display: none; } /* Hide text on very small screens to save space */
          
          /* Ensures Cart, Avatar, and Menu are side-by-side with perfect spacing */
          .unav-right { gap: 8px; }
          .unav-cart-btn { padding: 6px; }
          .unav-avatar { width: 30px; height: 30px; font-size: 0.7rem; }
        }
      `}</style>

      {/* Spacer maintains DOM height so content doesn't snap under the fixed nav */}
      <div className="unav-spacer" />

      <div className="unav-wrapper">
        <div className="unav-bar">
          {/* LOGO */}
          <Link href="/userdashboard" className="unav-logo">
             <div className="anav-logo-icon">  <img
  src="/Blinkbasketlogonew.png"
  alt="BlinkBasket Logo"
  className="bbu-logo-icon"
/></div>
            <span className="unav-logo-text">BlinkBasket</span>
          </Link>

          {/* DESKTOP LINKS */}
          <nav className="unav-links">
            {NAV_LINKS.map(({ href, label, Icon }) => (
              <Link 
                key={href} 
                href={href} 
                className={`unav-link ${isActive(href) ? 'active' : ''}`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* RIGHT SIDE (Cart + Profile + Mobile Menu) - Always Side by Side */}
          <div className="unav-right">
            
            {/* CART ICON WITH NO-SHADOW DOT */}
            <Link 
              href="/userdashboard/cart" 
              className={`unav-cart-btn ${isActive('/userdashboard/cart') ? 'active' : ''}`}
            >
              <Icons.ShoppingBag />
              {cartCount > 0 && (
                <span className="unav-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            {/* PROFILE AVATAR DROPDOWN */}
            <div style={{ position: 'relative' }}>
              <button className="unav-profile-btn" onClick={() => setProfileOpen(p => !p)}>
                <div className="unav-avatar">{initials}</div>
                <span className="unav-profile-name">
                  {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="unav-profile-chevron" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none' }}>
                  <Icons.ChevronDown />
                </span>
              </button>
              
              {profileOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setProfileOpen(false)} />
                  <div className="unav-dropdown">
                    <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        {user?.full_name || user?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                      </div>
                    </div>
                    <Link href="/userdashboard/userprofile" className="unav-drop-item" onClick={() => setProfileOpen(false)}>
                      <Icons.User /> Profile & Settings
                    </Link>
                    <div className="unav-drop-divider" />
                    <button className="unav-drop-item danger" onClick={handleLogout} disabled={loggingOut}>
                      {loggingOut ? <span className="unav-spin" /> : <Icons.LogOut />}
                      {loggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER MENU */}
            <button className="unav-hamburger" onClick={() => setMobileOpen(true)}>
              <Icons.Menu />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="unav-mobile-overlay" style={{ display: 'block' }} onClick={() => setMobileOpen(false)} />
      )}
      
      <div className={`unav-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>BlinkBasket</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
            <Icons.X />
          </button>
        </div>
        
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <Link 
            key={href} 
            href={href} 
            className={`unav-drop-item ${isActive(href) ? 'active' : ''}`} 
            style={{ color: isActive(href) ? '#a3e635' : '#d1d5db' }}
            onClick={() => setMobileOpen(false)}
          >
            <Icon /> {label}
          </Link>
        ))}
        
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/userdashboard/userprofile" className="unav-drop-item" style={{ marginBottom: 8 }} onClick={() => setMobileOpen(false)}>
            <Icons.User /> Profile Settings
          </Link>
          <button className="unav-drop-item danger" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <span className="unav-spin" /> : <Icons.LogOut />}
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}