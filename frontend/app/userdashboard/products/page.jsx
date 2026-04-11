'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UserNav from '@/components/UserNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // Removed viewMode state - always grid view
  const [cartCount, setCartCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at');
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'desc');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  const LIMIT = 12;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch categories and brands
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, manRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories`),
          fetch(`${API_BASE}/api/manufacturers`)
        ]);
        const catData = await catRes.json();
        const manData = await manRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
        setManufacturers(Array.isArray(manData) ? manData : []);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        sort: sortBy,
        order: sortOrder,
      });

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (selectedBrand) params.set('manufacturer_id', selectedBrand);
      if (priceRange[0] > 0) params.set('min_price', priceRange[0]);
      if (priceRange[1] < 10000) params.set('max_price', priceRange[1]);
      if (searchParams.get('featured') === 'true') params.set('is_featured', 'true');
      if (searchParams.get('product')) params.set('search', searchParams.get('product'));

      const res = await fetch(`${API_BASE}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const json = await res.json();
      setProducts(json.data || []);
      setTotal(json.count || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [session, page, searchQuery, selectedCategory, selectedBrand, priceRange, sortBy, sortOrder, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch cart count
  useEffect(() => {
    if (!session?.accessToken) return;
    const fetchCart = async () => {
      try {
        const res = await fetch(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const data = await res.json();
        setCartCount(data.items?.length || 0);
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    };
    fetchCart();
  }, [session, products]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const handleProductClick = useCallback((product) => {
    const identifier = product.slug || product.id;
    router.push(`/userdashboard/products/${identifier}`);
  }, [router]);

  async function addToCart(productId) {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      if (res.ok) {
        showToast('success', 'Added to cart!');
        setCartCount(c => c + 1);
      }
    } catch (err) {
      showToast('error', 'Failed to add to cart');
    }
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange([0, 10000]);
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
    router.push('/userdashboard/products');
  }

  const totalPages = Math.ceil(total / LIMIT);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(163,230,53,0.2)', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-root {
          min-height: 100vh;
          background: #0a0c10;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .pp-root::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%, rgba(163,230,53,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 100%, rgba(163,230,53,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .pp-main {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 0 auto;
          padding: 0 1rem 3rem;
        }

        /* PAGE HEADER */
        .pp-header {
          padding: 1.5rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pp-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.3rem, 3vw, 1.6rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .pp-count {
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* TOOLBAR */
        .pp-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .pp-search {
          flex: 1;
          min-width: 200px;
          max-width: 380px;
          background: rgba(13, 16, 24, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 11px;
          padding: 0.58rem 1rem;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .pp-search:focus {
          border-color: rgba(163, 230, 53, 0.4);
        }

        .pp-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.55rem 0.9rem;
          background: rgba(13, 16, 24, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #9ca3af;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pp-filter-btn:hover {
          border-color: rgba(163, 230, 53, 0.3);
          color: #a3e635;
        }

        .pp-select {
          background: rgba(13, 16, 24, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.55rem 0.9rem;
          color: #e5e7eb;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          outline: none;
        }

        .pp-select:focus {
          border-color: rgba(163, 230, 53, 0.4);
        }

        /* FILTERS PANEL */
        .pp-filters-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: none;
        }

        .pp-filters-overlay.open {
          display: block;
        }

        .pp-filters-panel {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 300px;
          background: rgba(10, 12, 20, 0.98);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
          z-index: 1001;
          overflow-y: auto;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }

        .pp-filters-panel.open {
          transform: translateX(0);
        }

        .pp-filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pp-filters-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        .pp-close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .pp-close-btn:hover {
          color: #fff;
        }

        .pp-filter-group {
          margin-bottom: 1.5rem;
        }

        .pp-filter-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.7rem;
        }

        .pp-filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pp-filter-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 0.7rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .pp-filter-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .pp-filter-option.selected {
          background: rgba(163, 230, 53, 0.1);
          border: 1px solid rgba(163, 230, 53, 0.2);
        }

        .pp-filter-radio {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pp-filter-option.selected .pp-filter-radio {
          border-color: #a3e635;
        }

        .pp-filter-option.selected .pp-filter-radio::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a3e635;
        }

        .pp-filter-name {
          font-size: 0.85rem;
          color: #e5e7eb;
        }

        .pp-clear-btn {
          width: 100%;
          padding: 0.7rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #fca5a5;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 1rem;
        }

        .pp-clear-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        /* PRODUCTS GRID */
        .pp-products-container {
          min-height: 400px;
        }

        .pp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.2rem;
        }

        .pp-product-card {
          background: rgba(13, 16, 24, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
        }

        .pp-product-card:hover {
          border-color: rgba(163, 230, 53, 0.25);
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        }

        .pp-product-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #0c111a;
        }

        .pp-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .pp-product-card:hover .pp-product-img {
          transform: scale(1.05);
        }

        .pp-product-badge {
          position: absolute;
          top: 8px;
          left: 8px;
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

        .pp-stock-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .pp-stock-in {
          background: rgba(52, 211, 153, 0.9);
          color: #022c22;
        }

        .pp-stock-low {
          background: rgba(251, 191, 36, 0.9);
          color: #451a03;
        }

        .pp-stock-out {
          background: rgba(239, 68, 68, 0.9);
          color: #fff;
        }

        .pp-product-body {
          padding: 1rem;
        }

        .pp-product-name {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 0.4rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pp-product-desc {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.7rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pp-product-meta {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.7rem;
          flex-wrap: wrap;
        }

        .pp-product-chip {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #9ca3af;
        }

        .pp-product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pp-product-price {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #a3e635;
        }

        .pp-product-add {
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

        .pp-product-add:hover {
          background: rgba(163, 230, 53, 0.2);
        }

        /* PAGINATION */
        .pp-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pp-page-info {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .pp-page-btns {
          display: flex;
          gap: 0.5rem;
        }

        .pp-page-btn {
          padding: 0.5rem 1rem;
          background: rgba(13, 16, 24, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #9ca3af;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .pp-page-btn:hover:not(:disabled) {
          border-color: rgba(163, 230, 53, 0.3);
          color: #a3e635;
        }

        .pp-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pp-page-current {
          padding: 0.5rem 1rem;
          background: rgba(163, 230, 53, 0.1);
          border: 1px solid rgba(163, 230, 53, 0.25);
          border-radius: 8px;
          color: #a3e635;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* EMPTY STATE */
        .pp-empty {
          text-align: center;
          padding: 4rem 1rem;
          background: rgba(13, 16, 24, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
        }

        .pp-empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          background: rgba(163, 230, 53, 0.08);
          border: 1px solid rgba(163, 230, 53, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a3e635;
        }

        .pp-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #e5e7eb;
          margin-bottom: 0.5rem;
        }

        .pp-empty-text {
          font-size: 0.85rem;
          color: #4b5563;
        }

        /* TOAST */
        .pp-toast {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 999;
          padding: 0.75rem 1.2rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid;
          backdrop-filter: blur(12px);
          animation: ppUp 0.25s ease;
        }

        .pp-toast.success {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .pp-toast.error {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        @keyframes ppUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .pp-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .pp-filters-panel { width: 280px; }
        }

        @media (max-width: 480px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pp-root">
        <UserNav cartCount={cartCount} />

        <main className="pp-main">
          {/* HEADER */}
          <div className="pp-header">
            <div>
              <h1 className="pp-title">All Products</h1>
              <p className="pp-count">{total} product{total !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="pp-toolbar">
            <input
              className="pp-search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
            <button className="pp-filter-btn" onClick={() => setShowFilters(true)}>
              <FilterIcon /> Filters
            </button>
          </div>

          {/* FILTERS PANEL */}
          <div className={`pp-filters-overlay${showFilters ? ' open' : ''}`} onClick={() => setShowFilters(false)} />
          <div className={`pp-filters-panel${showFilters ? ' open' : ''}`}>
            <div className="pp-filters-header">
              <span className="pp-filters-title">Filters</span>
              <button className="pp-close-btn" onClick={() => setShowFilters(false)}>
                <CloseIcon />
              </button>
            </div>

            {/* Categories */}
            <div className="pp-filter-group">
              <span className="pp-filter-label">Categories</span>
              <div className="pp-filter-options">
                <div
                  className={`pp-filter-option${!selectedCategory ? ' selected' : ''}`}
                  onClick={() => setSelectedCategory('')}
                >
                  <div className="pp-filter-radio" />
                  <span className="pp-filter-name">All Categories</span>
                </div>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className={`pp-filter-option${selectedCategory === String(cat.id) ? ' selected' : ''}`}
                    onClick={() => setSelectedCategory(String(cat.id))}
                  >
                    <div className="pp-filter-radio" />
                    <span className="pp-filter-name">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="pp-filter-group">
              <span className="pp-filter-label">Brands</span>
              <div className="pp-filter-options">
                <div
                  className={`pp-filter-option${!selectedBrand ? ' selected' : ''}`}
                  onClick={() => setSelectedBrand('')}
                >
                  <div className="pp-filter-radio" />
                  <span className="pp-filter-name">All Brands</span>
                </div>
                {manufacturers.map(m => (
                  <div
                    key={m.id}
                    className={`pp-filter-option${selectedBrand === String(m.id) ? ' selected' : ''}`}
                    onClick={() => setSelectedBrand(String(m.id))}
                  >
                    <div className="pp-filter-radio" />
                    <span className="pp-filter-name">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="pp-filter-group">
              <span className="pp-filter-label">Price Range</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={priceRange[0] || ''}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'rgba(13,16,24,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <span style={{ color: '#4b5563' }}>-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={priceRange[1] === 10000 ? '' : priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'rgba(13,16,24,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button className="pp-clear-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>

          {/* PRODUCTS */}
          <div className="pp-products-container">
            {loading ? (
              <div className="pp-empty">
                <div className="pp-empty-icon">
                  <div style={{ width: 24, height: 24, border: '2px solid rgba(163,230,53,0.3)', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
                <p className="pp-empty-text">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-icon"><PackageIcon /></div>
                <p className="pp-empty-title">No products found</p>
                <p className="pp-empty-text">{searchQuery || selectedCategory || selectedBrand ? 'Try adjusting your filters.' : 'Check back soon!'}</p>
              </div>
            ) : (
              <div className="pp-grid">
                {products.map(product => {
                  const images = product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')) : [];
                  const inStock = product.stock > 10;
                  const lowStock = product.stock > 0 && product.stock <= 10;
                  return (
                    <div
                      key={product.id}
                      className="pp-product-card"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="pp-product-img-wrap">
                        <img src={images[0] || '/placeholder-product.png'} alt={product.name} className="pp-product-img" />
                        {product.is_featured && (
                          <span className="pp-product-badge">
                            <StarIcon /> Featured
                          </span>
                        )}
                        <span className={`pp-stock-badge ${inStock ? 'pp-stock-in' : lowStock ? 'pp-stock-low' : 'pp-stock-out'}`}>
                          {inStock ? 'In Stock' : lowStock ? `${product.stock} left` : 'Out'}
                        </span>
                      </div>
                      <div className="pp-product-body">
                        <h3 className="pp-product-name">{product.name}</h3>
                        <p className="pp-product-desc">{product.description?.slice(0, 50) || ''}</p>
                        <div className="pp-product-meta">
                          {product.categories?.name && (
                            <span className="pp-product-chip">{product.categories.name}</span>
                          )}
                          {product.manufacturers?.name && (
                            <span className="pp-product-chip">{product.manufacturers.name}</span>
                          )}
                        </div>
                        <div className="pp-product-footer">
                          <span className="pp-product-price">₹{parseFloat(product.price).toFixed(0)}</span>
                          <button
                            className="pp-product-add"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product.id);
                            }}
                            disabled={!inStock && !lowStock}
                            style={{ opacity: (!inStock && !lowStock) ? 0.4 : 1, cursor: (!inStock && !lowStock) ? 'not-allowed' : 'pointer' }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pp-pagination">
              <span className="pp-page-info">
                Showing {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="pp-page-btns">
                <button
                  className="pp-page-btn"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="pp-page-current">{page} / {totalPages}</span>
                <button
                  className="pp-page-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>

        {toast && (
          <div className={`pp-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
