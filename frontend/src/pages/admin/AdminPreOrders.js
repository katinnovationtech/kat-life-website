import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import API_URL from '../../config';

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

// Format snake_case or underscore-separated values to Title Case readable text
function fmt(val) {
  if (!val && val !== 0) return '—';
  return String(val)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format age range like "25_34" → "25 - 34"
function fmtAge(val) {
  if (!val) return '—';
  return String(val).replace(/_/g, ' - ');
}

// Format height from feet/inches fields
function fmtHeight(feet, inches) {
  if (!feet && feet !== 0) return '—';
  const i = inches || 0;
  return `${feet}ft ${i}in`;
}

// Format weight with unit
function fmtWeight(weight, unit) {
  if (!weight && weight !== 0) return '—';
  return `${weight} ${unit || 'lbs'}`;
}

// Format comma-separated concern list
function fmtConcerns(val) {
  if (!val) return '—';
  return val.split(',').map((s) => fmt(s.trim())).join(', ');
}

const STATUS_BADGE_CLASS = {
  Ordered: 'admin-badge-ordered',
  Processing: 'admin-badge-processing',
  'In Delivery': 'admin-badge-delivery',
  Delivered: 'admin-badge-delivered',
};

function DetailRow({ label, children }) {
  return (
    <div className="admin-detail-row">
      <span className="admin-detail-label">{label}</span>
      <span className="admin-detail-value">{children}</span>
    </div>
  );
}

function DetailSection({ title }) {
  return (
    <p style={{
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#1a5f7a',
      borderBottom: '1px solid #e0f0f4', paddingBottom: '4px',
      marginTop: '16px', marginBottom: '8px',
    }}>{title}</p>
  );
}

function DetailModal({ order, type, onClose, onStatusChange }) {
  if (!order) return null;
  const statusVal = type === 'guest' ? order.status : order.preorder_status;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="admin-modal-header">
          <h3>Order Details — #{order.id}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {type === 'guest' ? (
            <>
              <DetailSection title="Contact Details" />
              <DetailRow label="Full Name">{order.full_name}</DetailRow>
              <DetailRow label="Email">{order.email}</DetailRow>
              <DetailRow label="Phone">{order.phone || '—'}</DetailRow>
              <DetailRow label="City">{order.city || '—'}</DetailRow>
              <DetailRow label="Country">{order.country || '—'}</DetailRow>

              <DetailSection title="Product Details" />
              <DetailRow label="Product Interest">{order.product_interest}</DetailRow>
              <DetailRow label="Color">{order.color}</DetailRow>
              <DetailRow label="Size">{order.size}</DetailRow>

              <DetailSection title="Order Info" />
              <DetailRow label="Status">
                <span className={`admin-badge ${STATUS_BADGE_CLASS[order.status] || ''}`}>
                  {order.status || 'Ordered'}
                </span>
              </DetailRow>
              <DetailRow label="Date Submitted">{new Date(order.created_at).toLocaleString()}</DetailRow>
            </>
          ) : (
            <>
              <DetailSection title="Contact Details" />
              <DetailRow label="First Name">{order.first_name || '—'}</DetailRow>
              <DetailRow label="Last Name">{order.last_name || '—'}</DetailRow>
              <DetailRow label="Email">{order.email}</DetailRow>
              <DetailRow label="Phone">{order.phone || '—'}</DetailRow>
              <DetailRow label="City">{order.city || '—'}</DetailRow>
              <DetailRow label="Country">{order.country || '—'}</DetailRow>
              <DetailRow label="Consent to be Contacted">{order.consent_contacted ? 'Yes' : 'No'}</DetailRow>

              <DetailSection title="Basic Profile" />
              <DetailRow label="Age Range">{fmtAge(order.age_range)}</DetailRow>
              <DetailRow label="Sex">{fmt(order.sex)}</DetailRow>
              <DetailRow label="Height">{fmtHeight(order.height_feet, order.height_inches)}</DetailRow>
              <DetailRow label="Weight">{fmtWeight(order.weight, order.weight_unit)}</DetailRow>

              <DetailSection title="Product & Wellness Info" />
              <DetailRow label="Activity Level">{fmt(order.activity_level)}</DetailRow>
              <DetailRow label="Primary Goal">{fmt(order.primary_health_goal)}</DetailRow>
              <DetailRow label="Main Concerns">{fmtConcerns(order.health_concerns)}</DetailRow>
              <DetailRow label="How They Heard">{fmt(order.how_heard)}</DetailRow>

              <DetailSection title="Account Info" />
              <DetailRow label="Discount Code">
                {order.discount_code
                  ? <span className="admin-badge admin-badge-teal">{order.discount_code}</span>
                  : '—'}
              </DetailRow>
              <DetailRow label="Signup Date">{new Date(order.created_at).toLocaleString()}</DetailRow>
              <DetailRow label="Pre-Order Status">
                <span className={`admin-badge ${STATUS_BADGE_CLASS[statusVal] || ''}`}>
                  {statusVal || 'Ordered'}
                </span>
              </DetailRow>
            </>
          )}
          <div style={{ borderTop: '1px solid #e0f0f4', marginTop: '16px', paddingTop: '12px' }}>
            <DetailRow label="Update Status">
              <StatusSelect
                value={statusVal || 'Ordered'}
                onChange={(s) => onStatusChange(order.id, s)}
              />
            </DetailRow>
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
    const url = type === 'guest' ? `${API_URL}/api/admin/preorders/guest` : `${API_URL}/api/admin/preorders/members`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.preorders || []); })
      .finally(() => setLoading(false));
  }, [type, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id, status) => {
    const url = type === 'guest' ? `${API_URL}/api/admin/preorders/guest/${id}` : `${API_URL}/api/admin/preorders/member/${id}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, [type === 'guest' ? 'status' : 'preorder_status']: status } : o));
    if (selected?.id === id) setSelected((o) => ({ ...o, [type === 'guest' ? 'status' : 'preorder_status']: status }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/api/admin/preorders/export?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preorders-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const statusKey = type === 'guest' ? 'status' : 'preorder_status';

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const name = type === 'guest'
      ? (o.full_name || '')
      : `${o.first_name || ''} ${o.last_name || ''}`.trim();
    const matchSearch = !q || name.toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q);
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
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={handleExport}>⤓ Export CSV</button>
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
                  <th>City</th>
                  <th>Country</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                </>
              ) : (
                <>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Discount Code</th>
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
                    <td>{o.phone || '—'}</td>
                    <td>{o.city || '—'}</td>
                    <td>{o.country || '—'}</td>
                    <td>{o.product_interest}</td>
                    <td>{o.color}</td>
                    <td>{o.size}</td>
                  </>
                ) : (
                  <>
                    <td>{o.first_name || '—'}</td>
                    <td>{o.last_name || '—'}</td>
                    <td>{o.email}</td>
                    <td>{o.phone || '—'}</td>
                    <td><span className="admin-badge admin-badge-teal">{o.discount_code || '—'}</span></td>
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
