'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function AdminSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm: '', admin_key: '',
  });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showKey,  setShowKey]  = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Admin password must be at least 8 characters.'); return; }

    setLoading(true);

    // Single atomic call — backend validates secret key AND creates admin in one step.
    // If the key is wrong, NO user row is ever inserted.
    const res = await fetch(`${API_BASE}/api/auth/admin-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:        form.email,
        password:     form.password,
        full_name:    form.full_name,
        phone:        form.phone.trim(),
        admin_secret: form.admin_key,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Registration failed. Please try again.');
      return;
    }

    // Auto sign-in — the new token already has role='admin'
    const result = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    });

    if (result?.error) { router.push('/auth/logincommon'); }
    else { router.push('/admindashboard'); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .bba-root { min-height: 100vh; background: #080a0f; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; padding: 2rem 1rem; position: relative; overflow: hidden; }
        .bba-root::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 40% at 100% 0%, rgba(251,146,60,0.09) 0%, transparent 70%), radial-gradient(ellipse 45% 35% at 0% 100%, rgba(251,146,60,0.06) 0%, transparent 70%); pointer-events: none; }
        .bba-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(251,146,60,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.04) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .bba-card { position: relative; z-index: 1; width: 100%; max-width: 480px;  animation: bba-up 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes bba-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .bba-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
        .bba-logo-icon { width: 36px; height: 36px; background: #fb923c; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .bba-logo-text { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .bba-badge { margin-left: auto; background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.3); border-radius: 6px; padding: 3px 10px; font-size: 0.72rem; color: #fb923c; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
        .bba-heading { font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 0.35rem; }
        .bba-sub { font-size: 0.875rem; color: #6b7280; margin-bottom: 1.75rem; }
        .bba-sub a { color: #fb923c; text-decoration: none; font-weight: 500; }
        .bba-sub a:hover { text-decoration: underline; }
        .bba-notice { background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.2); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #fdba74; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .bba-notice-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .bba-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
        .bba-field { margin-bottom: 0.95rem; }
        .bba-label { display: block; font-size: 0.8rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.02em; }
        .bba-req { color: #fb923c; margin-left: 2px; }
        .bba-input-wrap { position: relative; }
        .bba-input { width: 100%; padding: 0.7rem 0.9rem; background: #080a0f; border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .bba-input:focus { border-color: #fb923c; box-shadow: 0 0 0 3px rgba(251,146,60,0.12); }
        .bba-input::placeholder { color: #374151; }
        .bba-input-key { border-color: rgba(251,146,60,0.25); }
        .bba-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6b7280; cursor: pointer; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; padding: 4px 6px; transition: color 0.15s; }
        .bba-toggle:hover { color: #fb923c; }
        .bba-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 0.5rem 0 1.25rem; }
        .bba-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.82rem; color: #fca5a5; margin-bottom: 1rem; }
        .bba-submit { width: 100%; padding: 0.8rem 1rem; background: #fb923c; border: none; border-radius: 10px; color: #fff; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background 0.18s, transform 0.12s; margin-top: 0.25rem; }
        .bba-submit:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); }
        .bba-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .bba-footer { text-align: center; margin-top: 1.4rem; font-size: 0.82rem; color: #6b7280; }
        .bba-footer a { color: #fb923c; text-decoration: none; font-weight: 500; }
        .bba-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: bba-spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px; }
        @keyframes bba-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bba-root">
      
        <div className="bba-card">
          <div className="bba-logo-row">
            
            <span className="bba-logo-text">BlinkBasket</span>
            <span className="bba-badge">Admin</span>
          </div>
          <h1 className="bba-heading">Admin registration</h1>
          <p className="bba-sub">
            Already have an account? <Link href="/auth/logincommon">Sign in</Link>&nbsp;·&nbsp;
            <Link href="/auth/usersignup">User signup</Link>
          </p>
          
          {error && <div className="bba-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="bba-row">
              <div className="bba-field">
                <label className="bba-label" htmlFor="bba-name">Full name</label>
                <input id="bba-name" type="text" className="bba-input" placeholder="Admin Name"
                  value={form.full_name} onChange={set('full_name')} autoComplete="name" />
              </div>
              <div className="bba-field">
                <label className="bba-label" htmlFor="bba-phone">Phone <span className="bba-req">*</span></label>
                <input id="bba-phone" type="tel" className="bba-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={set('phone')} required autoComplete="tel" />
              </div>
            </div>

            <div className="bba-field">
              <label className="bba-label" htmlFor="bba-email">Email address <span className="bba-req">*</span></label>
              <input id="bba-email" type="email" className="bba-input" placeholder="admin@blinkbasket.in"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            <div className="bba-row">
              <div className="bba-field">
                <label className="bba-label" htmlFor="bba-pw">Password <span className="bba-req">*</span></label>
                <div className="bba-input-wrap">
                  <input id="bba-pw" type={showPass ? 'text' : 'password'} className="bba-input"
                    placeholder="Min 8 chars" value={form.password} onChange={set('password')}
                    required autoComplete="new-password" style={{ paddingRight: '3.5rem' }} />
                  <button type="button" className="bba-toggle" onClick={() => setShowPass(p => !p)}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="bba-field">
                <label className="bba-label" htmlFor="bba-confirm">Confirm <span className="bba-req">*</span></label>
                <input id="bba-confirm" type={showPass ? 'text' : 'password'} className="bba-input"
                  placeholder="Repeat password" value={form.confirm} onChange={set('confirm')}
                  required autoComplete="new-password" />
              </div>
            </div>

            <div className="bba-sep" />

            <div className="bba-field">
              <label className="bba-label" htmlFor="bba-key">Admin secret key <span className="bba-req">*</span></label>
              <div className="bba-input-wrap">
                <input id="bba-key" type={showKey ? 'text' : 'password'} className="bba-input bba-input-key"
                  placeholder="Enter admin secret key" value={form.admin_key} onChange={set('admin_key')}
                  required autoComplete="off" style={{ paddingRight: '3.5rem' }} />
                <button type="button" className="bba-toggle" onClick={() => setShowKey(p => !p)}>
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button className="bba-submit" type="submit" disabled={loading}>
              {loading && <span className="bba-spinner" />}
              {loading ? 'Creating admin account…' : 'Create admin account'}
            </button>
          </form>

          <p className="bba-footer"><Link href="/">← Back to home</Link></p>
        </div>
      </div>
    </>
  );
}