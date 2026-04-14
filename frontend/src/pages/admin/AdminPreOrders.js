import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

const STATUSES = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
const PAGE_SIZE = 10;

const STATUS_BADGE = {
  Ordered: 'admin-badge-ordered',
  Processing: 'admin-badge-processing',
  'In Delivery': 'admin-badge-delivery',
  Delivered: 'admin-badge-delivered',
};

function StatusSelect({ value, onChange }) {
  return (
    <select className="admin-status-select" value={value || 'Ordered'} onChange={(e) => onChange(e.target.value)}>
      {STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function DetailModal({ order, type, onClose, onStatusChange }) {
  if (!order) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Order Details — #{order.id}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-body">
          {type === 'guest' ? (
            <>
              <div className="admin-detail-row"><span className="admin-detail-label">Full Name</span><span className="admin-detail-value">{order.full_name}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Email</span><span className="admin-detail-value">{order.email}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Phone</span><span className="admin-detail-value">{order.phone}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Product</span><span className="admin-detail-value">{order.product_interest}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Color</span><span className="admin-detail-value">{order.color}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Size</span><span className="admin-detail-value">{order.size}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Date</span><span className="admin-detail-value">{new Date(order.created_at).toLocaleString()}</span></div>
            </>
          ) : (
            <>
              <div className="admin-detail-row"><span className="admin-detail-label">Username</span><span className="admin-detail-value">{order.username}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Email</span><span className="admin-detail-value">{order.email}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Discount Code</span><span className="admin-detail-value"><span className="admin-badge admin-badge-teal">{order.discount_code}</span></span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Activity Level</span><span className="admin-detail-value">{order.activity_level || '—'}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Health Goal</span><span className="admin-detail-value">{order.primary_health_goal || '—'}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Age Range</span><span className="admin-detail-value">{order.age_range || '—'}</span></div>
              <div className="admin-detail-row"><span className="admin-detail-label">Signup Date</span><span className="admin-detail-value">{new Date(order.created_at).toLocaleString()}</span></div>
            </>
          )}
          <div className="admin-detail-row" style={{ marginTop: '12px' }}>
            <span className="admin-detail-label">Update Status</span>
            <span className="admin-detail-value">
              <StatusSelect
                value={type === 'guest' ? order.status : order.preorder_status}
                onChange={(s) => onStatusChange(order.id, s)}
              />
            </span>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ type }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem('adminToken');

  const fetchOrders = useCallback(() => {
    const url = type === 'guest' ? '/api/admin/preorders/guest' : '/api/admin/preorders/members';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.preorders || []); })
      .finally(() => setLoading(false));
  }, [type, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id, status) => {
    const url = type === 'guest' ? `/api/admin/preorders/guest/${id}` : `/api/admin/preorders/member/${id}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, [type === 'guest' ? 'status' : 'preorder_status']: status } : o));
    if (selected?.id === id) setSelected((o) => ({ ...o, [type === 'guest' ? 'status' : 'preorder_status']: status }));
  };

  const exportCSV = () => {
    const token = localStorage.getItem('adminToken');
    window.open(`/api/admin/preorders/export?token=${token}`, '_blank');
  };

  const statusKey = type === 'guest' ? 'status' : 'preorder_status';
  const nameKey = type === 'guest' ? 'full_name' : 'username';

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (o[nameKey] || '').toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q);
    const matchStatus = !filterStatus || (o[statusKey] || 'Ordered') === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="admin-loading">Loading…</div>;

  return (
    <>
      <div className="admin-section-header">
        <div className="admin-controls">
          <input className="admin-search" placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="admin-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportCSV}>⤓ Export CSV</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              {type === 'guest' ? (
                <>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                </>
              ) : (
                <>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Discount Code</th>
                  <th>Activity Level</th>
                  <th>Health Goal</th>
                  <th>Age Range</th>
                </>
              )}
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={10}>
                <div className="admin-empty">
                  <div className="admin-empty-icon">📭</div>
                  <p>No pre-orders found.</p>
                </div>
              </td></tr>
            ) : paged.map((o) => (
              <tr key={o.id}>
                <td style={{ color: '#6b6b6b' }}>#{o.id}</td>
                {type === 'guest' ? (
                  <>
                    <td>{o.full_name}</td>
                    <td>{o.email}</td>
                    <td>{o.phone}</td>
                    <td>{o.product_interest}</td>
                    <td>{o.color}</td>
                    <td>{o.size}</td>
                  </>
                ) : (
                  <>
                    <td>{o.username}</td>
                    <td>{o.email}</td>
                    <td><span className="admin-badge admin-badge-teal">{o.discount_code || '—'}</span></td>
                    <td>{o.activity_level || '—'}</td>
                    <td>{o.primary_health_goal || '—'}</td>
                    <td>{o.age_range || '—'}</td>
                  </>
                )}
                <td>
                  <StatusSelect
                    value={o[statusKey] || 'Ordered'}
                    onChange={(s) => handleStatusChange(o.id, s)}
                  />
                </td>
                <td style={{ color: '#6b6b6b', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setSelected(o)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="admin-pagination-btns">
            <button className="admin-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} className={`admin-page-btn ${n === page ? 'active-page' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="admin-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
          </div>
        </div>
      )}

      {selected && (
        <DetailModal
          order={selected}
          type={type}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}

function AdminPreOrders() {
  const [tab, setTab] = useState('guest');

  return (
    <AdminLayout title="Pre-Orders">
      <div className="admin-section">
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'guest' ? 'active' : ''}`} onClick={() => setTab('guest')}>Guest Pre-Orders</button>
          <button className={`admin-tab ${tab === 'member' ? 'active' : ''}`} onClick={() => setTab('member')}>Member Pre-Orders</button>
        </div>
        <OrdersTab key={tab} type={tab} />
      </div>
    </AdminLayout>
  );
}

export default AdminPreOrders;
