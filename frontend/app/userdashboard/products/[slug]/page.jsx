'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import UserNav from '@/components/UserNav';
import ProductDetailView from '@/components/ProductDetailView';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/api/products/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Fetch Cart Count for Navbar
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => r.json())
      .then(data => setCartCount(data.items?.length || 0))
      .catch(() => {});
  }, [session]);

  const handleAddToCart = async (productId, variantId, quantity) => {
    if (!session?.accessToken) return router.push('/');
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
        showToast('success', 'Product added to your cart!');
        setCartCount(c => c + 1);
      }
    } catch (err) {
      showToast('error', 'Failed to add product');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!product) return <ErrorView />;

  return (
    <div className="pdp-root">
      <style>{`
        .pdp-root { min-height: 100vh; background: #0a0c10; font-family: 'DM Sans', sans-serif; }
        .pdp-main { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem 5rem; }
        .pdp-back { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; text-decoration: none; font-size: 0.9rem; margin-bottom: 2rem; transition: 0.2s; }
        .pdp-back:hover { color: #a3e635; }
        .pdp-toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 1000; padding: 1rem 1.5rem; border-radius: 12px; font-weight: 600; border: 1px solid; backdrop-filter: blur(12px); animation: slideUp 0.3s ease; }
        .pdp-toast.success { background: rgba(52,211,153,0.1); color: #34d399; border-color: rgba(52,211,153,0.2); }
        .pdp-toast.error { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <UserNav cartCount={cartCount} />
      
      <main className="pdp-main">
       
        <ProductDetailView 
          product={product} 
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
        />
      </main>

      {toast && <div className={`pdp-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 30, height: 30, border: '3px solid rgba(163,230,53,0.1)', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorView() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <h2 style={{fontFamily:'Syne'}}>Product Not Found</h2>
      <Link href="/userdashboard/products" style={{color:'#a3e635', marginTop:'1rem'}}>Go back to store</Link>
    </div>
  );
}