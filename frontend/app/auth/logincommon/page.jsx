'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function LoginCommon() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { status }   = useSession();

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass,      setShowPass]      = useState(false);

  // Show NextAuth error from URL (e.g. ?error=CredentialsSignin)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError('Sign-in failed. Please check your credentials.');
  }, [searchParams]);

  // Redirect already-logged-in users
  useEffect(() => {
    if (status === 'authenticated') redirectByRole();
  }, [status]);

  // ── Handle Supabase OAuth callback ──────────────────────────────
  // When Supabase redirects back, it appends tokens in the URL hash.
  // supabase.auth.onAuthStateChange fires with the session automatically.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        await handleSupabaseGoogleSession(session);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSupabaseGoogleSession(session) {
    try {
      setGoogleLoading(true);
      setError('');

      const { email, user_metadata } = session.user;
      const full_name = user_metadata?.full_name || user_metadata?.name || '';

      // Upsert user in our Postgres DB via Express backend
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.error || 'Google sign-in failed.');
        setGoogleLoading(false);
        return;
      }

      // Sign into NextAuth with the backend token
      const result = await signIn('supabase-google', {
        email,
        full_name,
        userId:      data.user.id,
        role:        data.user.role,
        accessToken: data.token,
        redirect:    false,
      });

      if (result?.error) {
        setError('Session creation failed. Please try again.');
        setGoogleLoading(false);
        return;
      }

      redirectByRole(data.user.role);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setGoogleLoading(false);
    }
  }

  function redirectByRole(role) {
    if (role === 'admin') {
      router.push('/admindashboard');
    } else {
      router.push('/userdashboard');
    }
  }

  // ── Google OAuth via Supabase ───────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/logincommon`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // Supabase redirects the page — onAuthStateChange above handles the callback
  }

  // ── Email + Password ────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }

    // Fetch session to get role
    const sessionRes = await fetch('/api/auth/session');
    const session    = await sessionRes.json();
    redirectByRole(session?.user?.role);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bb-root {
          min-height: 100vh;
          background: #0a0c10;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .bb-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%,   rgba(163,230,53,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 100%, rgba(163,230,53,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .bb-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(163,230,53,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .bb-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          margin: 2rem;
          background: #111318;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2.5rem 2.5rem 2rem;
          box-shadow: 0 0 0 1px rgba(163,230,53,0.06), 0 32px 64px rgba(0,0,0,0.5);
          animation: bb-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes bb-up {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0);    }
        }

        .bb-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2rem;
        }

        .bb-logo-icon {
          width: 36px; height: 36px;
          background: #a3e635;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .bb-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .bb-heading {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 0.4rem;
        }

        .bb-sub {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1.75rem;
        }

        .bb-sub a { color: #a3e635; text-decoration: none; font-weight: 500; }
        .bb-sub a:hover { text-decoration: underline; }

        .bb-google-btn {
          width: 100%;
          padding: 0.72rem 1rem;
          background: #1a1d24;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.18s, border-color 0.18s;
          margin-bottom: 1.25rem;
        }

        .bb-google-btn:hover:not(:disabled) {
          background: #22262f;
          border-color: rgba(255,255,255,0.18);
        }

        .bb-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .bb-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
        }

        .bb-divider::before, .bb-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .bb-divider span {
          font-size: 0.75rem;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .bb-field { margin-bottom: 1rem; }

        .bb-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
        }

        .bb-input-wrap { position: relative; }

        .bb-input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          background: #0a0c10;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .bb-input:focus {
          border-color: #a3e635;
          box-shadow: 0 0 0 3px rgba(163,230,53,0.12);
        }

        .bb-input::placeholder { color: #374151; }

        .bb-toggle {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #6b7280; cursor: pointer;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          padding: 4px 6px;
          transition: color 0.15s;
        }

        .bb-toggle:hover { color: #a3e635; }

        .bb-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          font-size: 0.82rem;
          color: #fca5a5;
          margin-bottom: 1rem;
        }

        .bb-submit {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #a3e635;
          border: none;
          border-radius: 10px;
          color: #0a0c10;
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s;
          margin-top: 0.25rem;
        }

        .bb-submit:hover:not(:disabled) { background: #bef264; transform: translateY(-1px); }
        .bb-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .bb-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .bb-footer a {
          font-size: 0.82rem;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s;
        }

        .bb-footer a:hover { color: #a3e635; }

        .bb-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(10,12,16,0.3);
          border-top-color: #0a0c10;
          border-radius: 50%;
          animation: bb-spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 6px;
        }

        .bb-spinner-white {
          border-color: rgba(255,255,255,0.25);
          border-top-color: #e5e7eb;
        }

        @keyframes bb-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bb-root">
        <div className="bb-grid" />

        <div className="bb-card">
          <div className="bb-logo-row">
            <div className="bb-logo-icon">🛒</div>
            <span className="bb-logo-text">BlinkBasket</span>
          </div>

          <h1 className="bb-heading">Welcome back</h1>
          <p className="bb-sub">
            New here?&nbsp;
            <Link href="/auth/usersignup">Create an account</Link>
            &nbsp;·&nbsp;
            <Link href="/auth/adminsignup">Admin signup</Link>
          </p>

          {/* Google — Supabase OAuth */}
          <button
            className="bb-google-btn"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            type="button"
          >
            {googleLoading ? (
              <span className="bb-spinner bb-spinner-white" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="bb-divider"><span>or</span></div>

          {error && <div className="bb-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="bb-field">
              <label className="bb-label" htmlFor="bb-email">Email address</label>
              <input
                id="bb-email"
                type="email"
                className="bb-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="bb-field">
              <label className="bb-label" htmlFor="bb-pw">Password</label>
              <div className="bb-input-wrap">
                <input
                  id="bb-pw"
                  type={showPass ? 'text' : 'password'}
                  className="bb-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3.5rem' }}
                />
                <button
                  type="button"
                  className="bb-toggle"
                  onClick={() => setShowPass(p => !p)}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button className="bb-submit" type="submit" disabled={loading || googleLoading}>
              {loading && <span className="bb-spinner" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="bb-footer">
            <a href="#">Forgot password?</a>
            <Link href="/">← Back to home</Link>
          </div>
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