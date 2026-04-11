'use client';

import { useEffect, useState, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'blinkbasket';

export default function AddProduct({ session, onSuccess, onClose, editProduct = null }) {
  const isEdit    = !!editProduct;
  const fileInputRef = useRef(null);

  const [categories, setCategories]       = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [saving, setSaving]               = useState(false);
  const [errors, setErrors]               = useState({});
  const [uploadingImg, setUploadingImg]   = useState(false);
  const [uploadedImages, setUploadedImages] = useState(() => {
    if (!editProduct?.images) return [];
    try {
      return Array.isArray(editProduct.images) ? editProduct.images : JSON.parse(editProduct.images || '[]');
    } catch { return []; }
  });

  // ── Variants state ──────────────────────────────────────────
  const [variants, setVariants] = useState([]);
  const [variantSaving, setVariantSaving] = useState(null);
  const [variantDeleting, setVariantDeleting] = useState(null);
  const [newVariant, setNewVariant] = useState({ variant_name: '', price: '', stock: '' });
  const [variantError, setVariantError] = useState('');
  const [variantAdding, setVariantAdding] = useState(false);

  const [form, setForm] = useState(() => ({
    name:            editProduct?.name            || '',
    slug:            editProduct?.slug            || '',
    description:     editProduct?.description     || '',
    price:           editProduct?.price           || '',
    stock:           editProduct?.stock           ?? '',
    category_id:     editProduct?.category_id     || '',
    manufacturer_id: editProduct?.manufacturer_id || '',
    is_featured:     editProduct?.is_featured     || false,
    extra_details: editProduct?.extra_details
      ? Object.entries(editProduct.extra_details).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }]
  }));

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, mfgRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories`),
          fetch(`${API_BASE}/api/manufacturers`),
        ]);
        const catData = await catRes.json();
        const mfgData = await mfgRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
        setManufacturers(Array.isArray(mfgData) ? mfgData : []);
      } catch { /* ignore */ }
    }
    loadMeta();
  }, []);

  // Load existing variants when editing
  useEffect(() => {
    if (!isEdit || !editProduct?.id) return;
    async function loadVariants() {
      try {
        const res = await fetch(`${API_BASE}/api/products/${editProduct.id}/variants`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVariants(Array.isArray(data) ? data : []);
        }
      } catch { /* ignore */ }
    }
    loadVariants();
  }, [isEdit, editProduct?.id, session]);

  function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && !isEdit ? { slug: slugify(value) } : {}),
    }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  }

  async function handleImageFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(er => ({ ...er, images: 'Image must be under 5MB' }));
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setErrors(er => ({ ...er, images: 'Only JPG, PNG, WEBP, GIF allowed' }));
      return;
    }
    setErrors(er => ({ ...er, images: '' }));
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || 'Upload failed');
      }
      const data = await res.json();
      if (!data.secure_url) throw new Error('No URL returned from Cloudinary');
      setUploadedImages(prev => [...prev, data.secure_url]);
    } catch (err) {
      setErrors(er => ({ ...er, images: `Upload failed: ${err.message}` }));
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage(idx) {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Variant handlers ────────────────────────────────────────
  async function handleAddVariant() {
    setVariantError('');
    if (!newVariant.variant_name.trim()) { setVariantError('Variant name is required'); return; }
    if (!newVariant.price || isNaN(Number(newVariant.price)) || Number(newVariant.price) <= 0) { setVariantError('Valid price required'); return; }
    if (newVariant.stock === '' || isNaN(Number(newVariant.stock)) || Number(newVariant.stock) < 0) { setVariantError('Valid stock required'); return; }

    setVariantAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${editProduct.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({
          variant_name: newVariant.variant_name.trim(),
          price: parseFloat(newVariant.price),
          stock: parseInt(newVariant.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add variant');
      setVariants(prev => [...prev, data]);
      setNewVariant({ variant_name: '', price: '', stock: '' });
    } catch (err) {
      setVariantError(err.message);
    } finally {
      setVariantAdding(false);
    }
  }

  async function handleUpdateVariant(variant) {
    setVariantSaving(variant.id);
    try {
      const res = await fetch(`${API_BASE}/api/variants/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({
          variant_name: variant.variant_name,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock),
          is_active: variant.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update variant');
      setVariants(prev => prev.map(v => v.id === variant.id ? data : v));
    } catch (err) {
      setVariantError(err.message);
    } finally {
      setVariantSaving(null);
    }
  }

  async function handleDeleteVariant(id) {
    setVariantDeleting(id);
    try {
      const res = await fetch(`${API_BASE}/api/variants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete variant');
      setVariants(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setVariantError(err.message);
    } finally {
      setVariantDeleting(null);
    }
  }

  function updateVariantField(id, field, value) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.slug.trim())  errs.slug  = 'Slug is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = 'Valid price required';
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0) errs.stock = 'Valid stock required';
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = {
      name:            form.name.trim(),
      slug:            form.slug.trim(),
      description:     form.description.trim() || null,
      price:           parseFloat(form.price),
      stock:           parseInt(form.stock),
      is_featured:     form.is_featured,
      category_id:     form.category_id     || null,
      manufacturer_id: form.manufacturer_id || null,
      images:          uploadedImages.length ? uploadedImages : null,
      extra_details: form.extra_details.length
        ? Object.fromEntries(
            form.extra_details
              .filter(item => item.key && item.value)
              .map(item => [item.key, item.value])
          )
        : null,
    };
    try {
      const url    = isEdit ? `${API_BASE}/api/products/${editProduct.id}` : `${API_BASE}/api/products`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSuccess(data, isEdit ? 'updated' : 'created');
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .ap-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.78); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .ap-modal {
          background: #0d1018; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; width: 100%; max-width: 640px;
          max-height: 92vh; overflow-y: auto; padding: 2rem 2.2rem;
          scrollbar-width: thin; scrollbar-color: rgba(251,146,60,0.25) transparent;
        }
        .ap-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.6rem; }
        .ap-title { font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 800; color: #fff; }
        .ap-close {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          color: #6b7280; cursor: pointer; width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
          transition: background 0.15s, color 0.15s;
        }
        .ap-close:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }

        .ap-divider {
          font-size: 0.67rem; font-weight: 700; color: #374151; text-transform: uppercase;
          letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.6rem;
          margin: 1.4rem 0 1rem;
        }
        .ap-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

        .ap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
        .ap-full { grid-column: 1 / -1; }
        .ap-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .ap-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
        .ap-input, .ap-textarea, .ap-select {
          background: #141920; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.58rem 0.85rem;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
        }
        .ap-input:focus, .ap-textarea:focus, .ap-select:focus {
          border-color: rgba(251,146,60,0.5); box-shadow: 0 0 0 3px rgba(251,146,60,0.07);
        }
        .ap-input.err, .ap-textarea.err, .ap-select.err { border-color: rgba(239,68,68,0.45); }
        .ap-textarea { resize: vertical; min-height: 78px; line-height: 1.55; }
        .ap-error { font-size: 0.71rem; color: #f87171; }
        .ap-hint  { font-size: 0.69rem; color: #4b5563; }
        .ap-select option { background: #141920; }

        /* IMAGE UPLOAD */
        .ap-img-wrap { display: flex; flex-direction: column; gap: 0.7rem; }
        .ap-img-row { display: flex; flex-wrap: wrap; gap: 0.55rem; }
        .ap-thumb {
          position: relative; width: 82px; height: 82px; border-radius: 10px;
          overflow: hidden; border: 1px solid rgba(255,255,255,0.09); flex-shrink: 0;
        }
        .ap-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ap-thumb-del {
          position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
          border-radius: 50%; background: rgba(0,0,0,0.7); border: none;
          color: #fff; font-size: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: background 0.15s;
        }
        .ap-thumb-del:hover { background: rgba(239,68,68,0.85); }
        .ap-spin-box {
          width: 82px; height: 82px; border-radius: 10px;
          border: 1px dashed rgba(251,146,60,0.3); background: rgba(251,146,60,0.04);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        }
        .ap-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(251,146,60,0.15);
          border-top-color: #fb923c; border-radius: 50%; animation: apSpin 0.7s linear infinite;
        }
        @keyframes apSpin { to { transform: rotate(360deg); } }
        .ap-spinner-label { font-size: 0.58rem; color: #fb923c; }

        .ap-upload-zone {
          width: 100%; padding: 1.4rem 1rem;
          border: 1px dashed rgba(255,255,255,0.09); border-radius: 11px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.35rem; cursor: pointer; background: rgba(255,255,255,0.012);
          transition: border-color 0.2s, background 0.2s;
        }
        .ap-upload-zone:hover { border-color: rgba(251,146,60,0.3); background: rgba(251,146,60,0.03); }
        .ap-upload-zone-icon { font-size: 1.75rem; }
        .ap-upload-zone-text { font-size: 0.8rem; color: #9ca3af; font-family: 'DM Sans', sans-serif; }
        .ap-upload-zone-hint { font-size: 0.7rem; color: #4b5563; }
        .ap-add-img-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 1rem; border-radius: 8px; cursor: pointer;
          background: rgba(251,146,60,0.08); border: 1px dashed rgba(251,146,60,0.28);
          color: #fb923c; font-size: 0.78rem; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; width: fit-content;
        }
        .ap-add-img-btn:hover:not(:disabled) { background: rgba(251,146,60,0.15); }
        .ap-add-img-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* CHECKBOX */
        .ap-check-row { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
        .ap-checkbox { width: 16px; height: 16px; accent-color: #fb923c; cursor: pointer; }
        .ap-check-label { font-size: 0.875rem; color: #d1d5db; font-family: 'DM Sans', sans-serif; }

        /* ── VARIANTS ── */
        .ap-variants-wrap { display: flex; flex-direction: column; gap: 0.6rem; }
        .ap-variant-info { font-size: 0.75rem; color: #4b5563; margin-bottom: 0.2rem; font-family: 'DM Sans', sans-serif; }
        .ap-variant-note { font-size: 0.72rem; color: #374151; background: rgba(251,146,60,0.05); border: 1px solid rgba(251,146,60,0.12); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; }

        /* Existing variant row */
        .ap-variant-row {
          display: grid; grid-template-columns: 1fr 90px 80px auto;
          gap: 0.5rem; align-items: center;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 0.5rem 0.6rem;
        }
        .ap-variant-input {
          background: #141920; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px; padding: 0.4rem 0.6rem;
          color: #e5e7eb; font-family: 'DM Sans', sans-serif; font-size: 0.8rem;
          outline: none; width: 100%; transition: border-color 0.15s;
        }
        .ap-variant-input:focus { border-color: rgba(251,146,60,0.4); }
        .ap-variant-actions { display: flex; gap: 0.35rem; }
        .ap-variant-save {
          padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25);
          color: #fb923c; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; white-space: nowrap;
        }
        .ap-variant-save:hover:not(:disabled) { background: rgba(251,146,60,0.2); }
        .ap-variant-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .ap-variant-del {
          padding: 0.35rem 0.55rem; border-radius: 6px; font-size: 0.7rem;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          color: #f87171; cursor: pointer; transition: background 0.15s;
        }
        .ap-variant-del:hover:not(:disabled) { background: rgba(239,68,68,0.15); }
        .ap-variant-del:disabled { opacity: 0.4; cursor: not-allowed; }
        .ap-variant-label { font-size: 0.62rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }

        /* New variant row */
        .ap-new-variant {
          display: grid; grid-template-columns: 1fr 90px 80px auto;
          gap: 0.5rem; align-items: flex-end;
          border: 1px dashed rgba(251,146,60,0.2); border-radius: 10px; padding: 0.6rem;
          background: rgba(251,146,60,0.02);
        }
        .ap-new-variant-field { display: flex; flex-direction: column; gap: 3px; }
        .ap-variant-add-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 0.42rem 0.85rem; border-radius: 7px; font-size: 0.75rem; font-weight: 600;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.3);
          color: #fb923c; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; white-space: nowrap; align-self: flex-end;
        }
        .ap-variant-add-btn:hover:not(:disabled) { background: rgba(251,146,60,0.22); }
        .ap-variant-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ap-variant-err { font-size: 0.71rem; color: #f87171; }
        .ap-variant-empty { font-size: 0.78rem; color: #374151; text-align: center; padding: 0.6rem; font-family: 'DM Sans', sans-serif; }

        /* FOOTER */
        .ap-footer { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.6rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .ap-btn-cancel {
          padding: 0.62rem 1.4rem; border-radius: 10px; background: transparent;
          border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 0.875rem;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s, color 0.15s;
        }
        .ap-btn-cancel:hover { background: rgba(255,255,255,0.06); color: #e5e7eb; }
        .ap-btn-save {
          padding: 0.62rem 1.75rem; border-radius: 10px;
          background: rgba(251,146,60,0.14); border: 1px solid rgba(251,146,60,0.4);
          color: #fb923c; font-size: 0.875rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .ap-btn-save:hover:not(:disabled) { background: rgba(251,146,60,0.24); }
        .ap-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .ap-global-err {
          background: rgba(239,68,68,0.09); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 9px; padding: 0.6rem 0.9rem;
          font-size: 0.82rem; color: #fca5a5; margin-bottom: 1rem; font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 540px) {
          .ap-grid { grid-template-columns: 1fr; }
          .ap-full { grid-column: 1; }
          .ap-modal { padding: 1.5rem 1.25rem; }
          .ap-variant-row { grid-template-columns: 1fr 70px 65px auto; }
          .ap-new-variant { grid-template-columns: 1fr 70px 65px auto; }
        }
      `}</style>

      <div className="ap-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="ap-modal">
          <div className="ap-header">
            <span className="ap-title">{isEdit ? '✏️ Edit Product' : '＋ Add Product'}</span>
            <button className="ap-close" onClick={onClose}>✕</button>
          </div>

          {errors._global && <div className="ap-global-err">⚠ {errors._global}</div>}

          {/* BASIC INFO */}
          <div className="ap-divider">Basic Info</div>
          <div className="ap-grid">
            <div className="ap-field ap-full">
              <label className="ap-label">Product Name *</label>
              <input name="name" className={`ap-input${errors.name ? ' err' : ''}`} value={form.name} onChange={handleChange} placeholder="e.g. Organic Basmati Rice" />
              {errors.name && <span className="ap-error">{errors.name}</span>}
            </div>
            <div className="ap-field ap-full">
              <label className="ap-label">Slug *</label>
              <input name="slug" className={`ap-input${errors.slug ? ' err' : ''}`} value={form.slug} onChange={handleChange} placeholder="organic-basmati-rice" />
              {errors.slug && <span className="ap-error">{errors.slug}</span>}
              <span className="ap-hint">Auto-generated · must be URL-safe and unique</span>
            </div>
            <div className="ap-field">
              <label className="ap-label">Base Price (₹) *</label>
              <input name="price" type="number" step="0.01" min="0.01" className={`ap-input${errors.price ? ' err' : ''}`} value={form.price} onChange={handleChange} placeholder="0.00" />
              {errors.price && <span className="ap-error">{errors.price}</span>}
            </div>
            <div className="ap-field">
              <label className="ap-label">Base Stock *</label>
              <input name="stock" type="number" min="0" className={`ap-input${errors.stock ? ' err' : ''}`} value={form.stock} onChange={handleChange} placeholder="0" />
              {errors.stock && <span className="ap-error">{errors.stock}</span>}
            </div>
            <div className="ap-field">
              <label className="ap-label">Category</label>
              <select name="category_id" className="ap-select" value={form.category_id} onChange={handleChange}>
                <option value="">— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">Manufacturer</label>
              <select name="manufacturer_id" className="ap-select" value={form.manufacturer_id} onChange={handleChange}>
                <option value="">— None —</option>
                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="ap-field ap-full">
              <label className="ap-label">Description</label>
              <textarea name="description" className="ap-textarea" value={form.description} onChange={handleChange} placeholder="Short product description…" />
            </div>
          </div>

          {/* IMAGES */}
          <div className="ap-divider">Product Images · Cloudinary</div>
          <div className="ap-img-wrap">
            {uploadedImages.length > 0 ? (
              <>
                <div className="ap-img-row">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="ap-thumb">
                      <img src={url} alt={`img-${i}`} />
                      <button className="ap-thumb-del" onClick={() => removeImage(i)}>✕</button>
                    </div>
                  ))}
                  {uploadingImg && (
                    <div className="ap-spin-box">
                      <div className="ap-spinner" />
                      <span className="ap-spinner-label">Uploading</span>
                    </div>
                  )}
                </div>
                <button className="ap-add-img-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}>
                  {uploadingImg ? <><div className="ap-spinner" style={{ width: 12, height: 12 }} /> Uploading…</> : '+ Add More'}
                </button>
              </>
            ) : uploadingImg ? (
              <div className="ap-img-row">
                <div className="ap-spin-box"><div className="ap-spinner" /><span className="ap-spinner-label">Uploading</span></div>
              </div>
            ) : (
              <div className="ap-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <span className="ap-upload-zone-icon">🖼️</span>
                <span className="ap-upload-zone-text">Click to upload images</span>
                <span className="ap-upload-zone-hint">JPG, PNG, WEBP · max 5MB each · multiple supported</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleImageFile} style={{ display: 'none' }} />
            {errors.images && <span className="ap-error">⚠ {errors.images}</span>}
          </div>

          {/* VARIANTS — only shown when editing an existing product */}
          {isEdit && (
            <>
              <div className="ap-divider">Product Variants</div>
              <div className="ap-variants-wrap">
             

                {variantError && <span className="ap-variant-err">⚠ {variantError}</span>}

                {/* Existing variants */}
                {variants.length === 0 && (
                  <p className="ap-variant-empty">No variants yet — add one below.</p>
                )}
                {variants.map(v => (
                  <div key={v.id} className="ap-variant-row">
                    <div>
                      <div className="ap-variant-label">Name</div>
                      <input
                        className="ap-variant-input"
                        value={v.variant_name}
                        onChange={e => updateVariantField(v.id, 'variant_name', e.target.value)}
                        placeholder="e.g. 500g"
                      />
                    </div>
                    <div>
                      <div className="ap-variant-label">Price ₹</div>
                      <input
                        type="number" min="0" step="0.01"
                        className="ap-variant-input"
                        value={v.price}
                        onChange={e => updateVariantField(v.id, 'price', e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="ap-variant-label">Stock</div>
                      <input
                        type="number" min="0"
                        className="ap-variant-input"
                        value={v.stock}
                        onChange={e => updateVariantField(v.id, 'stock', e.target.value)}
                      />
                    </div>
                    <div className="ap-variant-actions">
                      <button
                        className="ap-variant-save"
                        onClick={() => handleUpdateVariant(v)}
                        disabled={variantSaving === v.id}
                      >
                        {variantSaving === v.id ? '…' : '✓'}
                      </button>
                      <button
                        className="ap-variant-del"
                        onClick={() => handleDeleteVariant(v.id)}
                        disabled={variantDeleting === v.id}
                      >
                        {variantDeleting === v.id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new variant */}
                <div className="ap-new-variant">
                  <div className="ap-new-variant-field">
                    <div className="ap-variant-label">Variant Name</div>
                    <input
                      className="ap-variant-input"
                      placeholder="e.g. 250ml, Large, Red"
                      value={newVariant.variant_name}
                      onChange={e => setNewVariant(p => ({ ...p, variant_name: e.target.value }))}
                    />
                  </div>
                  <div className="ap-new-variant-field">
                    <div className="ap-variant-label">Price ₹</div>
                    <input
                      type="number" min="0" step="0.01"
                      className="ap-variant-input"
                      placeholder="0.00"
                      value={newVariant.price}
                      onChange={e => setNewVariant(p => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div className="ap-new-variant-field">
                    <div className="ap-variant-label">Stock</div>
                    <input
                      type="number" min="0"
                      className="ap-variant-input"
                      placeholder="0"
                      value={newVariant.stock}
                      onChange={e => setNewVariant(p => ({ ...p, stock: e.target.value }))}
                    />
                  </div>
                  <button
                    className="ap-variant-add-btn"
                    onClick={handleAddVariant}
                    disabled={variantAdding}
                  >
                    {variantAdding ? '…' : '+ Add'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ADVANCED */}
          <div className="ap-divider">Advanced</div>
          <div className="ap-grid">
            <div className="ap-field ap-full">
              <label className="ap-label">Extra Details</label>
              {form.extra_details.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    className="ap-input"
                    placeholder="Label (e.g. Weight)"
                    value={item.key}
                    onChange={(e) => {
                      const updated = [...form.extra_details];
                      updated[index].key = e.target.value;
                      setForm({ ...form, extra_details: updated });
                    }}
                  />
                  <input
                    className="ap-input"
                    placeholder="Value (e.g. 1kg)"
                    value={item.value}
                    onChange={(e) => {
                      const updated = [...form.extra_details];
                      updated[index].value = e.target.value;
                      setForm({ ...form, extra_details: updated });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.extra_details.filter((_, i) => i !== index);
                      setForm({ ...form, extra_details: updated });
                    }}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171', borderRadius: '6px', padding: '0 10px', cursor: 'pointer'
                    }}
                  >✕</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, extra_details: [...form.extra_details, { key: '', value: '' }] })}
                className="ap-add-img-btn"
              >+ Add Detail</button>
            </div>
            <div className="ap-field ap-full">
              <label className="ap-check-row">
                <input type="checkbox" name="is_featured" className="ap-checkbox" checked={form.is_featured} onChange={handleChange} />
                <span className="ap-check-label">⭐ Mark as Featured product</span>
              </label>
            </div>
          </div>

          <div className="ap-footer">
            <button className="ap-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="ap-btn-save" onClick={handleSubmit} disabled={saving || uploadingImg}>
              {saving
                ? <><div className="ap-spinner" style={{ width: 13, height: 13, borderTopColor: '#fb923c' }} /> Saving…</>
                : isEdit ? 'Update Product' : 'Add Product'
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}