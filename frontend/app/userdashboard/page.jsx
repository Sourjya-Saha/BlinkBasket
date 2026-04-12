'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserNav from '../../components/UserNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

/* ─── Skeleton Components ─── */

function SkeletonCategoryCard() {
  return (
    <div className="ud-skeleton-category-card">
      <div className="ud-skeleton ud-skeleton-category-icon" />
      <div className="ud-skeleton ud-skeleton-category-name" />
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="ud-skeleton-product-card">
      <div className="ud-skeleton ud-skeleton-product-img" />
      <div className="ud-skeleton-product-body">
        <div className="ud-skeleton ud-skeleton-product-title" />
        <div className="ud-skeleton ud-skeleton-product-desc" />
        <div className="ud-skeleton-product-footer">
          <div className="ud-skeleton ud-skeleton-price" />
          <div className="ud-skeleton ud-skeleton-btn" />
        </div>
      </div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="ud-hero">
      <div className="ud-skeleton ud-skeleton-greeting" />
      <div className="ud-skeleton ud-skeleton-subtitle" />
      <div className="ud-search-wrap">
        <div className="ud-search-form" style={{ pointerEvents: 'none' }}>
          <div className="ud-skeleton ud-skeleton-search-input" />
          <div className="ud-skeleton ud-skeleton-search-btn" />
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockAlertLoading, setStockAlertLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${session.accessToken}` };

        const profileRes = await fetch(`${API_BASE}/me`, { headers });
        const profileData = await profileRes.json();
        setProfile(profileData);

        const catRes = await fetch(`${API_BASE}/api/categories`);
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);

        const featuredRes = await fetch(`${API_BASE}/api/products?is_featured=true&limit=8`, { headers });
        const featuredData = await featuredRes.json();
        setFeaturedProducts(featuredData.data || []);

        const recentRes = await fetch(`${API_BASE}/api/products?limit=12&sort=created_at&order=desc`, { headers });
        const recentData = await recentRes.json();
        setRecentProducts(recentData.data || []);

        const allRes = await fetch(`${API_BASE}/api/products?limit=50`, { headers });
        const allData = await allRes.json();
        setAllProducts(allData.data || []);

        const cartRes = await fetch(`${API_BASE}/cart`, { headers });
        const cartData = await cartRes.json();
        setCartCount(cartData.items?.length || 0);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, session]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        const query = searchQuery.toLowerCase();
        const filtered = allProducts.filter(p => {
          const name = p.name?.toLowerCase() || '';
          const desc = p.description?.toLowerCase() || '';
          const category = p.categories?.name?.toLowerCase() || '';
          const brand = p.manufacturers?.name?.toLowerCase() || '';
          return name.includes(query) || desc.includes(query) || category.includes(query) || brand.includes(query);
        }).slice(0, 8);

        setSearchSuggestions(filtered);
        setShowSuggestions(true);
      }, 200);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allProducts]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/userdashboard/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleProductClick = (product) => {
    const identifier = product.slug;
    router.push(`/userdashboard/products/${identifier}`);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  }, []);

  async function addToCart(productId, variantId = null) {
    if (!session?.accessToken) return;
    setAddingToCart(true);
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity })
      });
      if (res.ok) {
        showToast('success', 'Added to cart!');
        setCartCount(c => c + 1);
        handleCloseModal();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to add to cart');
      }
    } catch (err) {
      showToast('error', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  }

  async function setStockAlert(productId) {
    if (!session?.accessToken) return;
    setStockAlertLoading(true);
    try {
      const res = await fetch(`${API_BASE}/alerts/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      if (res.ok) {
        showToast('success', 'We will notify you when this is back in stock!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to set alert');
      }
    } catch (err) {
      showToast('error', 'Failed to set stock alert');
    } finally {
      setStockAlertLoading(false);
    }
  }

  function getProductImages(product) {
    if (!product.images) return [];
    if (Array.isArray(product.images)) return product.images;
    try {
      return JSON.parse(product.images) || [];
    } catch {
      return [];
    }
  }

  function getEffectivePrice(product, variant) {
    if (variant) return parseFloat(variant.price) || parseFloat(product.price);
    return parseFloat(product.price);
  }

  function getEffectiveStock(product, variant) {
    if (variant) return variant.stock;
    return product.stock;
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0c10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(163,230,53,0.2)',
          borderTopColor: '#a3e635',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const user = profile || session?.user;
  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ud-root {
          min-height: 100vh;
          background: #0a0c10;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .ud-root::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%, rgba(163,230,53,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 100%, rgba(163,230,53,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ud-main {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 0 auto;
          padding: 0 1rem 3rem;
        }

        /* ─── SKELETON BASE ─── */
        @keyframes ud-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

        .ud-skeleton {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 600px 100%;
          animation: ud-shimmer 1.6s infinite linear;
          border-radius: 8px;
        }

        /* Hero skeletons */
        .ud-skeleton-greeting {
          height: 36px;
          width: 260px;
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .ud-skeleton-subtitle {
          height: 16px;
          width: 200px;
          border-radius: 6px;
          margin-bottom: 0;
        }

        .ud-skeleton-search-input {
          flex: 1;
          height: 20px;
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 600px 100%;
          animation: ud-shimmer 1.6s infinite linear;
        }

        .ud-skeleton-search-btn {
          width: 90px;
          height: 38px;
          border-radius: 12px;
          flex-shrink: 0;
          background: linear-gradient(
            90deg,
            rgba(163,230,53,0.07) 25%,
            rgba(163,230,53,0.14) 50%,
            rgba(163,230,53,0.07) 75%
          );
          background-size: 600px 100%;
          animation: ud-shimmer 1.6s infinite linear;
        }

        /* Section header skeleton */
        .ud-skeleton-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
        }

        .ud-skeleton-section-title {
          height: 22px;
          width: 180px;
          border-radius: 8px;
        }

        .ud-skeleton-section-link {
          height: 14px;
          width: 60px;
          border-radius: 6px;
        }

        /* Category skeleton */
        .ud-skeleton-category-card {
          background: rgba(13, 16, 24, 0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
        }

        .ud-skeleton-category-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
        }

        .ud-skeleton-category-name {
          height: 14px;
          width: 70px;
          border-radius: 6px;
        }

        /* Product skeleton */
        .ud-skeleton-product-card {
          background: rgba(13, 16, 24, 0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
        }

        .ud-skeleton-product-img {
          width: 100%;
          height: 160px;
          border-radius: 0;
        }

        .ud-skeleton-product-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ud-skeleton-product-title {
          height: 16px;
          width: 80%;
          border-radius: 6px;
        }

        .ud-skeleton-product-desc {
          height: 12px;
          width: 65%;
          border-radius: 5px;
        }

        .ud-skeleton-product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.2rem;
        }

        .ud-skeleton-price {
          height: 20px;
          width: 60px;
          border-radius: 6px;
        }

        .ud-skeleton-btn {
          height: 30px;
          width: 60px;
          border-radius: 8px;
        }

        /* ─── HERO SECTION ─── */
        .ud-hero {
          padding: 0 0 2.2rem;
        }

        .ud-greeting {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
        }

        .ud-greeting span { color: #a3e635; }

        .ud-subtitle {
          font-size: 0.9rem;
          color: #6b7280;
        }

        /* SEARCH BAR */
        .ud-search-wrap {
          margin-top: 1.5rem;
          position: relative;
        }

        .ud-search-form {
          display: flex;
          align-items: center;
          background: rgba(13, 16, 24, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 0.3rem 0.3rem 0.3rem 1rem;
          transition: border-color 0.2s;
          position: relative;
        }

        .ud-search-form:focus-within { border-color: rgba(163, 230, 53, 0.4); }

        .ud-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          padding: 0.7rem 0;
        }

        .ud-search-input::placeholder { color: #4b5563; }

        .ud-search-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.6rem 1.2rem;
          background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);
          border: none;
          border-radius: 12px;
          color: #052e16;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .ud-search-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(163, 230, 53, 0.3);
        }

        /* SEARCH SUGGESTIONS */
        .ud-search-suggestions {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: rgba(13, 16, 24, 0.98);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 50;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .ud-suggestion-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .ud-suggestion-item:last-child { border-bottom: none; }
        .ud-suggestion-item:hover { background: rgba(163, 230, 53, 0.08); }

        .ud-suggestion-img {
          width: 48px; height: 48px;
          border-radius: 8px;
          object-fit: cover;
          background: #0c111a;
          flex-shrink: 0;
        }

        .ud-suggestion-info { flex: 1; min-width: 0; }

        .ud-suggestion-name {
          font-family: 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #e5e7eb;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ud-suggestion-meta {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
        }

        .ud-suggestion-price {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #a3e635;
          flex-shrink: 0;
        }

        .ud-no-results {
          padding: 1.5rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.85rem;
        }

        /* SECTIONS */
        .ud-section { margin-bottom: 2.5rem; }

        .ud-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
        }

        .ud-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .ud-section-link {
          font-size: 0.8rem;
          color: #a3e635;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .ud-section-link:hover { color: #84cc16; }

        /* CATEGORY CARDS */
        .ud-categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .ud-category-card {
          background: rgba(13, 16, 24, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 1.2rem 1rem;
          text-decoration: none;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
          cursor: pointer;
        }

        .ud-category-card:hover {
          border-color: rgba(163, 230, 53, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .ud-category-icon {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(163,230,53,0.15) 0%, rgba(132,204,22,0.08) 100%);
          border: 1px solid rgba(163,230,53,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .ud-category-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #e5e7eb;
          text-align: center;
        }

        /* PRODUCT CARDS */
        .ud-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.2rem;
        }

        @media (max-width: 768px) {
          .ud-products-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 0.75rem;
            padding-left: 0.75rem;
            padding-bottom: 0.5rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .ud-products-grid::-webkit-scrollbar { display: none; }
          .ud-product-card {
            flex: 0 0 auto;
            width: 75vw;
            max-width: 280px;
            scroll-snap-align: start;
          }
          .ud-skeleton-product-card {
            flex: 0 0 auto;
            width: 75vw;
            max-width: 280px;
            scroll-snap-align: start;
          }
        }

        .ud-product-card {
          background: rgba(13, 16, 24, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
        }

        .ud-product-card:hover {
          border-color: rgba(163, 230, 53, 0.25);
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        }

        .ud-product-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #0c111a;
        }

        .ud-product-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .ud-product-card:hover .ud-product-img { transform: scale(1.05); }

        .ud-product-badge {
          position: absolute;
          top: 8px; left: 8px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1e1b4b;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .ud-product-body { padding: 1rem; }

        .ud-product-name {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 0.4rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ud-product-desc {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.7rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ud-product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ud-product-price {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #a3e635;
        }

        .ud-product-add {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0.4rem 0.7rem;
          background: rgba(163, 230, 53, 0.1);
          border: 1px solid rgba(163, 230, 53, 0.25);
          border-radius: 8px;
          color: #a3e635;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ud-product-add:hover { background: rgba(163, 230, 53, 0.2); }

        /* TOAST */
        .ud-toast {
          position: fixed;
          bottom: 1.5rem; right: 1.5rem;
          z-index: 999;
          padding: 0.75rem 1.2rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid;
          backdrop-filter: blur(12px);
          animation: udUp 0.25s ease;
        }

        .ud-toast.success {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .ud-toast.error {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        @keyframes udUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .ud-main { padding: 0 0.75rem 2rem; }
          .ud-categories-grid { grid-template-columns: repeat(3, 1fr); }
          .ud-product-img-wrap { height: 130px; }
          .ud-skeleton-product-img { height: 130px; }
          .ud-skeleton-greeting { width: 180px; height: 28px; }
        }
      `}</style>

      <div className="ud-root">
        <UserNav cartCount={cartCount} />

        <main className="ud-main">

          {/* ─── HERO ─── */}
          {loading ? (
            <SkeletonHero />
          ) : (
            <div className="ud-hero">
              <h1 className="ud-greeting">
                Hey, <span>{firstName}</span>
              </h1>
              <p className="ud-subtitle">What would you like to order today?</p>

              <div className="ud-search-wrap">
                <form className="ud-search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    className="ud-search-input"
                    placeholder="Search for products, brands and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <button type="submit" className="ud-search-btn">
                    <SearchIcon />
                    Search
                  </button>
                </form>

                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="ud-search-suggestions">
                    {searchSuggestions.map(product => {
                      const images = getProductImages(product);
                      return (
                        <div
                          key={product.id}
                          className="ud-suggestion-item"
                          onClick={() => {
                            handleProductClick(product);
                            setShowSuggestions(false);
                            setSearchQuery('');
                          }}
                        >
                          <img
                            src={images[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="ud-suggestion-img"
                          />
                          <div className="ud-suggestion-info">
                            <p className="ud-suggestion-name">{product.name}</p>
                            <p className="ud-suggestion-meta">
                              {product.categories?.name}{product.categories?.name && product.manufacturers?.name && ' · '}{product.manufacturers?.name}
                            </p>
                          </div>
                          <span className="ud-suggestion-price">₹{parseFloat(product.price).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {showSuggestions && searchSuggestions.length === 0 && searchQuery.trim().length >= 2 && (
                  <div className="ud-search-suggestions">
                    <div className="ud-no-results">
                      <PackageIcon />
                      <p style={{ marginTop: '0.75rem' }}>No products found for "{searchQuery}"</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try searching for something else</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── CATEGORIES ─── */}
          <section className="ud-section">
            <div className="ud-section-header">
              {loading ? (
                <>
                  <div className="ud-skeleton ud-skeleton-section-title" />
                  <div className="ud-skeleton ud-skeleton-section-link" />
                </>
              ) : (
                <>
                  <h2 className="ud-section-title">Shop by Category</h2>
                  <Link href="/userdashboard/products" className="ud-section-link">View all →</Link>
                </>
              )}
            </div>
            <div className="ud-categories-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCategoryCard key={i} />)
                : categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/userdashboard/products?category=${cat.id}`}
                      className="ud-category-card"
                    >
                      <div className="ud-category-icon">
                        {cat.image_url
                          ? <img src={cat.image_url} alt={cat.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                          : '📦'
                        }
                      </div>
                      <span className="ud-category-name">{cat.name}</span>
                    </Link>
                  ))
              }
            </div>
          </section>

          {/* ─── FEATURED PRODUCTS ─── */}
          <section className="ud-section">
            <div className="ud-section-header">
              {loading ? (
                <>
                  <div className="ud-skeleton ud-skeleton-section-title" />
                  <div className="ud-skeleton ud-skeleton-section-link" />
                </>
              ) : (
                <>
                  <h2 className="ud-section-title">Featured Products</h2>
                  <Link href="/userdashboard/products?featured=true" className="ud-section-link">View all →</Link>
                </>
              )}
            </div>
            <div className="ud-products-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)
                : featuredProducts.map((product) => {
                    const images = getProductImages(product);
                    return (
                      <div
                        key={product.id}
                        className="ud-product-card"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="ud-product-img-wrap">
                          <img
                            src={images[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="ud-product-img"
                          />
                          {product.is_featured && (
                            <span className="ud-product-badge">
                              <StarIcon /> Featured
                            </span>
                          )}
                        </div>
                        <div className="ud-product-body">
                          <h3 className="ud-product-name">{product.name}</h3>
                          <p className="ud-product-desc">{product.description?.slice(0, 50) || 'Product'}</p>
                          <div className="ud-product-footer">
                            <span className="ud-product-price">₹{parseFloat(product.price).toFixed(0)}</span>
                            <span className="ud-product-add">+ Add</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </section>

          {/* ─── RECENT PRODUCTS ─── */}
          <section className="ud-section">
            <div className="ud-section-header">
              {loading ? (
                <div className="ud-skeleton ud-skeleton-section-title" />
              ) : (
                <h2 className="ud-section-title">New Arrivals</h2>
              )}
            </div>
            <div className="ud-products-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)
                : recentProducts.slice(0, 8).map((product) => {
                    const images = getProductImages(product);
                    return (
                      <div
                        key={product.id}
                        className="ud-product-card"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="ud-product-img-wrap">
                          <img
                            src={images[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="ud-product-img"
                          />
                        </div>
                        <div className="ud-product-body">
                          <h3 className="ud-product-name">{product.name}</h3>
                          <p className="ud-product-desc">{product.description?.slice(0, 50) || 'Product'}</p>
                          <div className="ud-product-footer">
                            <span className="ud-product-price">₹{parseFloat(product.price).toFixed(0)}</span>
                            <span className="ud-product-add">+ Add</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </section>

        </main>

        {toast && (
          <div className={`ud-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </>
  );
}