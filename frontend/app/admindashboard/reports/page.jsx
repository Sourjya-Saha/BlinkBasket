'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '../../../components/AdminNav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ── Icons ───────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// Helper to get current YYYY-MM
const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminReports() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('insights');
  
  // Data States
  const [salesData, setSalesData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  
  // Loading States
  const [salesLoading, setSalesLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Filters
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth); // Defaults to current month
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/userdashboard');
  }, [status, session, router]);

  // ── Data Fetching ───────────────────────────────────────────
  const fetchSales = useCallback(async (month = '') => {
    if (!session?.accessToken) return;
    setSalesLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/reports/sales`);
      if (month) url.searchParams.append('month', month);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const data = await res.json();
      setSalesData(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } 
    finally { setSalesLoading(false); }
  }, [session]);

  const fetchCustomers = useCallback(async () => {
    if (!session?.accessToken) return;
    setCustomersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reports/customers`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const data = await res.json();
      setCustomerData(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } 
    finally { setCustomersLoading(false); }
  }, [session]);

  const fetchOrdersForInsights = useCallback(async () => {
    if (!session?.accessToken) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders?limit=1000`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const json = await res.json();
      setOrdersData(json.data || []);
    } catch (err) { console.error(err); } 
    finally { setOrdersLoading(false); }
  }, [session]);

  // Initial Load Trigger
  useEffect(() => {
    if (activeTab === 'sales') fetchSales(monthFilter);
    if (activeTab === 'customers' && customerData.length === 0) fetchCustomers();
    if ((activeTab === 'insights' || activeTab === 'drilldown') && ordersData.length === 0) fetchOrdersForInsights();
  }, [activeTab, monthFilter, fetchSales, fetchCustomers, fetchOrdersForInsights]);

  // ── Derived Data & Aggregations ─────────────────────────────
  
  // 1. Overall Sales Summaries
  const totalSalesRevenue = salesData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
  const totalSalesUnits = salesData.reduce((sum, item) => sum + (item.total_qty || 0), 0);

  // 2. Insights (from Orders)
  const insights = useMemo(() => {
    let onlineRev = 0, codRev = 0, onlineCount = 0, codCount = 0;
    const statusCounts = {};

    ordersData.forEach(o => {
      const amt = parseFloat(o.total) || 0;
      if (o.payment_method === 'online') { onlineRev += amt; onlineCount++; }
      else if (o.payment_method === 'cod') { codRev += amt; codCount++; }
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    return { onlineRev, codRev, onlineCount, codCount, statusCounts, totalOrders: ordersData.length };
  }, [ordersData]);

  // 3. Single Product Drilldown (Flattened Order Items)
  const drilldownItems = useMemo(() => {
    if (!selectedProductId) return [];
    const items = [];
    ordersData.forEach(order => {
      (order.order_items || []).forEach(item => {
        if (item.product_id === Number(selectedProductId)) {
          items.push({
            order_id: order.id,
            invoice_id: order.invoice_id,
            date: order.created_at,
            customer: order.users?.full_name || order.users?.email || 'Unknown',
            status: order.status,
            payment: order.payment_method,
            variant: item.variant_name || 'Standard',
            qty: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          });
        }
      });
    });
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [ordersData, selectedProductId]);

  // 4. Single Product Drilldown Summary Stats
  const drilldownSummary = useMemo(() => {
    let revenue = 0, units = 0;
    drilldownItems.forEach(item => {
      revenue += item.total;
      units += item.qty;
    });
    return { revenue, units, orderCount: drilldownItems.length };
  }, [drilldownItems]);

  // Extract unique products for the drilldown dropdown
  const uniqueProductsForDrilldown = useMemo(() => {
    const products = new Map();
    ordersData.forEach(order => {
      (order.order_items || []).forEach(item => {
        if (item.products?.name) {
          products.set(item.product_id, item.products.name);
        }
      });
    });
    return Array.from(products.entries()).map(([id, name]) => ({ id, name }));
  }, [ordersData]);

  // ── CSV Export Helper ───────────────────────────────────────
  const exportCSV = (data, filename) => {
    if (!data || !data.length) return alert('No data to export.');
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => `"${String(row[fieldName] || '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (status === 'loading' || status === 'unauthenticated') return <FullPageSpinner />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ar-root { min-height: 100vh; background: #060810; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .ar-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 65% 45% at 100% 0%, rgba(251,146,60,0.06) 0%, transparent 65%); }
        .ar-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(251,146,60,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.02) 1px, transparent 1px);
          background-size: 64px 64px; }

        .ar-main { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }

        .ar-page-header { margin-bottom: 2rem; }
        .ar-page-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .ar-page-sub { font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem; }

        /* TABS */
        .ar-tabs { display: flex; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; margin-bottom: 1.5rem; overflow-x: auto; }
        .ar-tab {
          padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap;
          background: transparent; border: 1px solid transparent; color: #6b7280;
        }
        .ar-tab:hover { color: #d1d5db; background: rgba(255,255,255,0.03); }
        .ar-tab.active { background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.3); color: #fb923c; }

        /* CONTROLS */
        .ar-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .ar-filter-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ar-input-wrapper { position: relative; display: flex; align-items: center; }
        .ar-input-wrapper svg { position: absolute; left: 10px; color: #6b7280; pointer-events: none; }
        .ar-input, .ar-select {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 9px;
          padding: 0.55rem 0.9rem; color: #e5e7eb;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem; outline: none; transition: border-color 0.2s;
        }
        .ar-input { padding-left: 2.2rem; color-scheme: dark; }
        .ar-select option { background-color: #0d1018; }
        .ar-input:focus, .ar-select:focus { border-color: rgba(251,146,60,0.4); }
        
        .ar-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0.55rem 1.1rem; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #d1d5db; font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .ar-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff; }

        /* CARDS & GRIDS */
        .ar-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .ar-summary-card { background: rgba(13,16,24,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.25rem; }
        .ar-summary-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; font-weight: 600; }
        .ar-summary-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; }
        .ar-summary-val.orange { color: #fb923c; }

        /* Split layout for insights */
        .ar-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        @media (max-width: 768px) { .ar-split { grid-template-columns: 1fr; } }
        
        .ar-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ar-stat-row:last-child { border-bottom: none; }
        .ar-stat-name { font-size: 0.85rem; color: #d1d5db; }
        .ar-stat-num { font-weight: 700; color: #fff; font-family: 'Syne', sans-serif; }

        /* TABLES */
        .ar-table-wrapper {
          background: rgba(13,16,24,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
          overflow-x: auto;
        }
        .ar-table { width: 100%; border-collapse: collapse; text-align: left; }
        .ar-table th {
          white-space: nowrap; 
          font-size: 0.75rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;
          padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2);
        }
        .ar-table td { padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.85rem; color: #d1d5db; white-space: nowrap; }
        .ar-table tr:hover td { background: rgba(255,255,255,0.015); }
        .ar-td-bold { font-weight: 600; color: #fff; }
        .ar-td-money { font-weight: 600; color: #fb923c; font-family: 'Syne', sans-serif; font-size: 0.95rem; }
        
        .ar-badge { padding: 3px 8px; border-radius: 5px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); }

        .ar-empty { text-align: center; padding: 4rem 1rem; color: #6b7280; font-size: 0.875rem; }
        .ar-spinner { width: 24px; height: 24px; border: 2px solid rgba(251,146,60,0.2); border-top-color: #fb923c; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ar-root">
        <div className="ar-bg" />
        <div className="ar-grid" />
        <AdminNav />

        <main className="ar-main">
          <div className="ar-page-header">
            <h1 className="ar-page-title">Analytics & Reports</h1>
            <p className="ar-page-sub">Comprehensive overview, sales trends, and deep dive product reports.</p>
          </div>

          <div className="ar-tabs">
            <button className={`ar-tab ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>Store Insights</button>
            <button className={`ar-tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Product Sales</button>
            <button className={`ar-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>Top Customers</button>
            <button className={`ar-tab ${activeTab === 'drilldown' ? 'active' : ''}`} onClick={() => setActiveTab('drilldown')}>Single Product Drilldown</button>
          </div>

          {/* ── TAB 1: STORE INSIGHTS ── */}
          {activeTab === 'insights' && (
            <div>
              <div className="ar-controls" style={{ justifyContent: 'flex-end' }}>
                <button className="ar-btn" onClick={() => exportCSV(ordersData, 'Raw_Orders_Data')}>
                  <DownloadIcon /> Export All Orders Raw
                </button>
              </div>

              {ordersLoading ? <div className="ar-empty"><div className="ar-spinner"/>Processing insights...</div> : (
                <>
                  <div className="ar-summary-grid">
                    <div className="ar-summary-card">
                      <div className="ar-summary-label">Total Volume (Recent)</div>
                      <div className="ar-summary-val">{insights.totalOrders} Orders</div>
                    </div>
                    <div className="ar-summary-card">
                      <div className="ar-summary-label">Online Revenue</div>
                      <div className="ar-summary-val orange">₹{insights.onlineRev.toFixed(0)}</div>
                    </div>
                    <div className="ar-summary-card">
                      <div className="ar-summary-label">COD Revenue</div>
                      <div className="ar-summary-val orange">₹{insights.codRev.toFixed(0)}</div>
                    </div>
                  </div>

                  <div className="ar-split">
                    <div className="ar-summary-card">
                      <h3 style={{ color: '#fff', marginBottom: '1rem', fontFamily: 'Syne', fontSize: '1.1rem' }}>Payment Preferences</h3>
                      <div className="ar-stat-row">
                        <span className="ar-stat-name">Online Payments</span>
                        <span className="ar-stat-num">{insights.onlineCount} orders</span>
                      </div>
                      <div className="ar-stat-row">
                        <span className="ar-stat-name">Cash on Delivery (COD)</span>
                        <span className="ar-stat-num">{insights.codCount} orders</span>
                      </div>
                    </div>
                    
                    <div className="ar-summary-card">
                      <h3 style={{ color: '#fff', marginBottom: '1rem', fontFamily: 'Syne', fontSize: '1.1rem' }}>Fulfillment Status</h3>
                      {Object.entries(insights.statusCounts).map(([status, count]) => (
                        <div className="ar-stat-row" key={status}>
                          <span className="ar-stat-name" style={{ textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</span>
                          <span className="ar-stat-num">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 2: PRODUCT SALES ── */}
          {activeTab === 'sales' && (
            <div>
              <div className="ar-controls">
                <div className="ar-filter-group">
                  <div className="ar-input-wrapper">
                    <CalendarIcon />
                    <input type="month" className="ar-input" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                  </div>
                  {monthFilter && <button className="ar-btn" style={{ background: 'transparent', border: 'none', color: '#fb923c' }} onClick={() => setMonthFilter('')}>Clear</button>}
                </div>
                <button className="ar-btn" onClick={() => exportCSV(salesData, 'Product_Sales')}><DownloadIcon /> Export CSV</button>
              </div>

              {!salesLoading && salesData.length > 0 && (
                <div className="ar-summary-grid">
                  <div className="ar-summary-card">
                    <div className="ar-summary-label">Total Revenue {monthFilter ? `(${monthFilter})` : '(All Time)'}</div>
                    <div className="ar-summary-val orange">₹{parseFloat(totalSalesRevenue).toFixed(2)}</div>
                  </div>
                  <div className="ar-summary-card">
                    <div className="ar-summary-label">Units Sold</div>
                    <div className="ar-summary-val">{totalSalesUnits}</div>
                  </div>
                </div>
              )}

              <div className="ar-table-wrapper">
                {salesLoading ? <div className="ar-empty"><div className="ar-spinner" />Loading sales...</div> : 
                 salesData.length === 0 ? <div className="ar-empty">No sales data found for this period.</div> : (
                  <table className="ar-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product Name</th>
                        <th style={{ textAlign: 'right' }}>Units Sold</th>
                        <th style={{ textAlign: 'right' }}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((item) => (
                        <tr key={item.product_id}>
                          <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>#{item.product_id}</td>
                          <td className="ar-td-bold" style={{ whiteSpace: 'normal', minWidth: '200px' }}>{item.name || 'Unknown'}</td>
                          <td style={{ textAlign: 'right' }}>{item.total_qty}</td>
                          <td className="ar-td-money" style={{ textAlign: 'right' }}>₹{parseFloat(item.total_revenue).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: TOP CUSTOMERS ── */}
          {activeTab === 'customers' && (
            <div>
              <div className="ar-controls" style={{ justifyContent: 'flex-end' }}>
                <button className="ar-btn" onClick={() => exportCSV(customerData, 'Customer_Reports')}><DownloadIcon /> Export CSV</button>
              </div>

              <div className="ar-table-wrapper">
                {customersLoading ? <div className="ar-empty"><div className="ar-spinner" />Loading customers...</div> : 
                 customerData.length === 0 ? <div className="ar-empty">No customer data found.</div> : (
                  <table className="ar-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Email Address</th>
                        <th style={{ textAlign: 'center' }}>Orders Placed</th>
                        <th style={{ textAlign: 'right' }}>Lifetime Value (LTV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.map((customer) => (
                        <tr key={customer.user_id}>
                          <td className="ar-td-bold">{customer.name || '—'}</td>
                          <td>{customer.email}</td>
                          <td style={{ textAlign: 'center' }}><span className="ar-badge">{customer.order_count}</span></td>
                          <td className="ar-td-money" style={{ textAlign: 'right' }}>₹{parseFloat(customer.total_spent).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: SINGLE PRODUCT DRILLDOWN ── */}
          {activeTab === 'drilldown' && (
            <div>
              <div className="ar-controls">
                <div className="ar-filter-group" style={{ width: '100%', maxWidth: '400px' }}>
                  <div className="ar-input-wrapper" style={{ width: '100%' }}>
                    <SearchIcon />
                    <select 
                      className="ar-select" 
                      style={{ width: '100%', paddingLeft: '2.2rem' }}
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">Select a Product to analyze...</option>
                      {uniqueProductsForDrilldown.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {drilldownItems.length > 0 && (
                  <button className="ar-btn" onClick={() => exportCSV(drilldownItems, `Product_${selectedProductId}_Sales`)}>
                    <DownloadIcon /> Export Detail CSV
                  </button>
                )}
              </div>

              {selectedProductId && drilldownItems.length > 0 && (
                <div className="ar-summary-grid">
                  <div className="ar-summary-card">
                    <div className="ar-summary-label">Total Revenue (Selected Product)</div>
                    <div className="ar-summary-val orange">₹{drilldownSummary.revenue.toFixed(2)}</div>
                  </div>
                  <div className="ar-summary-card">
                    <div className="ar-summary-label">Total Units Sold</div>
                    <div className="ar-summary-val">{drilldownSummary.units}</div>
                  </div>
                  <div className="ar-summary-card">
                    <div className="ar-summary-label">Times Ordered</div>
                    <div className="ar-summary-val">{drilldownSummary.orderCount}</div>
                  </div>
                </div>
              )}

              <div className="ar-table-wrapper">
                {ordersLoading ? <div className="ar-empty"><div className="ar-spinner" />Loading order details...</div> :
                 !selectedProductId ? <div className="ar-empty">Please select a product from the dropdown above to view its individual sales history.</div> :
                 drilldownItems.length === 0 ? <div className="ar-empty">No sales found for this specific product in the current order data.</div> : (
                  <table className="ar-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Invoice / Order ID</th>
                        <th>Customer</th>
                        <th>Variant</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Total Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{new Date(item.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            <div className="ar-td-bold" style={{ fontFamily: 'monospace' }}>{item.invoice_id || `ORD-${item.order_id}`}</div>
                            <span className="ar-badge" style={{ marginTop: '4px', display: 'inline-block' }}>{item.status}</span>
                          </td>
                          <td style={{ whiteSpace: 'normal', minWidth: '150px' }}>{item.customer}</td>
                          <td style={{ color: '#9ca3af' }}>{item.variant}</td>
                          <td style={{ textAlign: 'center' }}>{item.qty}</td>
                          <td className="ar-td-money" style={{ textAlign: 'right' }}>₹{parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </main>
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