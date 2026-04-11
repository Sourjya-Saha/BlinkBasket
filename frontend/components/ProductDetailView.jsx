'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const ShoppingBag = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const ArrowLeft = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const Bell = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>);

export default function ProductDetailView({ product, onAddToCart, addingToCart }) {
  const { data: session } = useSession();
  const [tab, setTab] = useState('details');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const autoPlayRef = useRef(null);

  const [isNotifying, setIsNotifying] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);

  const images = product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')) : [];
  const variants = product.product_variants?.filter(v => v.is_active !== false) || [];

  useEffect(() => {
    if (images.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % images.length);
    }, 1500);

    return () => clearInterval(autoPlayRef.current);
  }, [images.length]);

  const handleThumbnailClick = (index) => {
    setActiveImg(index);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setActiveImg((prev) => (prev + 1) % images.length);
      }, 1500);
    }
  };

  const handleVariantClick = (v) => {
    setSelectedVariant(selectedVariant?.id === v.id ? null : v);
  };

  const price = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.price);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleNotifyMe = async () => {
    if (!session?.accessToken) {
      alert("Please log in to subscribe to alerts.");
      return;
    }

    setIsNotifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ product_id: product.id })
      });

      if (res.ok) {
        setHasSubscribed(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to subscribe to alerts.');
      }
    } catch (error) {
      console.error('Error subscribing to stock alerts:', error);
      alert('Network error. Please try again later.');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="pdv-root">
      <style>{`
        .pdv-nav-back { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; text-decoration: none; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; transition: 0.2s; }
        .pdv-nav-back:hover { color: #a3e635; }

        .pdv-container { display: grid; grid-template-columns: 380px 1fr; gap: 2.5rem; }
        
        .pdv-left { display: flex; flex-direction: column; gap: 1rem; }
        .pdv-main-img-wrap { width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; background: #0c111a; border: 1px solid rgba(255,255,255,0.08); }
        .pdv-main-img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.4s ease-in-out; }
        
        .pdv-thumbs { display: flex; gap: 0.6rem; overflow-x: auto; scrollbar-width: none; }
        .pdv-thumb { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; cursor: pointer; border: 2px solid transparent; transition: 0.2s; opacity: 0.5; }
        .pdv-thumb.active { border-color: #a3e635; opacity: 1; }

        .pdv-right { display: flex; flex-direction: column; gap: 1rem; }
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

        .pdv-actions { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .pdv-qty { display: flex; align-items: center; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 0.3rem; border: 1px solid rgba(255,255,255,0.08); }
        .pdv-qty-btn { width: 30px; height: 30px; border: none; background: transparent; color: #fff; cursor: pointer; font-size: 1rem; }
        .pdv-qty-val { width: 30px; text-align: center; font-weight: 700; color: #fff; font-size: 0.9rem; }
        
        .pdv-add-btn { flex: 1; height: 48px; border-radius: 12px; border: none; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); color: #052e16; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .pdv-add-btn:hover:not(:disabled) { transform: translateY(-2px); }

        /* Improved Notify Me Button */
        .pdv-notify-btn { 
          flex: 1; 
          height: 48px; 
          border-radius: 12px; 
          border: none; 
          background-color: #a3e635; /* Emerald Green */
          color: #042f2e; /* Deep Green-Cyan Font */
          font-weight: 800; 
          font-size: 0.8rem; 
          cursor: pointer; 
          font-family: 'Syne', sans-serif;
          transition: all 0.3s ease; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          
        }
        .pdv-notify-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); 
        }
        .pdv-notify-btn:disabled { 
          background: #a3e635; /* Dark emerald background when subscribed */
          color: #042f2e; /* Light green text */
          opacity: 0.8; 
          cursor: not-allowed; 
          box-shadow: none; 
          transform: none;
        }

        @media (max-width: 800px) {
          .pdv-container { grid-template-columns: 1fr; }
          .pdv-left { max-width: 400px; }
        }
      `}</style>

      <Link href="/userdashboard" className="pdv-nav-back">
        <ArrowLeft /> Back to Home
      </Link>

      <div className="pdv-container">
        {/* Gallery */}
        <div className="pdv-left">
          <div className="pdv-main-img-wrap">
            <img 
              key={activeImg}
              src={images[activeImg] || '/placeholder-product.png'} 
              className="pdv-main-img" 
              alt={product.name} 
            />
          </div>
          <div className="pdv-thumbs">
            {images.map((img, i) => (
              <img 
                key={i} src={img} 
                className={`pdv-thumb ${i === activeImg ? 'active' : ''}`} 
                onClick={() => handleThumbnailClick(i)} alt="" 
              />
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
            {product.is_featured && <span className="pdv-badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24' }}>★ Featured</span>} 
            <span className="pdv-badge" style={{ color: stock > 0 ? '#34d399' : '#f87171' }}>
              {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
            </span>
          </div>

          <div className="pdv-price">₹{price.toFixed(0)}</div>

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="pdv-variant-label">Select Option</p>
              <div className="pdv-variant-grid">
                {variants.map(v => (
                  <button 
                    key={v.id} 
                    className={`pdv-variant-btn ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => handleVariantClick(v)}
                  >
                    {v.variant_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details / Specs Tabs */}
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
                  {product.extra_details && Object.entries(product.extra_details).length > 0 ? (
                    Object.entries(product.extra_details).map(([k, v]) => (
                      <div key={k} className="pdv-spec-row">
                        <span className="pdv-spec-key">{k}</span>
                        <span className="pdv-spec-val">{v}</span>
                      </div>
                    ))
                  ) : 'No specifications provided.'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pdv-actions">
            {stock > 0 ? (
              <>
                <div className="pdv-qty">
                  <button className="pdv-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span className="pdv-qty-val">{quantity}</span>
                  <button className="pdv-qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                <button 
                  className="pdv-add-btn" 
                  disabled={addingToCart}
                  onClick={() => onAddToCart(product.id, selectedVariant?.id, quantity)}
                >
                  <ShoppingBag /> {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </>
            ) : (
              <button 
                className="pdv-notify-btn"
                onClick={handleNotifyMe}
                disabled={isNotifying || hasSubscribed}
              >
                <Bell /> 
                {hasSubscribed ? 'Subscribed to Alerts' : (isNotifying ? 'Subscribing...' : 'Notify Me When Available')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}