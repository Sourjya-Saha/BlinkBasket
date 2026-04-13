'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const ShoppingBag = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const ArrowLeft = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const BellIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>);
const BellOffIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const CheckIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

/* ─── Shared styles string (used by both Skeleton and main component) ──────── */
const SHARED_STYLES = `
  @keyframes pdv-shimmer {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }
  @keyframes pdv-bell-ring {
    0%, 100% { transform: rotate(0deg); }
    15%       { transform: rotate(18deg); }
    30%       { transform: rotate(-15deg); }
    45%       { transform: rotate(12deg); }
    60%       { transform: rotate(-8deg); }
    75%       { transform: rotate(4deg); }
  }
  @keyframes pdv-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(163,230,53,0.55); }
    70%  { box-shadow: 0 0 0 10px rgba(163,230,53,0); }
    100% { box-shadow: 0 0 0 0 rgba(163,230,53,0); }
  }
  @keyframes pdv-subscribed-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.45); }
    70%  { box-shadow: 0 0 0 9px rgba(52,211,153,0); }
    100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  }
  @keyframes pdv-spin { to { transform: rotate(360deg); } }
  @keyframes pdv-msg-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pdv-glow {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }

  /* ── SKELETON STYLES ── */
  .pdv-sk {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 700px 100%;
    animation: pdv-shimmer 1.6s infinite linear;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .pdv-sk-back      { height: 20px; width: 120px; border-radius: 8px; margin-bottom: 1.5rem; }
  .pdv-sk-main-img  { width: 100%; aspect-ratio: 1; border-radius: 16px; }
  .pdv-sk-thumb     { width: 60px; height: 60px; border-radius: 10px; }

  .pdv-sk-category      { height: 12px; width: 80px; border-radius: 4px; }
  .pdv-sk-title-lg      { height: 30px; width: 85%; border-radius: 6px; }
  .pdv-sk-title-sm      { height: 30px; width: 55%; border-radius: 6px; }
  .pdv-sk-badge         { height: 24px; width: 70px; border-radius: 20px; }
  .pdv-sk-price         { height: 34px; width: 110px; border-radius: 7px; }
  .pdv-sk-variant-label { height: 11px; width: 90px; border-radius: 4px; }
  .pdv-sk-variant-btn   { height: 36px; width: 80px; border-radius: 8px; }
  .pdv-sk-tab           { height: 14px; width: 52px; border-radius: 5px; margin-bottom: 0.65rem; }
  .pdv-sk-desc-line     { height: 13px; width: 100%; border-radius: 5px; }
  .pdv-sk-qty-ctrl      { height: 48px; width: 104px; border-radius: 10px; }
  .pdv-sk-add-btn {
    flex: 1; height: 48px; border-radius: 12px;
    background: linear-gradient(
      90deg,
      rgba(163,230,53,0.06) 25%,
      rgba(163,230,53,0.12) 50%,
      rgba(163,230,53,0.06) 75%
    );
    background-size: 700px 100%;
    animation: pdv-shimmer 1.6s infinite linear;
  }

  /* ── LAYOUT (shared between skeleton and real content) ── */
  .pdv-root { font-family: 'DM Sans', sans-serif; }

  .pdv-container { display: grid; grid-template-columns: 380px 1fr; gap: 2.5rem; }

  .pdv-left { display: flex; flex-direction: column; gap: 1rem; }
  .pdv-right { display: flex; flex-direction: column; gap: 1rem; }

  @media (max-width: 800px) {
    .pdv-container { grid-template-columns: 1fr; }
    .pdv-left { max-width: 400px; }
  }

  /* ── REAL CONTENT STYLES ── */
  .pdv-nav-back { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; text-decoration: none; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; transition: 0.2s; }
  .pdv-nav-back:hover { color: #a3e635; }

  .pdv-main-img-wrap { width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; background: #0c111a; border: 1px solid rgba(255,255,255,0.08); }
  .pdv-main-img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.4s ease-in-out; }
  .pdv-thumbs { display: flex; gap: 0.6rem; overflow-x: auto; scrollbar-width: none; }
  .pdv-thumb { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; cursor: pointer; border: 2px solid transparent; transition: 0.2s; opacity: 0.5; }
  .pdv-thumb.active { border-color: #a3e635; opacity: 1; }

  .pdv-category { font-size: 0.7rem; font-weight: 800; color: #a3e635; text-transform: uppercase; letter-spacing: 0.1em; }
  .pdv-title { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1.2; }
  .pdv-price { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0.2rem 0; }
  .pdv-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); display: inline-block; }

  .pdv-variant-label { font-size: 0.75rem; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 0.5rem; }
  .pdv-variant-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .pdv-variant-btn { padding: 0.5rem 0.9rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #d1d5db; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
  .pdv-variant-btn.active { background: rgba(163,230,53,0.1); border-color: #a3e635; color: #a3e635; }

  .pdv-tabs { display: flex; gap: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-top: 0.5rem; }
  .pdv-tab { padding: 0.6rem 0; font-size: 0.8rem; font-weight: 700; color: #4b5563; cursor: pointer; background: none; border: none; position: relative; }
  .pdv-tab.active { color: #fff; }
  .pdv-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #a3e635; }
  .pdv-tab-content { padding: 1rem 0; font-size: 0.85rem; color: #9ca3af; line-height: 1.6; min-height: 100px; }
  .pdv-spec-row { display: grid; grid-template-columns: 130px 1fr; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .pdv-spec-key { color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; }

  .pdv-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.05); }
  .pdv-actions-row { display: flex; gap: 1rem; align-items: center; }

  .pdv-qty { display: flex; align-items: center; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 0.3rem; border: 1px solid rgba(255,255,255,0.08); }
  .pdv-qty-btn { width: 30px; height: 30px; border: none; background: transparent; color: #fff; cursor: pointer; font-size: 1rem; transition: opacity 0.15s; }
  .pdv-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .pdv-qty-val { width: 30px; text-align: center; font-weight: 700; color: #fff; font-size: 0.9rem; }

  .pdv-add-btn { flex: 1; height: 48px; border-radius: 12px; border: none; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); color: #052e16; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .pdv-add-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(163,230,53,0.3); }
  .pdv-add-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  .pdv-cart-limit { display: flex; align-items: center; gap: 8px; padding: 0.7rem 1rem; border-radius: 10px; background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.25); font-size: 0.8rem; font-weight: 600; color: #fb923c; animation: pdv-msg-in 0.2s ease; }
  .pdv-cart-limit-dot { width: 7px; height: 7px; border-radius: 50%; background: #fb923c; flex-shrink: 0; }

  .pdv-notify-wrap { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; }
  .pdv-notify-btn { position: relative; width: 100%; height: 52px; border-radius: 14px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 9px; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden; letter-spacing: 0.01em; }
  .pdv-notify-btn.state-idle { background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); color: #052e16; animation: pdv-pulse-ring 2s ease-in-out infinite; }
  .pdv-notify-btn.state-idle:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 30px rgba(163,230,53,0.4); animation: none; }
  .pdv-notify-btn.state-idle .pdv-btn-bell { animation: pdv-bell-ring 2.5s ease-in-out infinite; transform-origin: top center; }
  .pdv-notify-btn.state-loading { background: rgba(163,230,53,0.15); border: 1.5px solid rgba(163,230,53,0.35); color: #a3e635; cursor: not-allowed; }
  .pdv-notify-btn.state-subscribed { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #d1fae5; animation: pdv-subscribed-pulse 2.5s ease-in-out infinite; }
  .pdv-notify-btn.state-subscribed:hover { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #fee2e2; animation: none; transform: translateY(-1px); }
  .pdv-notify-btn.state-subscribed:hover .pdv-btn-subscribed-txt { display: none; }
  .pdv-notify-btn.state-subscribed:hover .pdv-btn-unsub-txt { display: flex; }
  .pdv-notify-btn.state-unsubscribing { background: rgba(239,68,68,0.12); border: 1.5px solid rgba(239,68,68,0.3); color: #f87171; cursor: not-allowed; }
  .pdv-btn-subscribed-txt { display: flex; align-items: center; gap: 8px; }
  .pdv-btn-unsub-txt { display: none; align-items: center; gap: 8px; }
  .pdv-notify-btn.state-idle::before { content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); transform: skewX(-20deg); animation: pdv-glow 3s ease-in-out infinite; }
  .pdv-btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(163,230,53,0.25); border-top-color: #a3e635; animation: pdv-spin 0.65s linear infinite; flex-shrink: 0; }
  .pdv-btn-spinner-red { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(248,113,113,0.25); border-top-color: #f87171; animation: pdv-spin 0.65s linear infinite; flex-shrink: 0; }
  .pdv-notify-msg { font-size: 0.78rem; font-weight: 600; text-align: center; padding: 0.45rem 0.8rem; border-radius: 8px; animation: pdv-msg-in 0.2s ease; }
  .pdv-notify-msg.success { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
  .pdv-notify-msg.info    { background: rgba(156,163,175,0.08); color: #9ca3af; border: 1px solid rgba(156,163,175,0.15); }
  .pdv-oos-label { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: #6b7280; padding: 0.5rem 0; }
  .pdv-oos-dot { width: 8px; height: 8px; border-radius: 50%; background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,0.5); flex-shrink: 0; }
`;

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function ProductDetailSkeleton() {
  return (
    <div className="pdv-root">
      {/* Styles are injected here so skeleton renders correctly before product loads */}
      <style>{SHARED_STYLES}</style>

      <div className="pdv-sk pdv-sk-back" />

      <div className="pdv-container">
        {/* Left — image gallery skeleton */}
        <div className="pdv-left">
          <div className="pdv-sk pdv-sk-main-img" />
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="pdv-sk pdv-sk-thumb" />
            ))}
          </div>
        </div>

        {/* Right — info skeleton */}
        <div className="pdv-right">
          {/* category + title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="pdv-sk pdv-sk-category" />
            <div className="pdv-sk pdv-sk-title-lg" />
            <div className="pdv-sk pdv-sk-title-sm" />
          </div>

          {/* badges */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="pdv-sk pdv-sk-badge" />
            <div className="pdv-sk pdv-sk-badge" style={{ width: 90 }} />
          </div>

          {/* price */}
          <div className="pdv-sk pdv-sk-price" />

          {/* variant buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="pdv-sk pdv-sk-variant-label" />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="pdv-sk pdv-sk-variant-btn" />
              ))}
            </div>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.1rem' }}>
              <div className="pdv-sk pdv-sk-tab" />
              <div className="pdv-sk pdv-sk-tab" style={{ width: 44 }} />
            </div>
            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="pdv-sk pdv-sk-desc-line" />
              <div className="pdv-sk pdv-sk-desc-line" style={{ width: '90%' }} />
              <div className="pdv-sk pdv-sk-desc-line" style={{ width: '75%' }} />
              <div className="pdv-sk pdv-sk-desc-line" style={{ width: '82%' }} />
            </div>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="pdv-sk pdv-sk-qty-ctrl" />
              <div className="pdv-sk-add-btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function ProductDetailView({ product, onAddToCart, addingToCart, cartVersion = 0, loading = false }) {
  const { data: session } = useSession();
  const [tab, setTab] = useState('details');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const autoPlayRef = useRef(null);

  const [notifyState, setNotifyState] = useState('idle');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [alreadyInCart, setAlreadyInCart] = useState(0);

  const images = product?.images
    ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]'))
    : [];
  const variants = product?.product_variants?.filter(v => v.is_active !== false) || [];

  const price = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product?.price || 0);
  const totalStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const remaining = Math.max(0, totalStock - alreadyInCart);

  useEffect(() => {
    if (!session?.accessToken || !product?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        const items = data.items || [];
        const variantId = selectedVariant?.id ?? null;
        const matched = items.filter(item => {
          const sameProduct = item.products?.id === product.id || item.product_id === product.id;
          const sameVariant = variantId
            ? item.product_variants?.id === variantId || item.variant_id === variantId
            : !item.variant_id && !item.product_variants?.id;
          return sameProduct && sameVariant;
        });
        const inCart = matched.reduce((sum, i) => sum + (i.quantity || 1), 0);
        setAlreadyInCart(inCart);
        setQuantity(q => Math.min(q, Math.max(1, totalStock - inCart)));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, product?.id, selectedVariant?.id, cartVersion]);

  useEffect(() => {
    if (!session?.accessToken || !product?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts/stock`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(r => r.json())
      .then(alerts => {
        if (Array.isArray(alerts) && alerts.some(a => a.product_id === product.id)) {
          setNotifyState('subscribed');
        }
      })
      .catch(() => {});
  }, [session, product?.id]);

  useEffect(() => {
    if (images.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setActiveImg(prev => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(autoPlayRef.current);
  }, [images.length]);

  const handleThumbnailClick = index => {
    setActiveImg(index);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setActiveImg(prev => (prev + 1) % images.length);
      }, 1500);
    }
  };

  const handleVariantClick = v => {
    setSelectedVariant(selectedVariant?.id === v.id ? null : v);
    setQuantity(1);
  };

  const handleSubscribe = async () => {
    if (!session?.accessToken) { alert('Please log in to subscribe to alerts.'); return; }
    setNotifyState('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (res.ok) {
        setNotifyState('subscribed');
        setNotifyMsg("You're on the list! We'll notify you.");
        setTimeout(() => setNotifyMsg(''), 3000);
      } else {
        const err = await res.json();
        setNotifyState('idle');
        alert(err.error || 'Failed to subscribe to alerts.');
      }
    } catch {
      setNotifyState('idle');
      alert('Network error. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    if (!session?.accessToken) return;
    setNotifyState('unsubscribing');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts/stock/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        setNotifyState('idle');
        setNotifyMsg("You've been unsubscribed.");
        setTimeout(() => setNotifyMsg(''), 3000);
      } else {
        setNotifyState('subscribed');
        alert('Failed to unsubscribe. Please try again.');
      }
    } catch {
      setNotifyState('subscribed');
      alert('Network error. Please try again.');
    }
  };

  const handleNotifyClick = () => {
    if (notifyState === 'subscribed') handleUnsubscribe();
    else if (notifyState === 'idle') handleSubscribe();
  };

  const isSubscribed = notifyState === 'subscribed';
  const isLoading = notifyState === 'loading' || notifyState === 'unsubscribing';
  const canAddToCart = remaining > 0 && quantity >= 1 && quantity <= remaining;

  /* ── Render skeleton while loading ── */
  if (loading || !product) return <ProductDetailSkeleton />;

  return (
    <div className="pdv-root">
      {/* SHARED_STYLES covers both skeleton and real content — safe to inject again here */}
      <style>{SHARED_STYLES}</style>

      <Link href="/userdashboard" className="pdv-nav-back">
        <ArrowLeft /> Back to Home
      </Link>

      <div className="pdv-container">
        {/* Gallery */}
        <div className="pdv-left">
          <div className="pdv-main-img-wrap">
            <img key={activeImg} src={images[activeImg] || '/placeholder-product.png'} className="pdv-main-img" alt={product.name} />
          </div>
          <div className="pdv-thumbs">
            {images.map((img, i) => (
              <img key={i} src={img} className={`pdv-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => handleThumbnailClick(i)} alt="" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="pdv-right">
          <div>
            <div className="pdv-category">{product.categories?.name || 'Store Item'}</div>
            <h1 className="pdv-title">{product.name}</h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {product.is_featured && (
              <span className="pdv-badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24' }}>★ Featured</span>
            )}
            <span className="pdv-badge" style={{ color: totalStock > 0 ? '#34d399' : '#f87171' }}>
              {totalStock > 0 ? `In Stock (${totalStock})` : 'Out of Stock'}
            </span>
          </div>

          <div className="pdv-price">₹{price.toFixed(0)}</div>

          {variants.length > 0 && (
            <div>
              <p className="pdv-variant-label">Select Option</p>
              <div className="pdv-variant-grid">
                {variants.map(v => (
                  <button key={v.id} className={`pdv-variant-btn ${selectedVariant?.id === v.id ? 'active' : ''}`} onClick={() => handleVariantClick(v)}>
                    {v.variant_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="pdv-tabs">
              <button className={`pdv-tab ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
              <button className={`pdv-tab ${tab === 'specs' ? 'active' : ''}`} onClick={() => setTab('specs')}>Specs</button>
            </div>
            <div className="pdv-tab-content">
              {tab === 'details' ? (
                <p>{product.description || 'No description available.'}</p>
              ) : (
                <div className="pdv-specs">
                  {product.extra_details && Object.entries(product.extra_details).length > 0
                    ? Object.entries(product.extra_details).map(([k, v]) => (
                        <div key={k} className="pdv-spec-row">
                          <span className="pdv-spec-key">{k}</span>
                          <span className="pdv-spec-val">{v}</span>
                        </div>
                      ))
                    : 'No specifications provided.'}
                </div>
              )}
            </div>
          </div>

          <div className="pdv-actions">
            {totalStock > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {remaining === 0 && alreadyInCart > 0 && (
                  <div className="pdv-cart-limit">
                    <span className="pdv-cart-limit-dot" />
                    You already have all {totalStock} available unit{totalStock !== 1 ? 's' : ''} in your cart
                  </div>
                )}
                <div className="pdv-actions-row">
                  <div className="pdv-qty">
                    <button className="pdv-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                    <span className="pdv-qty-val">{quantity}</span>
                    <button className="pdv-qty-btn" onClick={() => setQuantity(q => Math.min(remaining, q + 1))} disabled={quantity >= remaining} title={quantity >= remaining ? `Only ${remaining} more unit${remaining !== 1 ? 's' : ''} can be added` : ''}>+</button>
                  </div>
                  <button className="pdv-add-btn" disabled={addingToCart || !canAddToCart} onClick={() => onAddToCart(product.id, selectedVariant?.id, quantity)} title={!canAddToCart ? 'Maximum available stock already in your cart' : ''}>
                    <ShoppingBag />
                    {addingToCart ? 'Adding...' : remaining === 0 ? 'Stock in Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pdv-notify-wrap">
                <div className="pdv-oos-label">
                  <span className="pdv-oos-dot" />
                  Currently out of stock — get notified when it's back
                </div>
                <button
                  className={`pdv-notify-btn state-${notifyState === 'unsubscribing' ? 'unsubscribing' : isSubscribed ? 'subscribed' : isLoading ? 'loading' : 'idle'}`}
                  onClick={handleNotifyClick}
                  disabled={isLoading}
                >
                  {notifyState === 'idle'          && (<><span className="pdv-btn-bell"><BellIcon /></span>Notify Me When Available</>)}
                  {notifyState === 'loading'        && (<><span className="pdv-btn-spinner" />Setting up alert…</>)}
                  {notifyState === 'subscribed'     && (
                    <>
                      <span className="pdv-btn-subscribed-txt"><CheckIcon /> Notifying when back in stock</span>
                      <span className="pdv-btn-unsub-txt"><BellOffIcon /> Remove Notification</span>
                    </>
                  )}
                  {notifyState === 'unsubscribing' && (<><span className="pdv-btn-spinner-red" />Removing alert…</>)}
                </button>
                {notifyMsg && (
                  <div className={`pdv-notify-msg ${notifyState === 'idle' ? 'info' : 'success'}`}>{notifyMsg}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}