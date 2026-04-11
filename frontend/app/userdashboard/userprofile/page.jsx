'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserNav from '../../../components/UserNav';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// --- ICONS ---
const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function UserProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Edit form
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editToast, setEditToast] = useState(null);

  // Password form
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwToast, setPwToast] = useState(null);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Auth Redirect
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  // Fetch Profile & Cart
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return;
    
    // Fetch User Data
    fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setEditForm({ full_name: d.full_name || '', phone: d.phone || '' });
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch Cart for UserNav
    fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json())
      .then(d => setCartCount(d.items?.length || 0))
      .catch(() => {});
  }, [status, session]);

  function toast(setter, type, msg) {
    setter({ type, msg });
    setTimeout(() => setter(null), 3500);
  }

  async function handleSaveProfile() {
    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ full_name: editForm.full_name.trim(), phone: editForm.phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setProfile(p => ({ ...p, ...data }));
      toast(setEditToast, 'success', 'Profile updated successfully');
    } catch (err) {
      toast(setEditToast, 'error', err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleChangePassword() {
    const errs = {};
    if (!pwForm.current_password) errs.current_password = 'Required';
    if (!pwForm.new_password || pwForm.new_password.length < 8) errs.new_password = 'Min 8 characters';
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = 'Passwords mismatch';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPwErrors({});
      toast(setPwToast, 'success', 'Password updated successfully');
    } catch (err) {
      toast(setPwToast, 'error', err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (status === 'loading' || loading) return <FullPageSpinner />;

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isGoogle = profile?.provider === 'google';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .upf-root { min-height: 100vh; background: #0a0c10; font-family: 'DM Sans', sans-serif; position: relative; }
        .upf-bg { position: fixed; inset: 0; background: radial-gradient(circle at 0% 0%, rgba(163,230,53,0.05) 0%, transparent 50%); pointer-events: none; }
        .upf-main { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; padding: 2rem 1rem 5rem; }

        /* HERO CARD */
        .upf-hero {
          background: rgba(13,16,24,0.6); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
          padding: 2.5rem; margin-bottom: 2rem;
          display: flex; align-items: center; gap: 2rem;
        }
        .upf-avatar {
          width: 90px; height: 90px; border-radius: 22px;
          background: rgba(163,230,53,0.1); border: 2px solid rgba(163,230,53,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #a3e635;
        }
        .upf-hero-name { font-family: 'Syne', sans-serif; font-size: 1.5rem; color: #fff; margin-bottom: 0.25rem; }
        .upf-hero-email { color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; }
        .upf-badge-row { display: flex; gap: 0.5rem; }
        .upf-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .upf-badge-user { background: rgba(163,230,53,0.1); color: #a3e635; border: 1px solid rgba(163,230,53,0.2); }

        /* SECTIONS */
        .upf-card {
          background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem;
        }
        .upf-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
        .upf-card-icon { color: #a3e635; background: rgba(163,230,53,0.08); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .upf-card-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; color: #fff; font-weight: 700; }

        /* FORM */
        .upf-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .upf-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .upf-label { font-size: 0.75rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; }
        .upf-input {
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.75rem 1rem; color: #fff;
          font-family: inherit; font-size: 0.9rem; transition: all 0.2s;
        }
        .upf-input:focus { border-color: #a3e635; outline: none; background: rgba(0,0,0,0.4); }
        .upf-input:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .upf-btn {
          margin-top: 1.5rem; padding: 0.75rem 1.5rem; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px; border: none;
        }
        .upf-btn-primary { background: #a3e635; color: #052e16; }
        .upf-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(163,230,53,0.3); }
        .upf-btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .upf-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .upf-toast { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .upf-toast.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #34d399; }
        .upf-toast.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }

        .upf-pw-wrap { position: relative; }
        .upf-pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4b5563; cursor: pointer; }

        @media (max-width: 600px) {
          .upf-form-grid { grid-template-columns: 1fr; }
          .upf-hero { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="upf-root">
        <div className="upf-bg" />
        <UserNav cartCount={cartCount} />

        <main className="upf-main">
          {/* HERO */}
          <div className="upf-hero">
            <div className="upf-avatar">{initials}</div>
            <div>
              <h1 className="upf-hero-name">{profile?.full_name || 'Customer'}</h1>
              <p className="upf-hero-email">{profile?.email}</p>
              <div className="upf-badge-row">
                <span className="upf-badge upf-badge-user">Member</span>
                <span className="upf-badge" style={{background: 'rgba(255,255,255,0.05)', color: '#9ca3af'}}>{isGoogle ? 'Google' : 'Email'}</span>
              </div>
            </div>
          </div>

          {/* EDIT PROFILE */}
          <div className="upf-card">
            <div className="upf-card-header">
              <div className="upf-card-icon"><UserIcon /></div>
              <h2 className="upf-card-title">Profile Information</h2>
            </div>
            
            <div className="upf-form-grid">
              <div className="upf-field">
                <label className="upf-label">Full Name</label>
                <input 
                  className="upf-input" 
                  value={editForm.full_name} 
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} 
                />
              </div>
              <div className="upf-field">
                <label className="upf-label">Phone Number</label>
                <input 
                  className="upf-input" 
                  value={editForm.phone} 
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} 
                />
              </div>
              <div className="upf-field" style={{ gridColumn: '1 / -1' }}>
                <label className="upf-label">Email Address (Read-only)</label>
                <input className="upf-input" value={profile?.email || ''} disabled />
              </div>
            </div>

            {editToast && <div className={`upf-toast ${editToast.type}`}><CheckIcon /> {editToast.msg}</div>}

            <button className="upf-btn upf-btn-primary" onClick={handleSaveProfile} disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="upf-card">
            <div className="upf-card-header">
              <div className="upf-card-icon"><LockIcon /></div>
              <h2 className="upf-card-title">Account Security</h2>
            </div>

            {isGoogle ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                You are logged in via Google. Please manage your password through your Google Account settings.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { key: 'current_password', label: 'Current Password', show: 'current' },
                    { key: 'new_password', label: 'New Password', show: 'new' },
                    { key: 'confirm_password', label: 'Confirm Password', show: 'confirm' }
                  ].map(({ key, label, show }) => (
                    <div key={key} className="upf-field">
                      <label className="upf-label">{label}</label>
                      <div className="upf-pw-wrap">
                        <input
                          type={showPw[show] ? 'text' : 'password'}
                          className="upf-input"
                          style={{ width: '100%', paddingRight: '2.5rem', borderColor: pwErrors[key] ? '#ef4444' : '' }}
                          value={pwForm[key]}
                          onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                        <button className="upf-pw-eye" type="button" onClick={() => setShowPw(p => ({ ...p, [show]: !p[show] }))}>
                          <EyeIcon open={showPw[show]} />
                        </button>
                      </div>
                      {pwErrors[key] && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{pwErrors[key]}</span>}
                    </div>
                  ))}
                </div>

                {pwToast && <div className={`upf-toast ${pwToast.type}`}><CheckIcon /> {pwToast.msg}</div>}

                <button className="upf-btn upf-btn-secondary" onClick={handleChangePassword} disabled={pwSaving}>
                  {pwSaving ? 'Updating...' : 'Change Password'}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function FullPageSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 30, height: 30, border: '2px solid rgba(163,230,53,0.1)', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}