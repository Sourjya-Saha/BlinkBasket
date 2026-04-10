'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function UserSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm: '',
  });
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass,      setShowPass]      = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Handle Supabase Google OAuth callback
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setGoogleLoading(true);
        const { email, user_metadata } = session.user;
        const full_name = user_metadata?.full_name || user_metadata?.name || '';
        try {
          const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, full_name }),
          });
          const data = await res.json();
          if (!res.ok || !data.token) throw new Error(data.error || 'Google signup failed');
          await signIn('supabase-google', {
            email, full_name, userId: data.user.id, role: data.user.role,
            accessToken: data.token, redirect: false,
          });
          router.push('/userdashboard');
        } catch (err) {
          setError(err.message);
          setGoogleLoading(false);
        }
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/usersignup`, queryParams: { access_type: 'offline', prompt: 'consent' } },
    });
    if (oauthError) { setError(oauthError.message); setGoogleLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);

    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email, password: form.password,
        full_name: form.full_name, phone: form.phone.trim(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Signup failed. Please try again.'); return; }

    const result = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    });

    if (result?.error) { router.push('/auth/logincommon'); }
    else { router.push('/userdashboard'); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .bbu-root { min-height: 100vh; background: #0a0c10; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; padding: 2rem 1rem; position: relative; overflow: hidden; }
        .bbu-root::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 40% at 0% 10%, rgba(163,230,53,0.09) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 100% 90%, rgba(163,230,53,0.07) 0%, transparent 70%); pointer-events: none; }
        .bbu-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(163,230,53,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.04) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .bbu-card { position: relative; z-index: 1; width: 100%; max-width: 460px; background: #111318; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2.5rem 2.5rem 2rem; box-shadow: 0 0 0 1px rgba(163,230,53,0.06), 0 32px 64px rgba(0,0,0,0.5); animation: bbu-up 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes bbu-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .bbu-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
        .bbu-logo-icon { width: 36px; height: 36px; background: #a3e635; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .bbu-logo-text { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .bbu-heading { font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 0.35rem; }
        .bbu-sub { font-size: 0.875rem; color: #6b7280; margin-bottom: 1.75rem; }
        .bbu-sub a { color: #a3e635; text-decoration: none; font-weight: 500; }
        .bbu-sub a:hover { text-decoration: underline; }
        .bbu-google-btn { width: 100%; padding: 0.72rem 1rem; background: #1a1d24; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.18s, border-color 0.18s; margin-bottom: 1.25rem; }
        .bbu-google-btn:hover:not(:disabled) { background: #22262f; border-color: rgba(255,255,255,0.18); }
        .bbu-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .bbu-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem; }
        .bbu-divider::before, .bbu-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .bbu-divider span { font-size: 0.75rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; }
        .bbu-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
        .bbu-field { margin-bottom: 0.95rem; }
        .bbu-label { display: block; font-size: 0.8rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.02em; }
        .bbu-req { color: #a3e635; margin-left: 2px; }
        .bbu-optional { font-size: 0.72rem; color: #4b5563; margin-left: 4px; font-style: italic; }
        .bbu-input-wrap { position: relative; }
        .bbu-input { width: 100%; padding: 0.7rem 0.9rem; background: #0a0c10; border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .bbu-input:focus { border-color: #a3e635; box-shadow: 0 0 0 3px rgba(163,230,53,0.12); }
        .bbu-input::placeholder { color: #374151; }
        .bbu-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6b7280; cursor: pointer; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; padding: 4px 6px; transition: color 0.15s; }
        .bbu-toggle:hover { color: #a3e635; }
        .bbu-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.82rem; color: #fca5a5; margin-bottom: 1rem; }
        .bbu-submit { width: 100%; padding: 0.8rem 1rem; background: #a3e635; border: none; border-radius: 10px; color: #0a0c10; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background 0.18s, transform 0.12s; margin-top: 0.25rem; }
        .bbu-submit:hover:not(:disabled) { background: #bef264; transform: translateY(-1px); }
        .bbu-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .bbu-footer { text-align: center; margin-top: 1.4rem; font-size: 0.82rem; color: #6b7280; }
        .bbu-footer a { color: #a3e635; text-decoration: none; font-weight: 500; }
        .bbu-spinner { width: 16px; height: 16px; border: 2px solid rgba(10,12,16,0.3); border-top-color: #0a0c10; border-radius: 50%; animation: bbu-spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px; }
        .bbu-spinner-white { border-color: rgba(255,255,255,0.25); border-top-color: #e5e7eb; }
        @keyframes bbu-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bbu-root">
        <div className="bbu-grid" />
        <div className="bbu-card">
          <div className="bbu-logo-row">
            <div className="bbu-logo-icon">🛒</div>
            <span className="bbu-logo-text">BlinkBasket</span>
          </div>
          <h1 className="bbu-heading">Create account</h1>
          <p className="bbu-sub">Already have one? <Link href="/auth/logincommon">Sign in</Link></p>

          <button className="bbu-google-btn" onClick={handleGoogle} disabled={googleLoading || loading} type="button">
            {googleLoading ? <span className="bbu-spinner bbu-spinner-white" /> : <GoogleIcon />}
            {googleLoading ? 'Redirecting…' : 'Sign up with Google'}
          </button>

          <div className="bbu-divider"><span>or</span></div>
          {error && <div className="bbu-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="bbu-row">
              <div className="bbu-field">
                <label className="bbu-label" htmlFor="bbu-name">
                  Full name <span className="bbu-optional">optional</span>
                </label>
                <input id="bbu-name" type="text" className="bbu-input" placeholder="Alex Kumar"
                  value={form.full_name} onChange={set('full_name')} autoComplete="name" />
              </div>
              <div className="bbu-field">
                <label className="bbu-label" htmlFor="bbu-phone">
                  Phone <span className="bbu-req">*</span>
                </label>
                <input id="bbu-phone" type="tel" className="bbu-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={set('phone')} required autoComplete="tel" />
              </div>
            </div>

            <div className="bbu-field">
              <label className="bbu-label" htmlFor="bbu-email">Email address <span className="bbu-req">*</span></label>
              <input id="bbu-email" type="email" className="bbu-input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            <div className="bbu-row">
              <div className="bbu-field">
                <label className="bbu-label" htmlFor="bbu-pw">Password <span className="bbu-req">*</span></label>
                <div className="bbu-input-wrap">
                  <input id="bbu-pw" type={showPass ? 'text' : 'password'} className="bbu-input"
                    placeholder="Min 6 chars" value={form.password} onChange={set('password')}
                    required autoComplete="new-password" style={{ paddingRight: '3.5rem' }} />
                  <button type="button" className="bbu-toggle" onClick={() => setShowPass(p => !p)}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="bbu-field">
                <label className="bbu-label" htmlFor="bbu-confirm">Confirm <span className="bbu-req">*</span></label>
                <input id="bbu-confirm" type={showPass ? 'text' : 'password'} className="bbu-input"
                  placeholder="Repeat password" value={form.confirm} onChange={set('confirm')}
                  required autoComplete="new-password" />
              </div>
            </div>

            <button className="bbu-submit" type="submit" disabled={loading || googleLoading}>
              {loading && <span className="bbu-spinner" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="bbu-footer"><Link href="/">← Back to home</Link></p>
        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  );
}