'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';
import AddProduct from './AddProduct';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const GridIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
const ListIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);
const EyeIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EditIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const EyeOffIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const EyeOnIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const StarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const PackageIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const CloseIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SaveIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);

function getImages(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter(Boolean) : []; }
  catch { return []; }
}

function ProductImageSlider({ images, productName, height = 200 }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const startTimer = useCallback(() => {
    if (images.length <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % images.length), 1800);
  }, [images.length]);
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [startTimer]);
  if (!images.length) return (
    <div style={{ width: '100%', height, background: '#0c111a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a3040' }}><PackageIcon /></div>
  );
  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: '#0c111a' }}>
      {images.map((src, i) => (
        <img key={i} src={src} alt={`${productName} ${i + 1}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === current ? 1 : 0, transition: 'opacity 0.6s ease' }} />
      ))}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 2 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); startTimer(); }}
              style={{ width: i === current ? 16 : 6, height: 6, borderRadius: 3, background: i === current ? '#fb923c' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailModal({ product, session, onClose, onEdit }) {
  const images = getImages(product.images);
  const [tab, setTab] = useState('details');
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (product.product_variants) { setVariants(product.product_variants.filter(v => v.is_active !== false)); return; }
    setLoadingVariants(true);
    fetch(`${API_BASE}/api/products/${product.id}/variants`, { headers: { Authorization: `Bearer ${session?.accessToken}` } })
      .then(r => r.json()).then(data => setVariants(Array.isArray(data) ? data : []))
      .catch(() => {}).finally(() => setLoadingVariants(false));
  }, [product.id]);

  return (
    <>
      <style>{`
        .pdm-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:pdmFade 0.2s ease}
        @keyframes pdmFade{from{opacity:0}to{opacity:1}}
        .pdm-modal{background:#0a0d15;border:1px solid rgba(255,255,255,0.1);border-radius:22px;width:100%;max-width:820px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 32px 100px rgba(0,0,0,0.7);animation:pdmSlide 0.25s ease}
        @keyframes pdmSlide{from{opacity:0;transform:translateY(20px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .pdm-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0}
        .pdm-header-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#fff}
        .pdm-header-actions{display:flex;align-items:center;gap:0.5rem}
        .pdm-close-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);color:#9ca3af;cursor:pointer;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .pdm-close-btn:hover{background:rgba(255,255,255,0.1);color:#fff}
        .pdm-edit-btn{display:flex;align-items:center;gap:6px;padding:0 12px;height:32px;border-radius:9px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);color:#fb923c;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s}
        .pdm-edit-btn:hover{background:rgba(251,146,60,0.18)}
        .pdm-body{display:flex;overflow:hidden;flex:1;min-height:0}
        .pdm-left{width:320px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.07)}
        .pdm-right{flex:1;overflow-y:auto;padding:1.5rem;scrollbar-width:thin;scrollbar-color:rgba(251,146,60,0.2) transparent}
        .pdm-name{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;color:#fff;line-height:1.3;margin-bottom:0.5rem}
        .pdm-price{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#fb923c;margin-bottom:1rem}
        .pdm-meta-chips{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.25rem}
        .pdm-chip{padding:3px 10px;border-radius:5px;font-size:0.68rem;font-weight:600}
        .pdm-chip-cat{background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc}
        .pdm-chip-brand{background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2);color:#fb923c}
        .pdm-chip-featured{background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.25);color:#fbbf24;display:flex;align-items:center;gap:4px}
        .pdm-chip-inactive{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171}
        .pdm-stock-bar{background:rgba(13,16,24,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:0.9rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between}
        .pdm-stock-label{font-size:0.72rem;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:0.06em}
        .pdm-stock-value{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800}
        .pdm-stock-badge{padding:3px 9px;border-radius:5px;font-size:0.68rem;font-weight:700}
        .pdm-stock-in{background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25);color:#34d399}
        .pdm-stock-low{background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);color:#fbbf24}
        .pdm-stock-out{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171}
        .pdm-tabs{display:flex;gap:4px;margin-bottom:1.25rem;flex-wrap:wrap}
        .pdm-tab{padding:0.45rem 0.9rem;border-radius:8px;font-size:0.8rem;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid transparent;transition:all 0.15s;color:#6b7280;background:none}
        .pdm-tab.active{background:rgba(251,146,60,0.1);border-color:rgba(251,146,60,0.25);color:#fb923c}
        .pdm-tab:hover:not(.active){background:rgba(255,255,255,0.04);color:#9ca3af}
        .pdm-desc{font-size:0.85rem;color:#9ca3af;line-height:1.7}
        .pdm-extra-table{width:100%;border-collapse:collapse}
        .pdm-extra-table tr{border-bottom:1px solid rgba(255,255,255,0.05)}
        .pdm-extra-table tr:last-child{border-bottom:none}
        .pdm-extra-table td{padding:0.65rem 0.5rem;font-size:0.82rem;vertical-align:top}
        .pdm-extra-key{color:#6b7280;font-weight:600;font-size:0.75rem;width:130px}
        .pdm-extra-val{color:#d1d5db}
        .pdm-info-row{display:flex;justify-content:space-between;padding:0.55rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem}
        .pdm-info-row:last-child{border-bottom:none}
        .pdm-info-key{color:#4b5563;font-weight:500}
        .pdm-info-val{color:#d1d5db;text-align:right;max-width:60%}
        .pdm-slug{font-family:monospace;font-size:0.78rem;color:#6b7280;background:rgba(255,255,255,0.04);border-radius:5px;padding:2px 8px}
        .pdm-variants-grid{display:flex;flex-direction:column;gap:0.5rem}
        .pdm-variant-card{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.65rem 0.9rem;gap:1rem}
        .pdm-variant-name{font-size:0.85rem;font-weight:600;color:#e5e7eb;font-family:'DM Sans',sans-serif}
        .pdm-variant-meta{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .pdm-variant-price{font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:800;color:#fb923c}
        .pdm-variant-stock{font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:5px}
        @media(max-width:700px){.pdm-body{flex-direction:column}.pdm-left{width:100%;border-right:none;border-bottom:1px solid rgba(255,255,255,0.07)}}
      `}</style>
      <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pdm-modal">
          <div className="pdm-header">
            <span className="pdm-header-title">Product Details</span>
            <div className="pdm-header-actions">
              <button className="pdm-edit-btn" onClick={() => { onClose(); onEdit(product); }}><EditIcon /> Edit</button>
              <button className="pdm-close-btn" onClick={onClose}><CloseIcon /></button>
            </div>
          </div>
          <div className="pdm-body">
            <div className="pdm-left">
              <ProductImageSlider images={images} productName={product.name} height={280} />
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto' }}>
                  {images.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
            <div className="pdm-right">
              <div className="pdm-name">{product.name}</div>
              <div className="pdm-price">&#8377;{parseFloat(product.price).toFixed(2)}</div>
              <div className="pdm-meta-chips">
                {product.categories?.name && <span className="pdm-chip pdm-chip-cat">{product.categories.name}</span>}
                {product.manufacturers?.name && <span className="pdm-chip pdm-chip-brand">{product.manufacturers.name}</span>}
                {product.is_featured && <span className="pdm-chip pdm-chip-featured"><StarIcon /> Featured</span>}
                {product.is_active === false && <span className="pdm-chip pdm-chip-inactive">Hidden</span>}
                {variants.length > 0 && <span className="pdm-chip" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>}
              </div>
              <div className="pdm-stock-bar">
                <div>
                  <div className="pdm-stock-label">Base Stock</div>
                  <div className="pdm-stock-value" style={{ color: product.stock > 10 ? '#34d399' : product.stock > 0 ? '#fbbf24' : '#f87171' }}>{product.stock} units</div>
                </div>
                <span className={`pdm-stock-badge ${product.stock > 10 ? 'pdm-stock-in' : product.stock > 0 ? 'pdm-stock-low' : 'pdm-stock-out'}`}>
                  {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
              <div className="pdm-tabs">
                {['details', 'description', 'variants', 'specs'].map(t => (
                  <button key={t} className={`pdm-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}{t === 'variants' && variants.length > 0 && ` (${variants.length})`}
                  </button>
                ))}
              </div>
              {tab === 'details' && (
                <div>
                  {[
                    { key: 'Product ID', val: product.id },
                    { key: 'Slug', val: <span className="pdm-slug">{product.slug}</span> },
                    { key: 'Category', val: product.categories?.name || '—' },
                    { key: 'Brand', val: product.manufacturers?.name || '—' },
                    { key: 'Visible in store', val: product.is_active !== false ? 'Yes' : 'No (hidden)' },
                    { key: 'Created', val: product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                    { key: 'Images', val: `${images.length} image${images.length !== 1 ? 's' : ''}` },
                    { key: 'Variants', val: variants.length > 0 ? `${variants.length} variant${variants.length !== 1 ? 's' : ''}` : 'None' },
                  ].map(({ key, val }) => (
                    <div key={key} className="pdm-info-row"><span className="pdm-info-key">{key}</span><span className="pdm-info-val">{val}</span></div>
                  ))}
                </div>
              )}
              {tab === 'description' && <p className="pdm-desc">{product.description || 'No description provided.'}</p>}
              {tab === 'variants' && (
                <div className="pdm-variants-grid">
                  {loadingVariants ? <p style={{ color: '#4b5563', fontSize: '0.82rem' }}>Loading variants...</p>
                  : variants.length === 0 ? <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>No variants. Click Edit to add variants.</p>
                  : variants.map(v => {
                    const sc = v.stock > 10 ? '#34d399' : v.stock > 0 ? '#fbbf24' : '#f87171';
                    const sb = v.stock > 10 ? 'rgba(52,211,153,0.1)' : v.stock > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)';
                    const sbr = v.stock > 10 ? 'rgba(52,211,153,0.25)' : v.stock > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(239,68,68,0.25)';
                    return (
                      <div key={v.id} className="pdm-variant-card">
                        <span className="pdm-variant-name">{v.variant_name}</span>
                        <div className="pdm-variant-meta">
                          <span className="pdm-variant-price">&#8377;{parseFloat(v.price).toFixed(2)}</span>
                          <span className="pdm-variant-stock" style={{ background: sb, border: `1px solid ${sbr}`, color: sc }}>{v.stock} left</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {tab === 'specs' && (
                product.extra_details && Object.keys(product.extra_details).length > 0
                  ? <table className="pdm-extra-table"><tbody>{Object.entries(product.extra_details).map(([k, v]) => (<tr key={k}><td className="pdm-extra-key">{k}</td><td className="pdm-extra-val">{v}</td></tr>))}</tbody></table>
                  : <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>No specifications added.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminProducts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [stockEdit, setStockEdit]     = useState({});
  const [stockSaving, setStockSaving] = useState(null);
  const [toast, setToast]             = useState(null);
  const [viewMode, setViewMode]       = useState('grid');
  const [confirmAction, setConfirmAction] = useState(null);
  const LIMIT = 12;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  const fetchProducts = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, sort: 'created_at', order: 'desc', include_inactive: 'true' });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${API_BASE}/api/products?${params}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const json = await res.json();
      setProducts(json.data || []);
      setTotal(json.count || 0);
    } catch { showToast('error', 'Failed to load products'); }
    finally { setLoading(false); }
  }, [session, page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3200); }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(t => t - 1);
      showToast('success', 'Product permanently deleted');
    } catch (err) { showToast('error', err.message); }
    finally { setConfirmAction(null); }
  }

  async function handleDeactivate(id) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/deactivate`, { method: 'PATCH', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (!res.ok) throw new Error('Failed to deactivate');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
      showToast('success', 'Product hidden from store');
    } catch (err) { showToast('error', err.message); }
    finally { setConfirmAction(null); }
  }

  async function handleActivate(id) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/activate`, { method: 'PATCH', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (!res.ok) throw new Error('Failed to activate');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: true } : p));
      showToast('success', 'Product is now visible in store');
    } catch (err) { showToast('error', err.message); }
    finally { setConfirmAction(null); }
  }

  async function runConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') await handleDelete(confirmAction.id);
    else if (confirmAction.type === 'deactivate') await handleDeactivate(confirmAction.id);
    else if (confirmAction.type === 'activate') await handleActivate(confirmAction.id);
  }

  async function saveStock(product) {
    const newStock = parseInt(stockEdit[product.id]);
    if (isNaN(newStock) || newStock < 0) return;
    setStockSaving(product.id);
    try {
      const res = await fetch(`${API_BASE}/api/products/${product.id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ stock: newStock }) });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      setStockEdit(prev => { const n = { ...prev }; delete n[product.id]; return n; });
      showToast('success', 'Stock updated');
    } catch { showToast('error', 'Stock update failed'); }
    finally { setStockSaving(null); }
  }

  function handleSaveSuccess(product, mode) {
    if (mode === 'created') { setProducts(prev => [product, ...prev]); setTotal(t => t + 1); }
    else { setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...product } : p)); }
    setShowAdd(false); setEditTarget(null);
    showToast('success', `Product ${mode}!`);
  }

  const totalPages = Math.ceil(total / LIMIT);
  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  const confirmConfig = confirmAction ? {
    delete: { icon: '🗑️', iconBg: 'rgba(239,68,68,0.1)', iconBorder: 'rgba(239,68,68,0.25)', title: 'Permanently Delete Product?', sub: `"${confirmAction.name}" will be removed from the database forever. All variants will also be deleted. This cannot be undone.`, btnLabel: 'Delete Forever', btnStyle: { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' } },
    deactivate: { icon: '👁️', iconBg: 'rgba(251,146,60,0.1)', iconBorder: 'rgba(251,146,60,0.25)', title: 'Hide from Store?', sub: `"${confirmAction.name}" will be hidden from customers. All data is preserved. You can re-activate it any time.`, btnLabel: 'Hide Product', btnStyle: { background: 'rgba(251,146,60,0.12)', borderColor: 'rgba(251,146,60,0.3)', color: '#fed7aa' } },
    activate: { icon: '✅', iconBg: 'rgba(52,211,153,0.1)', iconBorder: 'rgba(52,211,153,0.25)', title: 'Make Visible in Store?', sub: `"${confirmAction.name}" will become visible to customers immediately.`, btnLabel: 'Activate', btnStyle: { background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)', color: '#6ee7b7' } },
  }[confirmAction.type] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .apr-root{min-height:100vh;background:#060810;font-family:'DM Sans',sans-serif;position:relative;overflow-x:hidden}
        .apr-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 70% 50% at 100% 0%,rgba(251,146,60,0.06) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 0% 100%,rgba(251,146,60,0.04) 0%,transparent 65%)}
        .apr-grid-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(251,146,60,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(251,146,60,0.02) 1px,transparent 1px);background-size:64px 64px}
        .apr-main{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:1.5rem 1.5rem 4rem}
        .apr-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .apr-page-title{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-0.04em}
        .apr-page-sub{font-size:0.875rem;color:#4b5563;margin-top:0.25rem}
        .apr-add-btn{display:flex;align-items:center;gap:7px;padding:0.58rem 1.2rem;border-radius:11px;background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.35);color:#fb923c;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:background 0.15s}
        .apr-add-btn:hover{background:rgba(251,146,60,0.2)}
        .apr-toolbar{display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap}
        .apr-search{flex:1;min-width:200px;max-width:380px;background:rgba(13,16,24,0.8);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:0.58rem 1rem;color:#e5e7eb;font-family:'DM Sans',sans-serif;font-size:0.875rem;outline:none;transition:border-color 0.2s}
        .apr-search:focus{border-color:rgba(251,146,60,0.4)}
        .apr-search::placeholder{color:#4b5563}
        .apr-view-toggle{display:flex;border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden}
        .apr-view-btn{padding:0.5rem 0.75rem;background:transparent;border:none;color:#4b5563;cursor:pointer;transition:background 0.15s,color 0.15s;display:flex;align-items:center;gap:5px;font-size:0.78rem;font-family:'DM Sans',sans-serif}
        .apr-view-btn.active{background:rgba(251,146,60,0.1);color:#fb923c}
        .apr-count{background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.25);border-radius:6px;padding:4px 10px;font-size:0.72rem;color:#fb923c;font-weight:600}
        .apr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
        .apr-card{background:rgba(13,16,24,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;transition:border-color 0.2s,transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column}
        .apr-card:hover{border-color:rgba(251,146,60,0.22);transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.4)}
        .apr-card.inactive{opacity:0.65;border-color:rgba(239,68,68,0.15)}
        .apr-card.inactive:hover{border-color:rgba(239,68,68,0.3)}
        .apr-img-area{position:relative;overflow:hidden}
        .apr-featured-badge{position:absolute;top:10px;left:10px;z-index:3;background:rgba(234,179,8,0.9);color:white;border-radius:6px;padding:3px 9px;font-size:0.62rem;font-weight:700;display:flex;align-items:center;gap:4px}
        .apr-hidden-badge{position:absolute;top:10px;left:10px;z-index:3;background:rgba(239,68,68,0.85);color:white;border-radius:6px;padding:3px 9px;font-size:0.62rem;font-weight:700}
        .apr-stock-badge{position:absolute;top:10px;right:10px;z-index:3;border-radius:6px;padding:3px 8px;font-size:0.62rem;font-weight:700}
        .apr-stock-in{background:rgba(52,211,153,0.9);color:#022c22}
        .apr-stock-low{background:rgba(251,191,36,0.9);color:#451a03}
        .apr-stock-out{background:rgba(239,68,68,0.9);color:#fff}
        .apr-card-body{padding:1.1rem 1.15rem;display:flex;flex-direction:column;gap:0.65rem;flex:1}
        .apr-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem}
        .apr-card-name{font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:700;color:#f3f4f6;line-height:1.3;flex:1}
        .apr-price{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#fb923c;flex-shrink:0}
        .apr-tags{display:flex;gap:0.35rem;flex-wrap:wrap}
        .apr-tag{padding:2px 8px;border-radius:4px;font-size:0.66rem;font-weight:500;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#9ca3af}
        .apr-tag-variant{background:rgba(52,211,153,0.07);border-color:rgba(52,211,153,0.2);color:#34d399}
        .apr-stock-row{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.65rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:9px}
        .apr-stock-label{font-size:0.68rem;color:#6b7280;font-weight:600;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em}
        .apr-stock-input{flex:1;min-width:0;max-width:64px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:3px 7px;color:#e5e7eb;font-family:'DM Sans',sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.15s}
        .apr-stock-input:focus{border-color:rgba(251,146,60,0.4)}
        .apr-stock-save{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:6px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.25);color:#fb923c;font-size:0.7rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:background 0.15s}
        .apr-stock-save:hover:not(:disabled){background:rgba(251,146,60,0.2)}
        .apr-stock-save:disabled{opacity:0.4;cursor:not-allowed}
        /* 4-button action row — never wraps */
        .apr-card-actions{display:flex;gap:0.35rem;margin-top:auto;flex-wrap:nowrap;align-items:stretch;min-width:0}
        .apr-view-action{display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0;padding:0.45rem 0.3rem;border-radius:8px;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.18);color:#a5b4fc;font-size:0.7rem;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;overflow:hidden;white-space:nowrap}
        .apr-view-action:hover{background:rgba(99,102,241,0.14)}
        .apr-edit-action{display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0;padding:0.45rem 0.3rem;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#9ca3af;font-size:0.7rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;overflow:hidden;white-space:nowrap}
        .apr-edit-action:hover{background:rgba(255,255,255,0.08);color:#e5e7eb}
        .apr-toggle-action{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:30px;padding:0;border-radius:8px;cursor:pointer;transition:all 0.15s}
        .apr-toggle-action.do-hide{background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.15);color:#fb923c}
        .apr-toggle-action.do-hide:hover{background:rgba(251,146,60,0.14)}
        .apr-toggle-action.do-show{background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.2);color:#34d399}
        .apr-toggle-action.do-show:hover{background:rgba(52,211,153,0.14)}
        .apr-del-action{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:30px;padding:0;border-radius:8px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);color:#f87171;cursor:pointer;transition:all 0.15s}
        .apr-del-action:hover{background:rgba(239,68,68,0.14)}
        /* List mode */
        .apr-list{display:flex;flex-direction:column;gap:0.6rem}
        .apr-list-row{background:rgba(13,16,24,0.8);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;display:flex;align-items:stretch;transition:border-color 0.18s}
        .apr-list-row:hover{border-color:rgba(251,146,60,0.18)}
        .apr-list-row.inactive{opacity:0.6;border-color:rgba(239,68,68,0.12)}
        .apr-list-img-wrap{width:80px;flex-shrink:0}
        .apr-list-body{flex:1;padding:0.9rem 1.1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;min-width:0}
        .apr-list-info{flex:1;min-width:0}
        .apr-list-name{font-family:'Syne',sans-serif;font-size:0.88rem;font-weight:700;color:#f3f4f6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px}
        .apr-list-sub{font-size:0.74rem;color:#6b7280}
        .apr-list-price{font-family:'Syne',sans-serif;font-size:0.95rem;font-weight:800;color:#fb923c;flex-shrink:0}
        .apr-list-actions{display:flex;gap:0.4rem;flex-shrink:0}
        .apr-list-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;font-size:0.75rem;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid;transition:all 0.15s}
        /* Confirm */
        .apr-confirm-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:1rem}
        .apr-confirm-box{background:#0a0d15;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:2rem;max-width:400px;width:100%;text-align:center}
        .apr-confirm-icon{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.3rem}
        .apr-confirm-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:#fff;margin-bottom:0.5rem}
        .apr-confirm-sub{font-size:0.82rem;color:#6b7280;margin-bottom:1.5rem;line-height:1.6}
        .apr-confirm-btns{display:flex;gap:0.75rem;justify-content:center}
        .apr-confirm-cancel{padding:0.55rem 1.2rem;border-radius:9px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:#9ca3af;font-size:0.875rem;cursor:pointer;font-family:'DM Sans',sans-serif}
        .apr-confirm-action{padding:0.55rem 1.3rem;border-radius:9px;font-size:0.875rem;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;border:1px solid}
        /* Pagination */
        .apr-pag{display:flex;align-items:center;justify-content:space-between;margin-top:1.75rem;flex-wrap:wrap;gap:0.75rem}
        .apr-pag-info{font-size:0.8rem;color:#6b7280}
        .apr-pag-btns{display:flex;gap:0.5rem}
        .apr-pag-btn{padding:5px 14px;border-radius:8px;background:rgba(13,16,24,0.8);border:1px solid rgba(255,255,255,0.08);color:#9ca3af;font-size:0.8rem;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif}
        .apr-pag-btn:hover:not(:disabled){border-color:rgba(251,146,60,0.3);color:#fb923c}
        .apr-pag-btn:disabled{opacity:0.3;cursor:not-allowed}
        .apr-pag-cur{padding:5px 14px;border-radius:8px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);color:#fb923c;font-size:0.8rem}
        .apr-empty{text-align:center;padding:4rem;background:rgba(13,16,24,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:18px}
        .apr-empty-icon{width:60px;height:60px;border-radius:50%;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#374151}
        .apr-toast{position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;padding:0.75rem 1.2rem;border-radius:10px;font-size:0.875rem;font-family:'DM Sans',sans-serif;border:1px solid;backdrop-filter:blur(12px);animation:aprUp 0.25s ease}
        .apr-toast.success{background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.3);color:#6ee7b7}
        .apr-toast.error{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#fca5a5}
        @keyframes aprUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:640px){
          .apr-main{padding:1rem 1rem 3rem}
          .apr-grid{grid-template-columns:repeat(2,1fr);gap:0.6rem}
          .apr-card-body{padding:0.7rem 0.75rem;gap:0.5rem}
          .apr-view-action .apr-btn-label,.apr-edit-action .apr-btn-label{display:none}
          .apr-view-action,.apr-edit-action{flex:1;padding:0.42rem 0}
          .apr-toggle-action,.apr-del-action{width:27px}
          .apr-card-name{font-size:0.78rem}
          .apr-price{font-size:0.88rem}
        }
        @media(max-width:380px){.apr-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="apr-root">
        <div className="apr-bg" /><div className="apr-grid-bg" />
        <AdminNav />
        <main className="apr-main">
          <div className="apr-page-header">
            <div>
              <h1 className="apr-page-title">Products</h1>
              <p className="apr-page-sub">Manage your product catalog, stock, and listings.</p>
            </div>
            <button className="apr-add-btn" onClick={() => setShowAdd(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Product
            </button>
          </div>
          <div className="apr-toolbar">
            <input className="apr-search" placeholder="Search products by name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <div className="apr-view-toggle">
              <button className={`apr-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}><GridIcon /> Grid</button>
              <button className={`apr-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}><ListIcon /> List</button>
            </div>
            <span className="apr-count">{total} product{total !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="apr-empty"><div className="apr-empty-icon"><PackageIcon /></div><p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Loading products...</p></div>
          ) : products.length === 0 ? (
            <div className="apr-empty"><div className="apr-empty-icon"><PackageIcon /></div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>No products found</p>
              <p style={{ fontSize: '0.82rem', color: '#4b5563' }}>{search ? 'Try a different search.' : 'Add your first product to get started.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="apr-grid">
              {products.map(p => {
                const imgs = getImages(p.images);
                const stockVal = stockEdit[p.id] !== undefined ? stockEdit[p.id] : String(p.stock);
                const variantCount = p.product_variants?.filter(v => v.is_active !== false).length || 0;
                const isActive = p.is_active !== false;
                return (
                  <div key={p.id} className={`apr-card${!isActive ? ' inactive' : ''}`}>
                    <div className="apr-img-area">
                      <ProductImageSlider images={imgs} productName={p.name} height={195} />
                      {!isActive ? <span className="apr-hidden-badge">Hidden</span>
                        : p.is_featured && <span className="apr-featured-badge"><StarIcon /> Featured</span>}
                      <span className={`apr-stock-badge ${p.stock > 10 ? 'apr-stock-in' : p.stock > 0 ? 'apr-stock-low' : 'apr-stock-out'}`}>
                        {p.stock > 10 ? `${p.stock} in stock` : p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="apr-card-body">
                      <div className="apr-card-top">
                        <span className="apr-card-name">{p.name}</span>
                        <span className="apr-price">&#8377;{parseFloat(p.price).toFixed(0)}</span>
                      </div>
                      <div className="apr-tags">
                        {p.categories?.name && <span className="apr-tag">{p.categories.name}</span>}
                        {p.manufacturers?.name && <span className="apr-tag">{p.manufacturers.name}</span>}
                        {variantCount > 0 && <span className="apr-tag apr-tag-variant">{variantCount} variant{variantCount !== 1 ? 's' : ''}</span>}
                      </div>
                      <div className="apr-stock-row">
                        <span className="apr-stock-label">Stock</span>
                        <input type="number" min="0" className="apr-stock-input" value={stockVal} onChange={e => setStockEdit(prev => ({ ...prev, [p.id]: e.target.value }))} />
                        {stockEdit[p.id] !== undefined && stockEdit[p.id] !== String(p.stock) && (
                          <button className="apr-stock-save" onClick={() => saveStock(p)} disabled={stockSaving === p.id}>
                            {stockSaving === p.id ? '...' : <><SaveIcon /> Save</>}
                          </button>
                        )}
                      </div>
                      <div className="apr-card-actions">
                        <button className="apr-view-action" onClick={() => setViewProduct(p)} title="View details">
                          <EyeIcon /><span className="apr-btn-label">Details</span>
                        </button>
                        <button className="apr-edit-action" onClick={() => setEditTarget(p)} title="Edit product">
                          <EditIcon /><span className="apr-btn-label">Edit</span>
                        </button>
                        <button
                          title={isActive ? 'Hide from store' : 'Show in store'}
                          className={`apr-toggle-action ${isActive ? 'do-hide' : 'do-show'}`}
                          onClick={() => setConfirmAction({ type: isActive ? 'deactivate' : 'activate', id: p.id, name: p.name })}
                        >
                          {isActive ? <EyeOffIcon /> : <EyeOnIcon />}
                        </button>
                        <button title="Permanently delete" className="apr-del-action" onClick={() => setConfirmAction({ type: 'delete', id: p.id, name: p.name })}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="apr-list">
              {products.map(p => {
                const imgs = getImages(p.images);
                const variantCount = p.product_variants?.filter(v => v.is_active !== false).length || 0;
                const isActive = p.is_active !== false;
                return (
                  <div key={p.id} className={`apr-list-row${!isActive ? ' inactive' : ''}`}>
                    <div className="apr-list-img-wrap"><ProductImageSlider images={imgs} productName={p.name} height={80} /></div>
                    <div className="apr-list-body">
                      <div className="apr-list-info">
                        <div className="apr-list-name">
                          {!isActive && <span style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: 700, marginRight: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '1px 5px' }}>HIDDEN</span>}
                          {p.name}
                        </div>
                        <div className="apr-list-sub">{p.categories?.name}{p.categories?.name && p.manufacturers?.name && ' · '}{p.manufacturers?.name}{variantCount > 0 && ` · ${variantCount} variant${variantCount !== 1 ? 's' : ''}`}</div>
                      </div>
                      <span className="apr-list-price">&#8377;{parseFloat(p.price).toFixed(0)}</span>
                      <span className={`apr-stock-badge ${p.stock > 10 ? 'apr-stock-in' : p.stock > 0 ? 'apr-stock-low' : 'apr-stock-out'}`} style={{ borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                        {p.stock > 0 ? `${p.stock} left` : 'Out'}
                      </span>
                      <div className="apr-list-actions">
                        <button className="apr-list-btn" style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }} onClick={() => setViewProduct(p)}><EyeIcon /> View</button>
                        <button className="apr-list-btn" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#9ca3af' }} onClick={() => setEditTarget(p)}><EditIcon /> Edit</button>
                        <button className="apr-list-btn"
                          style={isActive ? { background: 'rgba(251,146,60,0.07)', borderColor: 'rgba(251,146,60,0.2)', color: '#fb923c' } : { background: 'rgba(52,211,153,0.07)', borderColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}
                          onClick={() => setConfirmAction({ type: isActive ? 'deactivate' : 'activate', id: p.id, name: p.name })}>
                          {isActive ? <><EyeOffIcon /> Hide</> : <><EyeOnIcon /> Show</>}
                        </button>
                        <button className="apr-list-btn" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '5px 9px' }} onClick={() => setConfirmAction({ type: 'delete', id: p.id, name: p.name })}><TrashIcon /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="apr-pag">
              <span className="apr-pag-info">Showing {(page-1)*LIMIT+1}-{Math.min(page*LIMIT,total)} of {total}</span>
              <div className="apr-pag-btns">
                <button className="apr-pag-btn" onClick={() => setPage(p => p-1)} disabled={page===1}>Prev</button>
                <span className="apr-pag-cur">{page} / {totalPages}</span>
                <button className="apr-pag-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>Next</button>
              </div>
            </div>
          )}
        </main>

        {viewProduct && <ProductDetailModal product={viewProduct} session={session} onClose={() => setViewProduct(null)} onEdit={p => setEditTarget(p)} />}
        {(showAdd || editTarget) && <AddProduct session={session} editProduct={editTarget} onSuccess={handleSaveSuccess} onClose={() => { setShowAdd(false); setEditTarget(null); }} />}

        {confirmAction && confirmConfig && (
          <div className="apr-confirm-overlay">
            <div className="apr-confirm-box">
              <div className="apr-confirm-icon" style={{ background: confirmConfig.iconBg, border: `1px solid ${confirmConfig.iconBorder}` }}>
                {confirmConfig.icon}
              </div>
              <p className="apr-confirm-title">{confirmConfig.title}</p>
              <p className="apr-confirm-sub">{confirmConfig.sub}</p>
              <div className="apr-confirm-btns">
                <button className="apr-confirm-cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button className="apr-confirm-action" style={confirmConfig.btnStyle} onClick={runConfirmAction}>{confirmConfig.btnLabel}</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`apr-toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}

function FullPageSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(251,146,60,0.15)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}