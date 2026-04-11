'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// 1. Import the animation component
import { LiquidEffectAnimation } from '@/components/liquid-effect-animation';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const justSignedOut = sessionStorage.getItem('just_signed_out');
      if (justSignedOut) {
        sessionStorage.removeItem('just_signed_out');
        return;
      }
      router.push(session.user.role === 'admin' ? '/admindashboard' : '/userdashboard');
    }
  }, [status, session, router]);

  if (!mounted || status === 'loading') {
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0c10; color: #fff; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        
        /* 2. Modified background container */
        .bb-bg { 
          position: fixed; 
          inset: 0; 
          pointer-events: none; 
          z-index: -1; /* Set to -1 to ensure it is behind everything */
          overflow: hidden;
        }
        
        .bb-grid {
          position: absolute; 
          inset: 0;
          z-index: 1; /* Grid sits on top of the liquid effect */
          background-image:
            linear-gradient(rgba(163,230,53,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* Nav and Hero styles remain the same */
        .bb-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          background: rgba(10,12,16,0.75);
        }
        .bb-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .bb-nav-icon { width: 34px; height: 34px; background: #a3e635; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .bb-nav-brand { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .bb-nav-links { display: flex; align-items: center; gap: 0.5rem; }
        .bb-nav-link { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; color: #9ca3af; transition: background 0.18s, color 0.18s; }
        .bb-nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .bb-nav-cta { padding: 0.5rem 1.25rem; background: #a3e635; border-radius: 8px; font-size: 0.875rem; font-weight: 700; font-family: 'Syne', sans-serif; color: #0a0c10; text-decoration: none; transition: background 0.18s, transform 0.12s; }
        .bb-nav-cta:hover { background: #bef264; transform: translateY(-1px); }
        .bb-hero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 2rem 4rem; }
        .bb-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(163,230,53,0.1); border: 1px solid rgba(163,230,53,0.25); border-radius: 999px; padding: 4px 14px 4px 10px; font-size: 0.78rem; color: #a3e635; font-weight: 500; margin-bottom: 2rem; letter-spacing: 0.02em; animation: bb-fade 0.6s ease both; }
        .bb-pill-dot { width: 6px; height: 6px; background: #a3e635; border-radius: 50%; animation: bb-pulse 2s ease-in-out infinite; }
        @keyframes bb-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }
        .bb-h1 { font-family: 'Syne', sans-serif; font-size: clamp(2.75rem, 7vw, 5.5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.0; color: #fff; max-width: 820px; margin-bottom: 1.5rem; animation: bb-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .bb-accent { color: #a3e635; }
        .bb-p { font-size: 1.1rem; color: #6b7280; max-width: 500px; line-height: 1.7; margin-bottom: 2.5rem; animation: bb-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
        .bb-btns { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; animation: bb-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .bb-btn-primary { padding: 0.85rem 2rem; background: #a3e635; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #0a0c10; text-decoration: none; transition: background 0.18s, transform 0.12s, box-shadow 0.18s; box-shadow: 0 4px 24px rgba(163,230,53,0.25); }
        .bb-btn-primary:hover { background: #bef264; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(163,230,53,0.35); }
        .bb-btn-secondary { padding: 0.85rem 2rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #fff; text-decoration: none; transition: background 0.18s, border-color 0.18s; }
        .bb-btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        @keyframes bb-fade { from { opacity:0; } to { opacity:1; } }
        @keyframes bb-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 640px) { .bb-nav { padding: 1.25rem; } .bb-nav-link { display: none; } .bb-hero { padding: 7rem 1.25rem 3rem; } }
        .bbu-logo-icon{ height: 36px; width: 36px; border-radius: 8px; object-fit: cover;}
      `}</style>

      {/* 3. Updated Background Section */}
      <div className="bb-bg">
       
        <LiquidEffectAnimation />
      </div>



      <section className="bb-hero">
        {/* <div className="bb-pill">
          <span className="bb-pill-dot" />
          Instant grocery delivery
        </div> */}
        <h1 className="bb-h1">
          Groceries at your door<br />
          in <span className="bb-accent">minutes</span>
        </h1>
        <div className="bb-btns">
          <Link href="/auth/usersignup" className="bb-btn-primary">Start shopping →</Link>
          <Link href="/auth/logincommon" className="bb-btn-secondary">Sign in</Link>
        </div>
      </section>
    </>
  );
}