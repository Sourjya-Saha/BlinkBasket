'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import UserNav from '../../../components/UserNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icons ─────────────────────────────────────────────────────────────────────
const TrashIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const MinusIcon = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const PlusIcon = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const CartEmptyIcon = () => (<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const ArrowLeftIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const ChevronRightIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const LocateIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>);
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const MapPinIcon = ({ size = 13 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const CheckCircleIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const XCircleIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
const CheckStepIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const CodIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>);
const CardIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);

function SpinnerRing({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'cp-spin 0.7s linear infinite' }}>
      <path d="M12 2v4" strokeOpacity="1"/><path d="M12 18v4" strokeOpacity="0.25"/>
      <path d="M4.93 4.93l2.83 2.83" strokeOpacity="0.75"/><path d="M16.24 16.24l2.83 2.83" strokeOpacity="0.2"/>
      <path d="M2 12h4" strokeOpacity="0.6"/><path d="M18 12h4" strokeOpacity="0.15"/>
      <path d="M4.93 19.07l2.83-2.83" strokeOpacity="0.4"/><path d="M16.24 7.76l2.83-2.83" strokeOpacity="0.9"/>
    </svg>
  );
}

// ── Skeleton Components ───────────────────────────────────────────────────────

function SkeletonCartItem() {
  return (
    <div className="cp-skeleton-item">
      <div className="cp-skeleton cp-sk-item-img" />
      <div className="cp-skeleton-item-body">
        <div className="cp-skeleton cp-sk-item-name" />
        <div className="cp-skeleton cp-sk-item-variant" />
        <div className="cp-skeleton cp-sk-item-price" />
        <div className="cp-skeleton-item-foot">
          <div className="cp-skeleton cp-sk-qty-ctrl" />
          <div className="cp-skeleton cp-sk-rm-btn" />
        </div>
      </div>
    </div>
  );
}

function SkeletonBillCard() {
  return (
    <div className="cp-glass cp-skeleton-bill">
      <div className="cp-skeleton cp-sk-bill-title" />
      <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="cp-skeleton cp-sk-bill-label" />
          <div className="cp-skeleton cp-sk-bill-val" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="cp-skeleton cp-sk-bill-label" />
          <div className="cp-skeleton cp-sk-bill-val" style={{ width: 40 }} />
        </div>
      </div>
      <div className="cp-skeleton cp-sk-bill-divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cp-skeleton cp-sk-bill-total-label" />
        <div className="cp-skeleton cp-sk-bill-total-val" />
      </div>
      <div className="cp-skeleton cp-sk-cta-btn" />
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

const STEPS = ['cart', 'address', 'payment', 'confirm'];
const STEP_LABELS = { cart: 'Cart', address: 'Address', payment: 'Payment', confirm: 'Confirm' };

function StepBar({ current }) {
  const currentIdx = STEPS.indexOf(current);
  const progressPercent = (currentIdx / (STEPS.length - 1)) * 100;
  return (
    <div className="cp-progress-container">
      <div className="cp-progress-track">
        <div className="cp-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="cp-progress-steps">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step} className={`cp-prog-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              <div className="cp-prog-dot">{done && !active ? <CheckStepIcon /> : i + 1}</div>
              <span className="cp-prog-label">{STEP_LABELS[step]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Address Step ──────────────────────────────────────────────────────────────

function AddressStep({ onConfirm, onBack }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [locating, setLocating] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { autoLocate(); }, []);

  async function autoLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          const short = [data.address?.road, data.address?.suburb, data.address?.city || data.address?.town].filter(Boolean).join(', ') || data.display_name;
          setSelectedLocation({ display: data.display_name, short, lat, lng });
          setQuery(short);
          if (data.address?.postcode) setPincode(data.address.postcode);
          checkServiceability(lat, lng);
        } catch { }
        finally { setLocating(false); }
      },
      () => setLocating(false), { timeout: 8000 }
    );
  }

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 3) { setSuggestions([]); return; }
    setSuggLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`, { headers: { 'Accept-Language': 'en' } });
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
    finally { setSuggLoading(false); }
  }, []);

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val); setSelectedLocation(null); setDeliveryStatus(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function selectSuggestion(s) {
    const short = [s.address?.road, s.address?.suburb, s.address?.city || s.address?.town].filter(Boolean).join(', ') || s.display_name;
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    setSelectedLocation({ display: s.display_name, short, lat, lng });
    setQuery(short);
    if (s.address?.postcode) setPincode(s.address.postcode);
    setSuggestions([]);
    checkServiceability(lat, lng);
  }

  async function checkServiceability(lat, lng) {
    setDeliveryStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/delivery/check?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setDeliveryStatus(data.available ? 'available' : 'unavailable');
    } catch { setDeliveryStatus('unavailable'); }
  }

  const canProceed = selectedLocation && deliveryStatus === 'available' && flatNo.trim() && pincode.trim().length === 6;

  function handleContinue() {
    if (!canProceed) return;
    const parts = [flatNo.trim(), landmark.trim(), selectedLocation.short].filter(Boolean);
    onConfirm({ delivery_address: parts.join(', '), pincode: pincode.trim(), lat: selectedLocation.lat, lng: selectedLocation.lng });
  }

  return (
    <div className="cp-addr-wrap">
      <p className="cp-addr-section-lbl">Delivery Location</p>
      <button className="cp-locate-btn" onClick={autoLocate} disabled={locating} type="button">
        <span className="cp-locate-icon-box">{locating ? <SpinnerRing size={14} color="#a3e635" /> : <LocateIcon />}</span>
        <span className="cp-locate-txt">
          {locating ? 'Detecting your location…' : 'Use my current location'}
          <span className="cp-locate-sub">{locating ? 'Allow location access if prompted' : 'Auto-fill from GPS'}</span>
        </span>
        <ChevronRightIcon />
      </button>
      <div className="cp-addr-divider">
        <div className="cp-addr-div-line" /><span className="cp-addr-div-txt">or type an address</span><div className="cp-addr-div-line" />
      </div>
      <div className="cp-addr-search-wrap">
        <div className={`cp-addr-input-row${inputFocused ? ' focused' : ''}`}>
          <span className="cp-addr-search-ico"><SearchIcon /></span>
          <input ref={inputRef} className="cp-addr-input" type="text" placeholder="Search area, street, city…" value={query} onChange={handleQueryChange} onFocus={() => setInputFocused(true)} onBlur={() => setTimeout(() => setInputFocused(false), 200)} autoComplete="off" />
          {suggLoading && <SpinnerRing size={13} color="#a3e635" />}
          {query && !suggLoading && (
            <button className="cp-addr-clear" type="button" onMouseDown={e => { e.preventDefault(); setQuery(''); setSuggestions([]); setSelectedLocation(null); setDeliveryStatus(null); inputRef.current?.focus(); }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="cp-addr-dropdown">
            {suggestions.map((s, i) => {
              const main = [s.address?.road, s.address?.suburb, s.address?.city || s.address?.town].filter(Boolean).join(', ') || s.display_name.split(',')[0];
              return (
                <div key={i} className="cp-addr-sugg" onMouseDown={() => selectSuggestion(s)}>
                  <span className="cp-addr-sugg-pin"><MapPinIcon /></span>
                  <div>
                    <div className="cp-addr-sugg-main">{main}</div>
                    <div className="cp-addr-sugg-sub">{s.display_name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedLocation && (
        <div className="cp-addr-pill">
          <span style={{ color: '#a3e635', flexShrink: 0 }}><MapPinIcon size={12} /></span>
          <span className="cp-addr-pill-txt">{selectedLocation.display}</span>
        </div>
      )}
      {deliveryStatus && (
        <div className={`cp-delivery-banner ${deliveryStatus}`}>
          {deliveryStatus === 'checking'   && <><SpinnerRing size={17} /><div><div className="cp-del-title">Checking delivery availability…</div></div></>}
          {deliveryStatus === 'available'  && <><CheckCircleIcon /><div><div className="cp-del-title">We deliver here! 🎉</div><div className="cp-del-sub">Fill in your details below to continue</div></div></>}
          {deliveryStatus === 'unavailable'&& <><XCircleIcon /><div><div className="cp-del-title">Delivery not available yet</div><div className="cp-del-sub">We're expanding — try a nearby location</div></div></>}
        </div>
      )}
      {deliveryStatus === 'available' && (
        <div className="cp-addr-fields">
          <p className="cp-addr-section-lbl" style={{ marginBottom: '0.8rem', marginTop: '0.25rem' }}>Complete your address</p>
          <div className="cp-addr-field"><label className="cp-addr-lbl">Flat / House No. *</label><input className="cp-addr-finput" type="text" placeholder="e.g. 12B, Tower C" value={flatNo} onChange={e => setFlatNo(e.target.value)} /></div>
          <div className="cp-addr-field"><label className="cp-addr-lbl">Landmark <span style={{ color: '#4b5563', fontWeight: 400 }}>(optional)</span></label><input className="cp-addr-finput" type="text" placeholder="Near metro, park, school…" value={landmark} onChange={e => setLandmark(e.target.value)} /></div>
          <div className="cp-addr-row2">
            <div className="cp-addr-field"><label className="cp-addr-lbl">Pincode *</label><input className="cp-addr-finput" type="text" placeholder="6-digit pincode" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
            <div className="cp-addr-field"><label className="cp-addr-lbl">City</label><input className="cp-addr-finput" style={{ opacity: 0.55, cursor: 'default' }} type="text" readOnly value={selectedLocation?.short?.split(',').pop()?.trim() || ''} placeholder="Auto-filled" /></div>
          </div>
        </div>
      )}
      <div className="cp-addr-nav">
        <button className="cp-ghost-btn" onClick={onBack} type="button"><ArrowLeftIcon /> Back to Cart</button>
        <button className="cp-cta-btn" disabled={!canProceed} onClick={handleContinue} type="button">Continue to Payment <ChevronRightIcon /></button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getItemStock(item) {
  if (item.product_variants?.stock !== undefined && item.product_variants?.stock !== null) return item.product_variants.stock;
  return item.products?.stock ?? Infinity;
}

// ── Main Cart Page ────────────────────────────────────────────────────────────

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [addressData, setAddressData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status, router]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json()).then(setUserProfile).catch(console.error);
  }, [session]);

  const fetchCart = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const data = await res.json();
      const fetchedItems = data.items || [];
      const mergedItems = [];
      const map = new Map();
      fetchedItems.forEach(item => {
        const key = `${item.products?.id}-${item.product_variants?.id || 'base'}`;
        if (map.has(key)) { map.get(key).quantity += (item.quantity || 1); }
        else { const clone = { ...item }; map.set(key, clone); mergedItems.push(clone); }
      });
      setCartItems(mergedItems);
      setCartCount(mergedItems.length);
    } catch { showToast('error', 'Failed to load cart'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3200); }

async function updateQuantity(itemId, newQty, maxStock) {
    // 1. Basic safety checks
    if (newQty < 1 || !session?.accessToken) return;

    // 2. Find the item currently in the state to check if we are increasing or decreasing
    const currentItem = cartItems.find(item => item.id === itemId);
    const isIncreasing = currentItem && newQty > currentItem.quantity;

    // 3. Only block the update if the user is trying to ADD more than what's available.
    // If they are decreasing (newQty < currentItem.quantity), we let it pass
    // so they can bring the total down to a valid range.
    if (isIncreasing && newQty > maxStock) {
      showToast('error', `Only ${maxStock} unit${maxStock !== 1 ? 's' : ''} available`);
      return;
    }

    setUpdating(itemId);
    try {
      const res = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ quantity: newQty })
      });

      if (res.ok) {
        setCartItems(items =>
          items.map(item => (item.id === itemId ? { ...item, quantity: newQty } : item))
        );
      } else {
        const errorData = await res.json();
        showToast('error', errorData.error || 'Failed to update quantity');
      }
    } catch (err) {
      showToast('error', 'Network error: Failed to update');
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId) {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/cart/${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) { setCartItems(items => items.filter(i => i.id !== itemId)); setCartCount(c => Math.max(0, c - 1)); showToast('success', 'Item removed'); }
    } catch { showToast('error', 'Failed to remove item'); }
  }

  async function clearCart() {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/cart`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) { setCartItems([]); setCartCount(0); showToast('success', 'Cart cleared'); }
    } catch { showToast('error', 'Failed to clear cart'); }
  }

  function getProductPrice(item) { return parseFloat(item.product_variants?.price ?? item.products?.price) || 0; }
  function getProductImage(item) {
    try {
      const imgs = item.products?.images;
      if (!imgs) return '/placeholder-product.png';
      if (Array.isArray(imgs)) return imgs[0] || '/placeholder-product.png';
      const p = JSON.parse(imgs);
      return Array.isArray(p) && p.length ? p[0] : '/placeholder-product.png';
    } catch { return '/placeholder-product.png'; }
  }
  function getVariantName(item) { return item.product_variants?.variant_name || null; }

  const subtotal = cartItems.reduce((sum, item) => sum + getProductPrice(item) * (item.quantity || 1), 0);
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!session?.accessToken || !addressData) return;
    const { delivery_address, pincode } = addressData;
    if (paymentMethod === 'cod') {
      setProcessing(true);
      try {
        const res = await fetch(`${API_BASE}/orders/cod`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ delivery_address, pincode, total: total.toFixed(2) }) });
        const result = await res.json();
        if (result.success) { showToast('success', 'Order placed!'); setCartItems([]); setCartCount(0); setCheckoutStep('cart'); router.push('/userdashboard/orders'); }
        else showToast('error', result.error || 'Failed to place order');
      } catch { showToast('error', 'Failed to place order'); }
      finally { setProcessing(false); }
      return;
    }
    setProcessing(true);
    if (!window.Razorpay) { showToast('error', 'Payment gateway loading, please retry'); setProcessing(false); return; }
    try {
      const createRes = await fetch(`${API_BASE}/orders/razorpay/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ amount: Math.round(total * 100) }) });
      const orderRes = await createRes.json();
      if (!orderRes.razorpay_order_id) { showToast('error', orderRes.error || 'Failed to create payment'); setProcessing(false); return; }
      const rz = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: orderRes.amount, currency: orderRes.currency || 'INR',
        name: 'BlinkBasket', description: 'Order Payment', order_id: orderRes.razorpay_order_id,
        handler: async (response) => {
          const verRes = await fetch(`${API_BASE}/orders/razorpay/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ ...response, delivery_address, pincode, total: total.toFixed(2) }) });
          const vr = await verRes.json();
          if (vr.success) { showToast('success', 'Order placed!'); setCartItems([]); setCartCount(0); router.push('/userdashboard/orders'); }
          else showToast('error', vr.error || 'Payment verification failed');
          setProcessing(false);
        },
        prefill: { name: userProfile?.full_name || '', email: userProfile?.email || '', contact: userProfile?.phone || '' },
        theme: { color: '#a3e635' },
        modal: { ondismiss: () => { showToast('error', 'Payment cancelled'); setProcessing(false); } },
      });
      rz.open();
    } catch { showToast('error', 'Failed to place order'); setProcessing(false); }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerRing size={32} color="#a3e635" />
      </div>
    );
  }

  const pageTitle = { cart: 'My Cart', address: 'Delivery Address', payment: 'Payment', confirm: 'Confirm Order' }[checkoutStep];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes cp-spin   { to { transform: rotate(360deg); } }
        @keyframes cp-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cp-toast  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cp-drop   { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        /* ─── SKELETON ─── */
        @keyframes cp-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .cp-skeleton {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 600px 100%;
          animation: cp-shimmer 1.6s infinite linear;
          border-radius: 8px;
        }

        /* skeleton cart item */
        .cp-skeleton-item {
          display: flex; gap: 1rem; padding: 1.2rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .cp-skeleton-item:last-child { border-bottom: none; }
        .cp-sk-item-img     { width: 90px; height: 90px; border-radius: 13px; flex-shrink: 0; }
        .cp-skeleton-item-body { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .cp-sk-item-name    { height: 17px; width: 70%; border-radius: 6px; }
        .cp-sk-item-variant { height: 14px; width: 40%; border-radius: 5px; }
        .cp-sk-item-price   { height: 20px; width: 55px; border-radius: 6px; }
        .cp-skeleton-item-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; }
        .cp-sk-qty-ctrl     { height: 36px; width: 100px; border-radius: 9px; }
        .cp-sk-rm-btn       { height: 34px; width: 80px; border-radius: 7px; }

        /* skeleton bill card */
        .cp-skeleton-bill { padding: 1.5rem !important; }
        .cp-sk-bill-title       { height: 20px; width: 120px; margin-bottom: 0.2rem; }
        .cp-sk-bill-label       { height: 13px; width: 130px; border-radius: 5px; }
        .cp-sk-bill-val         { height: 13px; width: 60px; border-radius: 5px; }
        .cp-sk-bill-divider     { height: 1px; width: 100%; border-radius: 2px; margin: 1.2rem 0; }
        .cp-sk-bill-total-label { height: 16px; width: 80px; border-radius: 6px; }
        .cp-sk-bill-total-val   { height: 26px; width: 90px; border-radius: 7px; }
        .cp-sk-cta-btn          { height: 48px; width: 100%; border-radius: 13px; margin-top: 1.5rem; background: linear-gradient(90deg, rgba(163,230,53,0.07) 25%, rgba(163,230,53,0.12) 50%, rgba(163,230,53,0.07) 75%); background-size: 600px 100%; animation: cp-shimmer 1.6s infinite linear; }

        /* ── page ── */
        .cp-root { min-height: 100vh; background: #0a0c10; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .cp-root::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 65% 45% at 15% 0%, rgba(163,230,53,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 55% 40% at 85% 100%, rgba(163,230,53,0.05) 0%, transparent 70%);
        }
        .cp-main { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; padding: 0 1rem 4rem; }
        .cp-header { padding: 1.5rem 0 1rem; display: flex; align-items: center; gap: 0.85rem; }
        .cp-back-link {
          display: flex; align-items: center; gap: 5px; padding: 0.45rem 0.8rem;
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 9px;
          color: #6b7280; font-size: 0.78rem; font-family: 'DM Sans', sans-serif;
          cursor: pointer; text-decoration: none; transition: all 0.15s;
        }
        .cp-back-link:hover { border-color: rgba(163,230,53,0.3); color: #a3e635; }
        .cp-page-title { font-family: 'Syne', sans-serif; font-size: clamp(1.25rem, 3vw, 1.55rem); font-weight: 800; color: #fff; letter-spacing: -0.03em; }

        .cp-progress-container { margin-bottom: 2rem; position: relative; padding: 0 1rem; margin-top: 0.5rem; }
        .cp-progress-track { position: absolute; top: 14px; left: 10%; right: 10%; height: 3px; background: rgba(255,255,255,0.1); z-index: 0; border-radius: 2px; }
        .cp-progress-fill { height: 100%; background: #a3e635; transition: width 0.3s ease; }
        .cp-progress-steps { display: flex; justify-content: space-between; position: relative; z-index: 1; }
        .cp-prog-step { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; }
        .cp-prog-dot {
          width: 32px; height: 32px; border-radius: 50%; background: #0a0c10;
          border: 2px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700; color: #6b7280; transition: all 0.3s ease;
        }
        .cp-prog-step.done   .cp-prog-dot { background: #a3e635; border-color: #a3e635; color: #052e16; }
        .cp-prog-step.active .cp-prog-dot { border-color: #a3e635; color: #a3e635; box-shadow: 0 0 12px rgba(163,230,53,0.25); }
        .cp-prog-label { font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; transition: color 0.3s ease; white-space: nowrap; }
        .cp-prog-step.done   .cp-prog-label, .cp-prog-step.active .cp-prog-label { color: #e5e7eb; }

        .cp-layout { display: flex; flex-direction: column; gap: 1.5rem; }
        .cp-glass { background: rgba(13,16,24,0.7); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 1.5rem; }
        .cp-items-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .cp-items-count { font-size: 0.85rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .cp-clear-btn { font-size: 0.72rem; color: #f87171; font-weight: 600; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18); padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
        .cp-clear-btn:hover { background: rgba(239,68,68,0.15); }
        .cp-item { display: flex; gap: 1rem; padding: 1.2rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); transition: opacity 0.15s; }
        .cp-item:last-child { border-bottom: none; padding-bottom: 0; }
        .cp-item-img { width: 90px; height: 90px; border-radius: 13px; object-fit: cover; background: #0c111a; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.07); }
        .cp-item-body { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
        .cp-item-name { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #f3f4f6; line-height: 1.3; }
        .cp-item-variant { font-size: 0.7rem; color: #6b7280; background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 4px; display: inline-block; width: fit-content; }
        .cp-item-price { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: #a3e635; margin-top: 0.2rem; }
        .cp-item-stock-warn { font-size: 0.7rem; font-weight: 700; color: #fb923c; background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.2); padding: 2px 7px; border-radius: 4px; display: inline-block; width: fit-content; }
        .cp-item-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
        .cp-qty { display: flex; align-items: center; gap: 3px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 3px; }
        .cp-qty-btn { width: 28px; height: 28px; border-radius: 7px; background: rgba(163,230,53,0.1); border: 1px solid rgba(163,230,53,0.18); color: #a3e635; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.13s; }
        .cp-qty-btn:hover:not(:disabled) { background: rgba(163,230,53,0.22); }
        .cp-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cp-qty-val { width: 30px; text-align: center; font-size: 0.85rem; font-weight: 600; color: #e5e7eb; }
        .cp-rm-btn { display: flex; align-items: center; gap: 4px; padding: 0.45rem 0.75rem; border-radius: 7px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18); color: #f87171; font-size: 0.75rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.13s; }
        .cp-rm-btn:hover { background: rgba(239,68,68,0.15); }
        .cp-bill-details { padding: 1.5rem; }
        .cp-bill-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px dashed rgba(255,255,255,0.15); }
        .cp-bill-row { display: flex; justify-content: space-between; margin-bottom: 0.85rem; font-size: 0.9rem; }
        .cp-bill-lbl { color: #9ca3af; font-weight: 500; }
        .cp-bill-val { color: #f3f4f6; font-weight: 600; }
        .cp-bill-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 1.2rem 0; }
        .cp-bill-total { display: flex; justify-content: space-between; align-items: center; }
        .cp-bill-total-lbl { font-size: 1rem; font-weight: 700; color: #fff; }
        .cp-bill-total-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #a3e635; }
        .cp-free-banner { margin-top: 1rem; padding: 0.75rem; background: rgba(163,230,53,0.07); border: 1px dashed rgba(163,230,53,0.3); border-radius: 10px; text-align: center; }
        .cp-free-txt { font-size: 0.85rem; color: #a3e635; font-weight: 500; }
        .cp-free-amt { font-weight: 800; }
        .cp-cta-btn { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 1rem 1.2rem; border-radius: 13px; border: none; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); color: #052e16; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.02em; cursor: pointer; transition: all 0.18s ease; width: 100%; }
        .cp-cta-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(163,230,53,0.3); }
        .cp-cta-btn:disabled { background: rgba(255,255,255,0.07); color: #374151; cursor: not-allowed; box-shadow: none; transform: none; }
        .cp-ghost-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 1rem 1.1rem; border-radius: 13px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: #9ca3af; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .cp-ghost-btn:hover { border-color: rgba(163,230,53,0.25); color: #a3e635; }

        .cp-addr-wrap { animation: cp-fadein 0.25s ease; }
        .cp-addr-section-lbl { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.7rem; }
        .cp-locate-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 1rem 1.2rem; border-radius: 13px; cursor: pointer; background: rgba(163,230,53,0.05); border: 1.5px dashed rgba(163,230,53,0.28); color: #a3e635; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600; transition: all 0.18s; margin-bottom: 1.2rem; }
        .cp-locate-btn:hover:not(:disabled) { background: rgba(163,230,53,0.1); border-color: rgba(163,230,53,0.5); }
        .cp-locate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-locate-icon-box { width: 34px; height: 34px; border-radius: 8px; background: rgba(163,230,53,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cp-locate-txt { flex: 1; text-align: left; line-height: 1.2; }
        .cp-locate-sub { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 4px; font-weight: 400; }
        .cp-addr-divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.2rem; }
        .cp-addr-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .cp-addr-div-txt { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; white-space: nowrap; }
        .cp-addr-search-wrap { position: relative; margin-bottom: 1rem; }
        .cp-addr-input-row { display: flex; align-items: center; gap: 10px; padding: 0 1.1rem; background: rgba(13,16,24,0.85); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 13px; transition: all 0.18s; }
        .cp-addr-input-row.focused { border-color: rgba(163,230,53,0.38); box-shadow: 0 0 0 3px rgba(163,230,53,0.07); }
        .cp-addr-search-ico { color: #6b7280; flex-shrink: 0; transition: color 0.15s; }
        .cp-addr-input-row.focused .cp-addr-search-ico { color: #a3e635; }
        .cp-addr-input { flex: 1; background: transparent; border: none; outline: none; padding: 1rem 0; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #f3f4f6; }
        .cp-addr-input::placeholder { color: #4b5563; }
        .cp-addr-clear { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.08); border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.13s; flex-shrink: 0; }
        .cp-addr-clear:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .cp-addr-dropdown { position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 100; background: rgba(9,11,19,0.99); border: 1px solid rgba(255,255,255,0.1); border-radius: 13px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.7); animation: cp-drop 0.15s ease; }
        .cp-addr-sugg { display: flex; align-items: flex-start; gap: 10px; padding: 0.9rem 1.1rem; cursor: pointer; transition: background 0.1s; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .cp-addr-sugg:last-child { border-bottom: none; }
        .cp-addr-sugg:hover { background: rgba(163,230,53,0.07); }
        .cp-addr-sugg-pin { width: 28px; height: 28px; border-radius: 7px; background: rgba(163,230,53,0.1); color: #a3e635; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .cp-addr-sugg-main { font-size: 0.9rem; color: #e5e7eb; font-weight: 600; line-height: 1.4; }
        .cp-addr-sugg-sub { font-size: 0.75rem; color: #6b7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px; }
        .cp-addr-pill { display: flex; align-items: flex-start; gap: 8px; padding: 0.75rem 1rem; background: rgba(163,230,53,0.06); border: 1px solid rgba(163,230,53,0.2); border-radius: 10px; margin-bottom: 1rem; animation: cp-fadein 0.2s ease; }
        .cp-addr-pill-txt { font-size: 0.85rem; color: #bbf7a0; line-height: 1.5; font-weight: 500; }
        .cp-delivery-banner { display: flex; align-items: center; gap: 12px; padding: 1rem 1.2rem; border-radius: 12px; border: 1px solid; margin-bottom: 1.2rem; animation: cp-fadein 0.2s ease; }
        .cp-delivery-banner.checking    { background: rgba(251,191,36,0.07);  border-color: rgba(251,191,36,0.2);  color: #fbbf24; }
        .cp-delivery-banner.available   { background: rgba(52,211,153,0.07);  border-color: rgba(52,211,153,0.22); color: #34d399; }
        .cp-delivery-banner.unavailable { background: rgba(248,113,113,0.07); border-color: rgba(248,113,113,0.2); color: #f87171; }
        .cp-del-title { font-size: 0.9rem; font-weight: 700; }
        .cp-del-sub   { font-size: 0.8rem; opacity: 0.8; margin-top: 2px; }
        .cp-addr-fields { display: flex; flex-direction: column; gap: 0.85rem; animation: cp-fadein 0.2s ease; }
        .cp-addr-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .cp-addr-lbl { font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.07em; }
        .cp-addr-finput { padding: 0.85rem 1rem; background: rgba(13,16,24,0.85); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #f3f4f6; outline: none; transition: all 0.17s; }
        .cp-addr-finput::placeholder { color: #4b5563; }
        .cp-addr-finput:focus { border-color: rgba(163,230,53,0.35); box-shadow: 0 0 0 3px rgba(163,230,53,0.06); }
        .cp-addr-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
        .cp-addr-nav { display: flex; gap: 0.85rem; margin-top: 1.5rem; }
        .cp-addr-nav .cp-ghost-btn { flex: 0 0 auto; padding-left: 1.2rem; padding-right: 1.2rem; }
        .cp-addr-nav .cp-cta-btn  { flex: 1; }

        .cp-pay-wrap { animation: cp-fadein 0.25s ease; }
        .cp-addr-review { padding: 1rem 1.2rem; background: rgba(163,230,53,0.07); border: 1px solid rgba(163,230,53,0.2); border-radius: 12px; margin-bottom: 1.5rem; }
        .cp-addr-review-lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #84cc16; margin-bottom: 0.4rem; }
        .cp-addr-review-val { font-size: 0.95rem; color: #d1fae5; line-height: 1.5; }
        .cp-pay-options { display: flex; flex-direction: column; gap: 0.8rem; }
        .cp-pay-opt { display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem 1.2rem; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.07); border-radius: 13px; cursor: pointer; transition: all 0.17s; }
        .cp-pay-opt:hover { border-color: rgba(163,230,53,0.22); background: rgba(163,230,53,0.04); }
        .cp-pay-opt.selected { background: rgba(163,230,53,0.08); border-color: rgba(163,230,53,0.35); }
        .cp-pay-radio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.18); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .cp-pay-opt.selected .cp-pay-radio { border-color: #a3e635; }
        .cp-pay-dot { width: 10px; height: 10px; border-radius: 50%; background: #a3e635; transform: scale(0); transition: transform 0.15s; }
        .cp-pay-opt.selected .cp-pay-dot { transform: scale(1); }
        .cp-pay-ico { width: 42px; height: 42px; border-radius: 10px; background: rgba(163,230,53,0.1); color: #a3e635; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cp-pay-name { font-size: 1rem; font-weight: 700; color: #e5e7eb; }
        .cp-pay-desc { font-size: 0.8rem; color: #6b7280; margin-top: 3px; }
        .cp-pay-nav { display: flex; gap: 0.85rem; margin-top: 1.8rem; }
        .cp-pay-nav .cp-ghost-btn { flex: 0 0 auto; }
        .cp-pay-nav .cp-cta-btn   { flex: 1; }

        .cp-confirm-wrap { animation: cp-fadein 0.25s ease; }
        .cp-confirm-items { margin-bottom: 1.5rem; }
        .cp-confirm-item { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 1rem; }
        .cp-confirm-item:last-child { border-bottom: none; }
        .cp-confirm-item-name  { font-size: 0.95rem; color: #e5e7eb; font-weight: 600; }
        .cp-confirm-item-meta  { font-size: 0.8rem; color: #6b7280; margin-top: 3px; }
        .cp-confirm-item-price { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #a3e635; white-space: nowrap; }
        .cp-confirm-info { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.5rem; }
        .cp-confirm-info-box { padding: 1rem 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; }
        .cp-confirm-info-lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 0.5rem; }
        .cp-confirm-info-val { font-size: 0.9rem; color: #d1d5db; line-height: 1.5; font-weight: 500; }
        .cp-confirm-nav { display: flex; gap: 0.85rem; margin-top: 1.8rem; }
        .cp-confirm-nav .cp-ghost-btn { flex: 0 0 auto; }
        .cp-confirm-nav .cp-cta-btn   { flex: 1; }

        .cp-empty { text-align: center; padding: 4rem 1rem; animation: cp-fadein 0.3s ease; }
        .cp-empty-ico { width: 80px; height: 80px; margin: 0 auto 1.5rem; border-radius: 50%; background: rgba(163,230,53,0.07); border: 1px solid rgba(163,230,53,0.15); display: flex; align-items: center; justify-content: center; color: rgba(163,230,53,0.6); }
        .cp-empty-title { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: #e5e7eb; margin-bottom: 0.5rem; }
        .cp-empty-sub { font-size: 0.9rem; color: #6b7280; margin-bottom: 1.5rem; }
        .cp-shop-link { display: inline-flex; align-items: center; gap: 6px; padding: 0.85rem 1.5rem; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); border: none; border-radius: 12px; color: #052e16; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; cursor: pointer; text-decoration: none; transition: all 0.15s; }
        .cp-shop-link:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(163,230,53,0.28); }

        .cp-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; padding: 0.8rem 1.2rem; border-radius: 10px; font-size: 0.9rem; font-weight: 500; font-family: 'DM Sans', sans-serif; border: 1px solid; backdrop-filter: blur(14px); animation: cp-toast 0.25s ease; max-width: 320px; pointer-events: none; }
        .cp-toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
        .cp-toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }

        @media (max-width: 480px) { .cp-addr-row2 { grid-template-columns: 1fr; } .cp-confirm-info { grid-template-columns: 1fr; } }
      `}</style>

      <div className="cp-root">
        <UserNav cartCount={cartCount} />

        <main className="cp-main">
          <div className="cp-header">
            <Link href="/userdashboard" className="cp-back-link"><ArrowLeftIcon /> Back</Link>
            <h1 className="cp-page-title">{pageTitle}</h1>
          </div>

          {loading ? (
            /* ── SKELETON CART ── */
            <div className="cp-layout">
              {/* items glass */}
              <div className="cp-glass">
                <div className="cp-items-head">
                  <div className="cp-skeleton" style={{ height: 14, width: 80, borderRadius: 5 }} />
                  <div className="cp-skeleton" style={{ height: 28, width: 80, borderRadius: 6 }} />
                </div>
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCartItem key={i} />)}
              </div>

              {/* bill glass */}
              <SkeletonBillCard />
            </div>
          ) : (
            <>
              {!(checkoutStep === 'cart' && cartItems.length === 0) && <StepBar current={checkoutStep} />}

              {/* ── CART ── */}
              {checkoutStep === 'cart' && (
                cartItems.length === 0 ? (
                  <div className="cp-empty">
                    <div className="cp-empty-ico"><CartEmptyIcon /></div>
                    <h2 className="cp-empty-title">Your cart is empty</h2>
                    <p className="cp-empty-sub">Looks like you haven't added anything yet.</p>
                    <Link href="/userdashboard/products" className="cp-shop-link">Browse Products <ChevronRightIcon /></Link>
                  </div>
                ) : (
                  <div className="cp-layout">
                    <div className="cp-glass">
                      <div className="cp-items-head">
                        <span className="cp-items-count">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                        <button className="cp-clear-btn" onClick={clearCart}>Clear Cart</button>
                      </div>
                      {cartItems.map(item => {
                        const maxStock = getItemStock(item);
                        const qty = item.quantity || 1;
                        const atStockLimit = qty >= maxStock;
                        return (
                          <div key={item.id} className="cp-item">
                            <img src={getProductImage(item)} alt={item.products?.name} className="cp-item-img" />
                            <div className="cp-item-body">
                              <h3 className="cp-item-name">{item.products?.name}</h3>
                              {getVariantName(item) && <span className="cp-item-variant">{getVariantName(item)}</span>}
                              <span className="cp-item-price">₹{getProductPrice(item).toFixed(0)}</span>
                              {maxStock <= 5 && maxStock !== Infinity && <span className="cp-item-stock-warn">Only {maxStock} left</span>}
                              <div className="cp-item-foot">
                                <div className="cp-qty">
                                  <button className="cp-qty-btn" disabled={updating === item.id || qty <= 1} onClick={() => updateQuantity(item.id, qty - 1, maxStock)}><MinusIcon /></button>
                                  <span className="cp-qty-val">{qty}</span>
                                  <button className="cp-qty-btn" disabled={updating === item.id || atStockLimit} title={atStockLimit ? `Max available: ${maxStock}` : undefined} onClick={() => updateQuantity(item.id, qty + 1, maxStock)}><PlusIcon /></button>
                                </div>
                                <button className="cp-rm-btn" onClick={() => removeItem(item.id)}><TrashIcon /> Remove</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cp-glass cp-bill-details">
                      <h3 className="cp-bill-title">Bill Details</h3>
                      <div className="cp-bill-row"><span className="cp-bill-lbl">Item Total ({cartItems.length} items)</span><span className="cp-bill-val">₹{subtotal.toFixed(2)}</span></div>
                      <div className="cp-bill-row"><span className="cp-bill-lbl">Delivery Charges</span><span className="cp-bill-val">{deliveryFee === 0 ? <span style={{ color: '#a3e635' }}>FREE</span> : `₹${deliveryFee}`}</span></div>
                      <div className="cp-bill-divider" />
                      <div className="cp-bill-total"><span className="cp-bill-total-lbl">Grand Total</span><span className="cp-bill-total-val">₹{total.toFixed(2)}</span></div>
                      {deliveryFee > 0 && (
                        <div className="cp-free-banner"><p className="cp-free-txt">Add <span className="cp-free-amt">₹{(500 - subtotal).toFixed(0)}</span> more for free delivery!</p></div>
                      )}
                      <button className="cp-cta-btn" style={{ marginTop: '1.5rem' }} onClick={() => {
                        const overLimit = cartItems.filter(item => (item.quantity || 1) > getItemStock(item));
                        if (overLimit.length > 0) { showToast('error', 'Fix quantities before continuing'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
                        setCheckoutStep('address');
                      }}>
                        Proceed to Checkout <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* ── ADDRESS ── */}
              {checkoutStep === 'address' && (
                <div className="cp-glass">
                  <AddressStep onBack={() => setCheckoutStep('cart')} onConfirm={(data) => { setAddressData(data); setCheckoutStep('payment'); }} />
                </div>
              )}

              {/* ── PAYMENT ── */}
              {checkoutStep === 'payment' && addressData && (
                <div className="cp-glass cp-pay-wrap">
                  <div className="cp-addr-review">
                    <p className="cp-addr-review-lbl">Delivering to</p>
                    <p className="cp-addr-review-val">{addressData.delivery_address}, {addressData.pincode}</p>
                  </div>
                  <p className="cp-addr-section-lbl" style={{ marginBottom: '0.75rem' }}>Select payment method</p>
                  <div className="cp-pay-options">
                    {[
                      { id: 'cod',    name: 'Cash on Delivery', desc: 'Pay in cash when your order arrives',                         icon: <CodIcon /> },
                      { id: 'online', name: 'Online Payment',   desc: 'UPI, credit / debit card, net banking via Razorpay',          icon: <CardIcon /> },
                    ].map(opt => (
                      <div key={opt.id} className={`cp-pay-opt${paymentMethod === opt.id ? ' selected' : ''}`} onClick={() => setPaymentMethod(opt.id)}>
                        <div className="cp-pay-radio"><div className="cp-pay-dot" /></div>
                        <div className="cp-pay-ico">{opt.icon}</div>
                        <div><div className="cp-pay-name">{opt.name}</div><div className="cp-pay-desc">{opt.desc}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="cp-pay-nav">
                    <button className="cp-ghost-btn" onClick={() => setCheckoutStep('address')}><ArrowLeftIcon /> Back</button>
                    <button className="cp-cta-btn" onClick={() => setCheckoutStep('confirm')}>Review Order <ChevronRightIcon /></button>
                  </div>
                </div>
              )}

              {/* ── CONFIRM ── */}
              {checkoutStep === 'confirm' && addressData && (
                <div className="cp-glass cp-confirm-wrap">
                  <p className="cp-addr-section-lbl" style={{ marginBottom: '1rem' }}>Order Items</p>
                  <div className="cp-confirm-items">
                    {cartItems.map(item => (
                      <div key={item.id} className="cp-confirm-item">
                        <div>
                          <div className="cp-confirm-item-name">{item.products?.name}</div>
                          <div className="cp-confirm-item-meta">Qty {item.quantity}{getVariantName(item) ? ` · ${getVariantName(item)}` : ''}</div>
                        </div>
                        <span className="cp-confirm-item-price">₹{(getProductPrice(item) * (item.quantity || 1)).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cp-confirm-info">
                    <div className="cp-confirm-info-box">
                      <p className="cp-confirm-info-lbl">Delivery address</p>
                      <p className="cp-confirm-info-val">{addressData.delivery_address}</p>
                      <p className="cp-confirm-info-val" style={{ color: '#6b7280', marginTop: 3 }}>Pincode: {addressData.pincode}</p>
                    </div>
                    <div className="cp-confirm-info-box">
                      <p className="cp-confirm-info-lbl">Payment</p>
                      <p className="cp-confirm-info-val">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online — Razorpay'}</p>
                      {userProfile && <p className="cp-confirm-info-val" style={{ color: '#6b7280', marginTop: 3 }}>{userProfile.full_name} · {userProfile.phone || '—'}</p>}
                    </div>
                  </div>
                  <div className="cp-bill-divider" style={{ margin: '1rem 0' }} />
                  <div className="cp-bill-total" style={{ marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: 2 }}>Subtotal + {deliveryFee === 0 ? 'free delivery' : `₹${deliveryFee} delivery`}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{paymentMethod === 'cod' ? "You'll pay on delivery" : 'Secure payment via Razorpay'}</div>
                    </div>
                    <span className="cp-bill-total-val">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="cp-confirm-nav">
                    <button className="cp-ghost-btn" onClick={() => setCheckoutStep('payment')}><ArrowLeftIcon /> Back</button>
                    <button className="cp-cta-btn" onClick={placeOrder} disabled={processing}>
                      {processing ? <><SpinnerRing size={16} color="#052e16" /> Placing…</> : `Place Order · ₹${total.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {toast && <div className={`cp-toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}