'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav, { Icons } from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 6;

// --- Icons ---
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const RadiusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="9" x2="12" y2="3"/>
  </svg>
);

const EMPTY_FORM = { name: '', latitude: '', longitude: '', service_radius_km: '' };

export default function AdminLocations() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // --- OSM Specific State ---
  const [osmQuery, setOsmQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingOSM, setIsSearchingOSM] = useState(false);
  const debounceTimer = useRef(null);

  // --- Auth Protection ---
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  // --- Data Fetching ---
  const fetchLocations = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/locations`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) { 
      showToast('error', 'Network error: Could not load locations'); 
    } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  // --- OSM Search Logic ---
  const handleOSMSearch = (val) => {
    setOsmQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearchingOSM(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("OSM Error:", err);
      } finally {
        setIsSearchingOSM(false);
      }
    }, 600);
  };

  const selectSuggestion = (sug) => {
    setForm(f => ({
      ...f,
      name: sug.display_name.split(',')[0], 
      latitude: sug.lat,
      longitude: sug.lon
    }));
    setOsmQuery(sug.display_name);
    setSuggestions([]);
    setFormErrors(er => ({ ...er, latitude: '', longitude: '', _global: '' }));
  };

  // --- Search & Pagination Logic ---
  const filtered = useMemo(() => {
    return locations.filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [locations, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  // --- Helpers ---
  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  }

  function openAdd() { 
    setEditTarget(null); 
    setForm(EMPTY_FORM); 
    setOsmQuery('');
    setSuggestions([]);
    setFormErrors({}); 
    setShowModal(true); 
  }

  function openEdit(loc) { 
    setEditTarget(loc); 
    setForm({ 
      name: loc.name, 
      latitude: String(loc.latitude), 
      longitude: String(loc.longitude), 
      service_radius_km: String(loc.service_radius_km) 
    }); 
    setOsmQuery(loc.name);
    setSuggestions([]);
    setFormErrors({}); 
    setShowModal(true); 
  }

  function closeModal() { 
    setShowModal(false); 
    setEditTarget(null); 
    setForm(EMPTY_FORM); 
    setOsmQuery('');
    setSuggestions([]);
    setFormErrors({}); 
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.latitude || !form.longitude) e._global = 'Please search and select a location';
    
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const rad = parseFloat(form.service_radius_km);

    if (isNaN(lat) || lat < -90 || lat > 90) e.latitude = 'Invalid Latitude';
    if (isNaN(lng) || lng < -180 || lng > 180) e.longitude = 'Invalid Longitude';
    if (isNaN(rad) || rad <= 0) e.service_radius_km = 'Must be > 0';
    return e;
  }

  // --- Actions ---
  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const url = editTarget ? `${API_BASE}/locations/${editTarget.id}` : `${API_BASE}/locations`;
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          latitude: parseFloat(form.latitude), 
          longitude: parseFloat(form.longitude), 
          service_radius_km: parseFloat(form.service_radius_km) 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error occurred');

      if (editTarget) setLocations(prev => prev.map(l => l.id === editTarget.id ? data : l));
      else setLocations(prev => [data, ...prev]);
      
      showToast('success', `Location successfully ${editTarget ? 'updated' : 'added'}`);
      closeModal();
    } catch (err) {
      setFormErrors({ _global: err.message });
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/locations/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${session.accessToken}` } 
      });
      if (!res.ok) throw new Error();
      setLocations(prev => prev.filter(l => l.id !== id));
      showToast('success', 'Location removed successfully');
    } catch { 
      showToast('error', 'Failed to delete location'); 
    } finally { setDeleteId(null); }
  }

  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .aloc-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .aloc-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 70% 50% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%); }
        .aloc-grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px; }

        .aloc-main { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }

        .aloc-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .aloc-page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .aloc-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }
        .aloc-add-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 0.58rem 1.2rem; border-radius: 11px;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35);
          color: #fb923c; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .aloc-add-btn:hover { background: rgba(251,146,60,0.2); }

        /* OSM SUGGESTIONS */
        .osm-wrapper { position: relative; width: 100%; }
        .osm-suggestions { 
          position: absolute; top: 100%; left: 0; right: 0; z-index: 1000;
          background: #0e1117; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; margin-top: 5px; max-height: 200px; overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .osm-item { padding: 10px 14px; color: #9ca3af; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .osm-item:hover { background: rgba(251,146,60,0.1); color: #fff; }

        /* TOOLBAR */
        .aloc-toolbar { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .aloc-search {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 11px;
          padding: 0.58rem 1rem; flex: 1; max-width: 380px;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s;
        }
        .aloc-search:focus { border-color: rgba(251,146,60,0.4); }
        .aloc-search::placeholder { color: #4b5563; }
        .aloc-count { background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25); border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; color: #fb923c; font-weight: 600; }

        /* GRID */
        .aloc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }

        .aloc-card {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
          padding: 0; overflow: hidden;
          transition: border-color 0.18s, transform 0.18s;
        }
        .aloc-card:hover { border-color: rgba(251,146,60,0.2); transform: translateY(-2px); }

        /* MAP PREVIEW */
        .aloc-map-preview {
          height: 130px; background: #0c111a;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .aloc-map-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(251,146,60,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,146,60,0.07) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .aloc-map-circle-outer {
          width: 80px; height: 80px; border-radius: 50%;
          border: 2px dashed rgba(251,146,60,0.3);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1;
          animation: aloc-pulse 3s ease-in-out infinite;
        }
        .aloc-map-circle-inner {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c;
        }
        @keyframes aloc-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .aloc-radius-badge {
          position: absolute; top: 10px; right: 10px; z-index: 2;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
          border: 1px solid rgba(251,146,60,0.2); border-radius: 6px;
          padding: 3px 8px; font-size: 0.68rem; color: #fb923c; font-weight: 600;
          display: flex; align-items: center; gap: 4px;
        }

        .aloc-card-body { padding: 1.1rem 1.2rem; }
        .aloc-card-name { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.6rem; }
        .aloc-coords { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.9rem; }
        .aloc-coord-row { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #6b7280; font-family: monospace; }
        .aloc-coord-label { color: #4b5563; font-size: 0.67rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; min-width: 36px; font-family: 'DM Sans', sans-serif; }
        .aloc-card-actions { display: flex; gap: 0.5rem; }
        .aloc-edit-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 0.48rem; border-radius: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af; font-size: 0.78rem; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .aloc-edit-btn:hover { background: rgba(255,255,255,0.08); color: #e5e7eb; }
        .aloc-del-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0.48rem 0.9rem; border-radius: 8px;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
          color: #f87171; font-size: 0.78rem; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.15s;
        }
        .aloc-del-btn:hover { background: rgba(239,68,68,0.14); }

        /* PAGINATION */
        .aloc-pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2.5rem; }
        .aloc-p-btn { 
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
          font-size: 0.8rem; transition: all 0.2s;
        }
        .aloc-p-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); color: #fff; border-color: rgba(255,255,255,0.15); }
        .aloc-p-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .aloc-p-info { font-size: 0.75rem; color: #4b5563; font-weight: 500; }

        /* MODAL */
        .aloc-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .aloc-modal {
          background: rgba(10,12,20,0.97); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
          width: 100%; max-width: 500px; padding: 2rem;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .aloc-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .aloc-modal-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: #fff; }
        .aloc-modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); color: #6b7280; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .aloc-modal-close:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }

        .aloc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .aloc-full { grid-column: 1 / -1; }
        .aloc-field { display: flex; flex-direction: column; gap: 0.32rem; }
        .aloc-label { font-size: 0.68rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; }
        .aloc-input {
          background: #0e1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          padding: 0.62rem 0.9rem; color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s; width: 100%;
        }
        .aloc-input:focus { border-color: rgba(251,146,60,0.45); }
        .aloc-input.err { border-color: rgba(239,68,68,0.4); }
        .aloc-input:read-only { opacity: 0.6; cursor: not-allowed; background: rgba(255,255,255,0.02); }
        .aloc-hint { font-size: 0.67rem; color: #374151; }
        .aloc-error { font-size: 0.7rem; color: #f87171; }
        .aloc-global-err { background: rgba(239,68,68,0.09); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.6rem 0.9rem; font-size: 0.82rem; color: #fca5a5; margin-bottom: 1rem; }

        .aloc-modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.06); }
        .aloc-btn-cancel { padding: 0.6rem 1.3rem; border-radius: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .aloc-btn-save { display: flex; align-items: center; gap: 7px; padding: 0.6rem 1.6rem; border-radius: 10px; background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.35); color: #fb923c; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .aloc-btn-save:hover:not(:disabled) { background: rgba(251,146,60,0.22); }
        .aloc-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .aloc-spinner { width: 12px; height: 12px; border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c; border-radius: 50%; animation: alocSpin 0.7s linear infinite; }
        @keyframes alocSpin { to { transform: rotate(360deg); } }

        /* CONFIRM */
        .aloc-confirm-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .aloc-confirm-box { background: rgba(10,12,20,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; max-width: 360px; text-align: center; }
        .aloc-confirm-icon { width: 50px; height: 50px; border-radius: 50%; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #f87171; }
        .aloc-confirm-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem; }
        .aloc-confirm-sub { font-size: 0.82rem; color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5; }
        .aloc-confirm-btns { display: flex; gap: 0.75rem; justify-content: center; }
        .aloc-confirm-cancel { padding: 0.55rem 1.2rem; border-radius: 9px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .aloc-confirm-del { padding: 0.55rem 1.3rem; border-radius: 9px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-size: 0.875rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* TOAST */
        .aloc-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: 0.75rem 1.2rem; border-radius: 10px; font-size: 0.875rem; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(12px); animation: alocUp 0.25s ease; }
        .aloc-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .aloc-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes alocUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .aloc-empty { text-align: center; padding: 4rem; background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #4b5563; }
        .aloc-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(251,146,60,0.06); border: 1px solid rgba(251,146,60,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #4b5563; }

        @media (max-width: 640px) {
          .aloc-main { padding: 1rem 1rem 3rem; }
          .aloc-form-grid { grid-template-columns: 1fr; }
          .aloc-full { grid-column: 1; }
        }
      `}</style>

      <div className="aloc-root">
        <div className="aloc-bg" />
        <div className="aloc-grid-bg" />
        <AdminNav />
        <main className="aloc-main">
          <div className="aloc-page-header">
            <div>
              <h1 className="aloc-page-title">Delivery Locations</h1>
              <p className="aloc-page-sub">Manage serviceable zones and delivery radius.</p>
            </div>
            <button className="aloc-add-btn" onClick={openAdd}><PlusIcon /> Add Location</button>
          </div>

          <div className="aloc-toolbar">
            <input 
              className="aloc-search" 
              placeholder="Search by zone name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <span className="aloc-count">{filtered.length} zone{filtered.length !== 1 ? 's' : ''} found</span>
          </div>

          {loading ? (
            <div className="aloc-empty">
              <div className="aloc-empty-icon"><Icons.MapPin /></div>
              <div style={{ fontSize: '0.875rem' }}>Loading infrastructure…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="aloc-empty">
              <div className="aloc-empty-icon"><Icons.MapPin /></div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>
                {search ? 'No matches found' : 'No delivery zones yet'}
              </div>
              <div style={{ fontSize: '0.82rem' }}>{search ? 'Try a different search term.' : 'Add your first serviceable location to begin.'}</div>
            </div>
          ) : (
            <>
              <div className="aloc-grid">
                {paginatedData.map(loc => (
                  <div key={loc.id} className="aloc-card">
                    <div className="aloc-map-preview">
                      <div className="aloc-map-grid" />
                      <div className="aloc-map-circle-outer">
                        <div className="aloc-map-circle-inner"><Icons.MapPin /></div>
                      </div>
                      <div className="aloc-radius-badge">
                        <RadiusIcon />{loc.service_radius_km} km
                      </div>
                    </div>
                    <div className="aloc-card-body">
                      <div className="aloc-card-name">{loc.name}</div>
                      <div className="aloc-coords">
                        <div className="aloc-coord-row">
                          <span className="aloc-coord-label">LAT</span>
                          <span>{Number(loc.latitude).toFixed(6)}</span>
                        </div>
                        <div className="aloc-coord-row">
                          <span className="aloc-coord-label">LNG</span>
                          <span>{Number(loc.longitude).toFixed(6)}</span>
                        </div>
                      </div>
                      <div className="aloc-card-actions">
                        <button className="aloc-edit-btn" onClick={() => openEdit(loc)}><EditIcon /> Edit</button>
                        <button className="aloc-del-btn" onClick={() => setDeleteId(loc.id)}><TrashIcon /> Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="aloc-pagination">
                  <button 
                    className="aloc-p-btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="aloc-p-info">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="aloc-p-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* MODAL */}
        {showModal && (
          <div className="aloc-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="aloc-modal">
              <div className="aloc-modal-header">
                <span className="aloc-modal-title">{editTarget ? 'Edit Location' : 'Add Delivery Zone'}</span>
                <button className="aloc-modal-close" onClick={closeModal}>✕</button>
              </div>
              
              {formErrors._global && <div className="aloc-global-err">{formErrors._global}</div>}
              
              <div className="aloc-form-grid">
                {/* OSM SEARCH WRAPPER */}
                <div className="aloc-field aloc-full osm-wrapper">
                  <label className="aloc-label">Search Global Location</label>
                  <input 
                    className="aloc-input" 
                    placeholder="Type to search (e.g. Mumbai Airport)" 
                    value={osmQuery}
                    onChange={(e) => handleOSMSearch(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <div className="osm-suggestions">
                      {suggestions.map((s, i) => (
                        <div key={i} className="osm-item" onClick={() => selectSuggestion(s)}>
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearchingOSM && <div style={{ fontSize: '0.65rem', color: '#fb923c', marginTop: '4px' }}>Searching...</div>}
                </div>

                <div className="aloc-field aloc-full">
                  <label className="aloc-label">Internal Name *</label>
                  <input className={`aloc-input${formErrors.name ? ' err' : ''}`} value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(er => ({ ...er, name: '' })); }} placeholder="e.g. Kolkata Central" />
                  {formErrors.name && <span className="aloc-error">{formErrors.name}</span>}
                </div>

                <div className="aloc-field">
                  <label className="aloc-label">Latitude</label>
                  <input className="aloc-input" value={form.latitude} readOnly placeholder="Auto-filled" />
                  {formErrors.latitude && <span className="aloc-error">{formErrors.latitude}</span>}
                </div>
                
                <div className="aloc-field">
                  <label className="aloc-label">Longitude</label>
                  <input className="aloc-input" value={form.longitude} readOnly placeholder="Auto-filled" />
                  {formErrors.longitude && <span className="aloc-error">{formErrors.longitude}</span>}
                </div>

                <div className="aloc-field aloc-full">
                  <label className="aloc-label">Service Radius (km) *</label>
                  <input type="number" step="0.1" min="0.1" className={`aloc-input${formErrors.service_radius_km ? ' err' : ''}`} value={form.service_radius_km} onChange={e => { setForm(f => ({ ...f, service_radius_km: e.target.value })); setFormErrors(er => ({ ...er, service_radius_km: '' })); }} placeholder="e.g. 5" />
                  {formErrors.service_radius_km ? <span className="aloc-error">{formErrors.service_radius_km}</span> : <span className="aloc-hint">Determines delivery availability for customers.</span>}
                </div>
              </div>

              <div className="aloc-modal-footer">
                <button className="aloc-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="aloc-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? <><div className="aloc-spinner" /> Saving…</> : editTarget ? 'Update Zone' : 'Add Zone'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {deleteId && (
          <div className="aloc-confirm-overlay">
            <div className="aloc-confirm-box">
              <div className="aloc-confirm-icon"><TrashIcon /></div>
              <p className="aloc-confirm-title">Remove Location?</p>
              <p className="aloc-confirm-sub">This delivery zone will be permanently purged. Users in this area will lose service immediately.</p>
              <div className="aloc-confirm-btns">
                <button className="aloc-confirm-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="aloc-confirm-del" onClick={() => handleDelete(deleteId)}>Confirm Removal</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`aloc-toast ${toast.type}`}>{toast.msg}</div>}
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