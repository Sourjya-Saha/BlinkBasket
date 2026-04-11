'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';

const API_BASE          = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'blinkbasket';

const EMPTY_FORM = { name: '', image_url: '' };

const UploadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const EditIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ImageIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const FolderIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

export default function AdminCategories() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErr, setFormErr]       = useState({});
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [imgErrors, setImgErrors]   = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  const fetchCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { showToast('error', 'Failed to load categories'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); }
  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setFormErr({}); setShowModal(true); }
  function openEdit(cat) { setEditTarget(cat); setForm({ name: cat.name || '', image_url: cat.image_url || '' }); setFormErr({}); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditTarget(null); setForm(EMPTY_FORM); setFormErr({}); }

  async function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5*1024*1024) { setFormErr(er => ({ ...er, image_url: 'Max 5MB' })); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', CLOUDINARY_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error('No URL');
      setForm(f => ({ ...f, image_url: data.secure_url }));
    } catch (err) { setFormErr(er => ({ ...er, image_url: `Upload failed: ${err.message}` })); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormErr({ name: 'Name is required' }); return; }
    setSaving(true);
    try {
      const url = editTarget ? `${API_BASE}/api/categories/${editTarget.id}` : `${API_BASE}/api/categories`;
      const res = await fetch(url, { method: editTarget ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ name: form.name.trim(), image_url: form.image_url || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (editTarget) setCategories(prev => prev.map(c => c.id === editTarget.id ? data : c));
      else setCategories(prev => [data, ...prev]);
      showToast('success', `Category ${editTarget ? 'updated' : 'created'}!`);
      closeModal();
    } catch (err) { setFormErr({ _global: err.message }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (!res.ok) throw new Error();
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('success', 'Category deleted');
    } catch { showToast('error', 'Delete failed — may have linked products'); }
    finally { setDeleteId(null); }
  }

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (status === 'loading' || status === 'unauthenticated') return <Spinner />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ac-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .ac-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(ellipse 60% 40% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%); }
        .ac-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px); background-size: 64px 64px; }
        .ac-main { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }
        .ac-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .ac-page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .ac-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }
        .ac-add-btn { display: flex; align-items: center; gap: 7px; padding: 0.58rem 1.2rem; border-radius: 11px; background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35); color: #fb923c; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .ac-add-btn:hover { background: rgba(251,146,60,0.2); }
        .ac-toolbar { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ac-search { background: rgba(13,16,24,0.8); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); border-radius: 11px; padding: 0.58rem 1rem; flex: 1; max-width: 380px; color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .ac-search:focus { border-color: rgba(251,146,60,0.4); }
        .ac-search::placeholder { color: #4b5563; }
        .ac-count { background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25); border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; color: #fb923c; font-weight: 600; }
        .ac-grid-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 1rem; }
        .ac-card { background: rgba(13,16,24,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
        .ac-card:hover { border-color: rgba(251,146,60,0.22); transform: translateY(-3px); box-shadow: 0 14px 40px rgba(0,0,0,0.4); }
        .ac-img-wrap { width: 100%; height: 135px; background: #0c111a; overflow: hidden; position: relative; }
        .ac-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s; }
        .ac-card:hover .ac-img { transform: scale(1.06); }
        .ac-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #1e2535; }
        .ac-card-body { padding: 0.95rem 1.05rem; flex: 1; display: flex; flex-direction: column; gap: 0.55rem; }
        .ac-card-name { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; color: #f3f4f6; }
        .ac-card-date { font-size: 0.7rem; color: #4b5563; }
        .ac-card-actions { display: flex; gap: 0.45rem; margin-top: auto; }
        .ac-edit-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 0.48rem; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #9ca3af; font-size: 0.75rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .ac-edit-btn:hover { background: rgba(255,255,255,0.08); color: #e5e7eb; }
        .ac-del-btn { display: flex; align-items: center; justify-content: center; padding: 0.48rem 0.65rem; border-radius: 8px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.16); color: #f87171; cursor: pointer; transition: background 0.15s; }
        .ac-del-btn:hover { background: rgba(239,68,68,0.14); }
        .ac-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .ac-modal { background: rgba(10,12,20,0.97); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 490px; padding: 2rem; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
        .ac-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .ac-modal-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: #fff; }
        .ac-modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); color: #6b7280; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .ac-modal-close:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }
        .ac-field { display: flex; flex-direction: column; gap: 0.32rem; margin-bottom: 1rem; }
        .ac-label { font-size: 0.68rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; }
        .ac-input { background: #0e1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.62rem 0.9rem; color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; outline: none; transition: border-color 0.2s; width: 100%; }
        .ac-input:focus { border-color: rgba(251,146,60,0.45); }
        .ac-input.err { border-color: rgba(239,68,68,0.4); }
        .ac-error { font-size: 0.7rem; color: #f87171; }
        .ac-hint  { font-size: 0.68rem; color: #374151; }
        .ac-img-preview { width: 100%; height: 100px; border-radius: 10px; overflow: hidden; background: #141920; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; position: relative; }
        .ac-img-preview img { width: 100%; height: 100%; object-fit: cover; }
        .ac-img-preview .ac-img-ph-sm { color: #2a3040; }
        .ac-img-remove { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.7); border: none; color: #fff; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .ac-img-remove:hover { background: rgba(239,68,68,0.85); }
        .ac-upload-row { display: flex; gap: 0.5rem; }
        .ac-upload-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0.48rem 0.75rem; border-radius: 8px; background: rgba(251,146,60,0.07); border: 1px dashed rgba(251,146,60,0.28); color: #fb923c; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; }
        .ac-upload-btn:hover:not(:disabled) { background: rgba(251,146,60,0.14); }
        .ac-upload-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ac-url-input { flex: 1; background: #141920; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.48rem 0.75rem; color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; outline: none; transition: border-color 0.2s; }
        .ac-url-input:focus { border-color: rgba(251,146,60,0.4); }
        .ac-url-input::placeholder { color: #4b5563; }
        .ac-modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.06); }
        .ac-btn-cancel { padding: 0.6rem 1.3rem; border-radius: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .ac-btn-cancel:hover { background: rgba(255,255,255,0.06); color: #e5e7eb; }
        .ac-btn-save { display: flex; align-items: center; gap: 7px; padding: 0.6rem 1.6rem; border-radius: 10px; background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35); color: #fb923c; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .ac-btn-save:hover:not(:disabled) { background: rgba(251,146,60,0.22); }
        .ac-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .ac-spinner { width: 12px; height: 12px; border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c; border-radius: 50%; animation: acSpin 0.7s linear infinite; }
        @keyframes acSpin { to { transform: rotate(360deg); } }
        .ac-global-err { background: rgba(239,68,68,0.09); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.6rem 0.9rem; font-size: 0.82rem; color: #fca5a5; margin-bottom: 1rem; }
        .ac-confirm-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .ac-confirm-box { background: rgba(10,12,20,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; max-width: 360px; text-align: center; }
        .ac-confirm-icon { width: 50px; height: 50px; border-radius: 50%; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #f87171; }
        .ac-confirm-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem; }
        .ac-confirm-sub { font-size: 0.82rem; color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5; }
        .ac-confirm-btns { display: flex; gap: 0.75rem; justify-content: center; }
        .ac-confirm-cancel { padding: 0.55rem 1.2rem; border-radius: 9px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .ac-confirm-del { padding: 0.55rem 1.3rem; border-radius: 9px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .ac-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(12px); animation: acUp 0.25s ease; }
        .ac-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .ac-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes acUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ac-empty { text-align: center; padding: 4rem; background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #4b5563; }
        .ac-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(251,146,60,0.06); border: 1px solid rgba(251,146,60,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #4b5563; }
        @media (max-width: 640px) { .ac-main { padding: 1rem 1rem 3rem; } .ac-grid-items { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="ac-root">
        <div className="ac-bg" /><div className="ac-grid" />
        <AdminNav />
        <main className="ac-main">
          <div className="ac-page-header">
            <div>
              <h1 className="ac-page-title">Categories</h1>
              <p className="ac-page-sub">Organise your product catalog into groups.</p>
            </div>
            <button className="ac-add-btn" onClick={openAdd}><PlusIcon /> Add Category</button>
          </div>
          <div className="ac-toolbar">
            <input className="ac-search" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
            <span className="ac-count">{categories.length} total</span>
          </div>
          {loading ? (
            <div className="ac-empty"><div className="ac-empty-icon"><FolderIcon /></div><p>Loading categories…</p></div>
          ) : filtered.length === 0 ? (
            <div className="ac-empty"><div className="ac-empty-icon"><FolderIcon /></div><p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>{search ? 'No matches found' : 'No categories yet'}</p><p>{search ? 'Try a different search.' : 'Add your first category.'}</p></div>
          ) : (
            <div className="ac-grid-items">
              {filtered.map(cat => (
                <div key={cat.id} className="ac-card">
                  <div className="ac-img-wrap">
                    {cat.image_url && !imgErrors[cat.id] ? (
                      <img className="ac-img" src={cat.image_url} alt={cat.name} onError={() => setImgErrors(p => ({ ...p, [cat.id]: true }))} />
                    ) : <div className="ac-img-ph"><FolderIcon /></div>}
                  </div>
                  <div className="ac-card-body">
                    <span className="ac-card-name">{cat.name}</span>
                    <span className="ac-card-date">{cat.created_at ? new Date(cat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    <div className="ac-card-actions">
                      <button className="ac-edit-btn" onClick={() => openEdit(cat)}><EditIcon /> Edit</button>
                      <button className="ac-del-btn" onClick={() => setDeleteId(cat.id)}><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {showModal && (
          <div className="ac-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="ac-modal">
              <div className="ac-modal-header">
                <span className="ac-modal-title">{editTarget ? 'Edit Category' : 'Add Category'}</span>
                <button className="ac-modal-close" onClick={closeModal}>✕</button>
              </div>
              {formErr._global && <div className="ac-global-err">{formErr._global}</div>}
              <div className="ac-field">
                <label className="ac-label">Category Name *</label>
                <input className={`ac-input${formErr.name ? ' err' : ''}`} value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErr(er => ({ ...er, name: '' })); }} placeholder="e.g. Dairy & Eggs" />
                {formErr.name && <span className="ac-error">{formErr.name}</span>}
              </div>
              <div className="ac-field">
                <label className="ac-label">Category Image</label>
                <div className="ac-img-preview">
                  {form.image_url ? <><img src={form.image_url} alt="preview" /><button className="ac-img-remove" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>✕</button></> : <div className="ac-img-ph-sm"><ImageIcon /></div>}
                </div>
                <div className="ac-upload-row">
                  <button className="ac-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <><div className="ac-spinner" /> Uploading…</> : <><UploadIcon /> Upload</>}
                  </button>
                  <input className="ac-url-input" placeholder="…or paste URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                {formErr.image_url && <span className="ac-error">{formErr.image_url}</span>}
                <span className="ac-hint">Upload via Cloudinary or paste an image URL</span>
              </div>
              <div className="ac-modal-footer">
                <button className="ac-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="ac-btn-save" onClick={handleSave} disabled={saving || uploading}>
                  {saving ? <><div className="ac-spinner" /> Saving…</> : editTarget ? 'Update' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <div className="ac-confirm-overlay">
            <div className="ac-confirm-box">
              <div className="ac-confirm-icon"><TrashIcon /></div>
              <p className="ac-confirm-title">Delete Category?</p>
              <p className="ac-confirm-sub">This will permanently delete the category. Products in this category will lose their assignment.</p>
              <div className="ac-confirm-btns">
                <button className="ac-confirm-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="ac-confirm-del" onClick={() => handleDelete(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`ac-toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(251,146,60,0.15)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}