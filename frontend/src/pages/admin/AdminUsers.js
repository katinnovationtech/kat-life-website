import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.users); })
      .finally(() => setLoading(false));
  }, [token]);

  const displayName = (u) => {
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    if (u.first_name) return u.first_name;
    return u.username || '—';
  };

  const displayHeight = (u) => {
    if (u.height_feet != null && u.height_inches != null) {
      return `${u.height_feet}ft ${u.height_inches}in`;
    }
    return '—';
  };

  const exportCSV = () => {
    const headers = 'First Name,Last Name,Email,Phone,City,Country,Age Range,Sex,Height,Weight,Weight Unit,Primary Goal,Activity Level,Main Concerns,How Heard,Discount Code,Pre-Order Status,Signup Date\n';
    const rows = users.map((u) =>
      [
        `"${u.first_name || ''}"`,
        `"${u.last_name || ''}"`,
        `"${u.email}"`,
        `"${u.phone || ''}"`,
        `"${u.city || ''}"`,
        `"${u.country || ''}"`,
        `"${u.age_range || ''}"`,
        `"${u.sex || ''}"`,
        `"${displayHeight(u)}"`,
        `"${u.weight || ''}"`,
        `"${u.weight_unit || ''}"`,
        `"${u.primary_health_goal || ''}"`,
        `"${u.activity_level || ''}"`,
        `"${u.health_concerns || ''}"`,
        `"${u.how_heard || ''}"`,
        `"${u.discount_code}"`,
        `"${u.preorder_status || 'Ordered'}"`,
        `"${u.created_at}"`,
      ].join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const STATUS_BADGE = {
    Ordered: 'admin-badge-ordered',
    Processing: 'admin-badge-processing',
    'In Delivery': 'admin-badge-delivery',
    Delivered: 'admin-badge-delivered',
  };

  return (
    <AdminLayout title="Users">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Registered Users ({users.length})</h2>
          <div className="admin-controls">
            <input
              className="admin-search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportCSV}>
              ⤓ Export CSV
            </button>
          </div>
        </div>
        {loading ? (
          <div className="admin-loading">Loading users…</div>
        ) : (
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: '1400px' }}>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Age Range</th>
                  <th>Sex</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Primary Goal</th>
                  <th>Activity Level</th>
                  <th>Main Concerns</th>
                  <th>How Heard</th>
                  <th>Discount Code</th>
                  <th>Pre-Order Status</th>
                  <th>Signup Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={17}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">👥</div>
                        <p>No users found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.first_name || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{u.last_name || '—'}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.city || '—'}</td>
                    <td>{u.country || '—'}</td>
                    <td>{u.age_range || '—'}</td>
                    <td>{u.sex || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{displayHeight(u)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {u.weight ? `${u.weight} ${u.weight_unit || 'lbs'}` : '—'}
                    </td>
                    <td>{u.primary_health_goal || '—'}</td>
                    <td>{u.activity_level || '—'}</td>
                    <td style={{ maxWidth: '180px', whiteSpace: 'normal', fontSize: '0.8rem' }}>
                      {u.health_concerns || '—'}
                    </td>
                    <td>{u.how_heard || '—'}</td>
                    <td><span className="admin-badge admin-badge-teal">{u.discount_code}</span></td>
                    <td>
                      <span className={`admin-badge ${STATUS_BADGE[u.preorder_status] || 'admin-badge-ordered'}`}>
                        {u.preorder_status || 'Ordered'}
                      </span>
                    </td>
                    <td style={{ color: '#6b6b6b', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
