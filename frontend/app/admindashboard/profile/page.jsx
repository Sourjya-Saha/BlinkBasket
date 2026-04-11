'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav, { Icons } from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

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

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function AdminProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return;
    fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setEditForm({ full_name: d.full_name || '', phone: d.phone || '' });
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    if (!pwForm.current_password) errs.current_password = 'Current password required';
    if (!pwForm.new_password || pwForm.new_password.length < 8) errs.new_password = 'Min 8 characters';
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = 'Passwords do not match';
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
      toast(setPwToast, 'success', 'Password changed successfully');
    } catch (err) {
      toast(setPwToast, 'error', err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (status === 'loading' || loading) return <FullPageSpinner />;

  const user = profile;
  const initials = (user?.full_name || user?.email || 'A')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isGoogle = user?.provider === 'google';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .apf-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .apf-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 70% 50% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%); }
        .apf-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px; }

        .apf-main { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }

        .apf-page-header { margin-bottom: 2rem; }
        .apf-page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .apf-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }

        /* HERO CARD */
        .apf-hero {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          padding: 2rem; margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1.75rem;
          position: relative; overflow: hidden;
        }
        .apf-hero::before {
          content: ''; position: absolute; top: -50%; right: -10%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .apf-big-avatar {
          width: 84px; height: 84px; flex-shrink: 0;
          background: rgba(251,146,60,0.1); border: 2px solid rgba(251,146,60,0.3);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800; color: #fb923c;
        }
        .apf-hero-name { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem; }
        .apf-hero-email { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem; }
        .apf-hero-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .apf-tag { padding: 3px 11px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .apf-tag-admin { background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.3); color: #fb923c; }
        .apf-tag-provider { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; }
        .apf-tag-id { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #4b5563; font-family: monospace; font-weight: 400; text-transform: none; font-size: 0.7rem; }

        /* META ROW */
        .apf-meta-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .apf-meta-card { background: rgba(13,16,24,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem 1.2rem; }
        .apf-meta-label { font-size: 0.68rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.35rem; }
        .apf-meta-value { font-size: 0.9rem; color: #e5e7eb; }
        .apf-meta-value.empty { color: #374151; font-style: italic; }

        /* SECTIONS */
        .apf-section {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
          padding: 1.75rem; margin-bottom: 1.25rem;
        }
        .apf-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .apf-section-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.2); display: flex; align-items: center; justify-content: center; color: #fb923c; }
        .apf-section-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #fff; }
        .apf-section-sub { font-size: 0.78rem; color: #4b5563; margin-top: 2px; }

        /* FORM */
        .apf-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .apf-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .apf-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; }
        .apf-input {
          background: #0e1117; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px; padding: 0.65rem 0.9rem;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
        }
        .apf-input:focus { border-color: rgba(251,146,60,0.45); box-shadow: 0 0 0 3px rgba(251,146,60,0.07); }
        .apf-input:disabled { opacity: 0.35; cursor: not-allowed; }
        .apf-input.err { border-color: rgba(239,68,68,0.4); }
        .apf-error { font-size: 0.7rem; color: #f87171; }
        .apf-pw-wrap { position: relative; }
        .apf-pw-wrap .apf-input { padding-right: 2.5rem; }
        .apf-pw-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4b5563; cursor: pointer; display: flex; align-items: center; padding: 4px; transition: color 0.15s; }
        .apf-pw-eye:hover { color: #9ca3af; }

        /* STRENGTH BAR */
        .apf-strength { margin-top: 0.4rem; }
        .apf-strength-bar { height: 3px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; margin-bottom: 3px; }
        .apf-strength-fill { height: 100%; border-radius: 3px; transition: width 0.3s, background 0.3s; }
        .apf-strength-label { font-size: 0.67rem; color: #4b5563; }

        /* SAVE BTN */
        .apf-save-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 0.65rem 1.6rem; border-radius: 11px;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35);
          color: #fb923c; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.18s;
          margin-top: 1.25rem;
        }
        .apf-save-btn:hover:not(:disabled) { background: rgba(251,146,60,0.22); }
        .apf-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .apf-save-spinner { width: 13px; height: 13px; border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c; border-radius: 50%; animation: apfSpin 0.7s linear infinite; }
        @keyframes apfSpin { to { transform: rotate(360deg); } }

        /* TOAST */
        .apf-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(12px); animation: apfUp 0.25s ease; display: flex; align-items: center; gap: 8px; }
        .apf-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .apf-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes apfUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .apf-google-notice {
          background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.2);
          border-radius: 10px; padding: 0.85rem 1rem;
          font-size: 0.82rem; color: #93c5fd;
          display: flex; align-items: center; gap: 8px;
        }

        @media (max-width: 640px) {
          .apf-hero { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
          .apf-form-grid { grid-template-columns: 1fr; }
          .apf-main { padding: 1rem 1rem 3rem; }
        }
      `}</style>

      <div className="apf-root">
        <div className="apf-bg" />
        <div className="apf-grid" />
        <AdminNav />
        <main className="apf-main">
          <div className="apf-page-header">
            <h1 className="apf-page-title">Profile & Settings</h1>
            <p className="apf-page-sub">Manage your account details and security.</p>
          </div>

          {/* HERO */}
          <div className="apf-hero">
            <div className="apf-big-avatar">{initials}</div>
            <div>
              <div className="apf-hero-name">{user?.full_name || 'No name set'}</div>
              <div className="apf-hero-email">{user?.email}</div>
              <div className="apf-hero-tags">
                <span className="apf-tag apf-tag-admin">Admin</span>
                <span className="apf-tag apf-tag-provider">{isGoogle ? 'Google Account' : 'Email Account'}</span>
               <span className="apf-tag apf-tag-id">
  ID: {String(user?.id || '').slice(0, 8)}…
</span>
              </div>
            </div>
          </div>

          {/* META */}
          <div className="apf-meta-row">
            {[
              { label: 'Phone', value: user?.phone || 'Not added', empty: !user?.phone },
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Sign-in Method', value: isGoogle ? 'Google OAuth' : 'Email & Password' },
              { label: 'Role', value: 'Administrator' },
            ].map(({ label, value, empty }) => (
              <div key={label} className="apf-meta-card">
                <div className="apf-meta-label">{label}</div>
                <div className={`apf-meta-value${empty ? ' empty' : ''}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* EDIT PROFILE */}
          <div className="apf-section">
            <div className="apf-section-header">
              <div className="apf-section-icon"><Icons.User /></div>
              <div>
                <div className="apf-section-title">Personal Information</div>
                <div className="apf-section-sub">Update your display name and phone number.</div>
              </div>
            </div>
            <div className="apf-form-grid">
              <div className="apf-field">
                <label className="apf-label">Full Name</label>
                <input className="apf-input" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div className="apf-field">
                <label className="apf-label">Phone Number</label>
                <input className="apf-input" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="apf-field">
                <label className="apf-label">Email Address</label>
                <input className="apf-input" value={user?.email || ''} disabled />
              </div>
            </div>
            {editToast && (
              <div className={`apf-toast ${editToast.type}`} style={{ position: 'relative', bottom: 'auto', right: 'auto', marginTop: '1rem', width: 'fit-content' }}>
                {editToast.type === 'success' ? <CheckIcon /> : '✕'} {editToast.msg}
              </div>
            )}
            <button className="apf-save-btn" onClick={handleSaveProfile} disabled={editSaving}>
              {editSaving ? <><div className="apf-save-spinner" /> Saving…</> : <><SaveIcon /> Save Changes</>}
            </button>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="apf-section">
            <div className="apf-section-header">
              <div className="apf-section-icon"><LockIcon /></div>
              <div>
                <div className="apf-section-title">Change Password</div>
                <div className="apf-section-sub">
                  {isGoogle ? 'Not available for Google accounts.' : 'Keep your account secure with a strong password.'}
                </div>
              </div>
            </div>
            {isGoogle ? (
              <div className="apf-google-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Password changes are not available for Google OAuth accounts. Use your Google account settings instead.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { key: 'current_password', label: 'Current Password', show: 'current', placeholder: 'Enter current password' },
                    { key: 'new_password', label: 'New Password', show: 'new', placeholder: 'Min 8 characters' },
                    { key: 'confirm_password', label: 'Confirm New Password', show: 'confirm', placeholder: 'Repeat new password' },
                  ].map(({ key, label, show, placeholder }) => (
                    <div key={key} className="apf-field">
                      <label className="apf-label">{label}</label>
                      <div className="apf-pw-wrap">
                        <input
                          type={showPw[show] ? 'text' : 'password'}
                          className={`apf-input${pwErrors[key] ? ' err' : ''}`}
                          value={pwForm[key]}
                          onChange={e => { setPwForm(f => ({ ...f, [key]: e.target.value })); setPwErrors(er => ({ ...er, [key]: '' })); }}
                          placeholder={placeholder}
                        />
                        <button className="apf-pw-eye" type="button" onClick={() => setShowPw(p => ({ ...p, [show]: !p[show] }))}>
                          <EyeIcon open={showPw[show]} />
                        </button>
                      </div>
                      {key === 'new_password' && pwForm.new_password && (
                        <PasswordStrength password={pwForm.new_password} />
                      )}
                      {pwErrors[key] && <span className="apf-error">{pwErrors[key]}</span>}
                    </div>
                  ))}
                </div>
                {pwToast && (
                  <div className={`apf-toast ${pwToast.type}`} style={{ position: 'relative', bottom: 'auto', right: 'auto', marginTop: '1rem', width: 'fit-content' }}>
                    {pwToast.type === 'success' ? <CheckIcon /> : '✕'} {pwToast.msg}
                  </div>
                )}
                <button className="apf-save-btn" onClick={handleChangePassword} disabled={pwSaving} style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                >
                  {pwSaving ? <><div className="apf-save-spinner" style={{ borderTopColor: '#fca5a5' }} /> Updating…</> : <><LockIcon /> Update Password</>}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function PasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  return (
    <div className="apf-strength">
      <div className="apf-strength-bar">
        <div className="apf-strength-fill" style={{ width: `${(score / 4) * 100}%`, background: colors[score - 1] || '#374151' }} />
      </div>
      {score > 0 && <span className="apf-strength-label" style={{ color: colors[score - 1] }}>{labels[score - 1]}</span>}
    </div>
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