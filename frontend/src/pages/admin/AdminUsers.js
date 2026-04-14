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

  const exportCSV = () => {
    const headers = 'Username,Email,Signup Date,Activity Level,Health Goal,Age Range,Discount Code,Preorder Status\n';
    const rows = users.map((u) =>
      `"${u.username}","${u.email}","${u.created_at}","${u.activity_level || ''}","${u.primary_health_goal || ''}","${u.age_range || ''}","${u.discount_code}","${u.preorder_status || 'Ordered'}"`
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
    return !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
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
            <input className="admin-search" placeholder="Search username or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportCSV}>⤓ Export CSV</button>
          </div>
        </div>
        {loading ? (
          <div className="admin-loading">Loading users…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Signup Date</th>
                  <th>Activity Level</th>
                  <th>Health Goal</th>
                  <th>Age Range</th>
                  <th>Discount Code</th>
                  <th>Pre-Order Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="admin-empty"><div className="admin-empty-icon">👥</div><p>No users found.</p></div>
                  </td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td>{u.email}</td>
                    <td style={{ color: '#6b6b6b', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{u.activity_level || '—'}</td>
                    <td>{u.primary_health_goal || '—'}</td>
                    <td>{u.age_range || '—'}</td>
                    <td><span className="admin-badge admin-badge-teal">{u.discount_code}</span></td>
                    <td>
                      <span className={`admin-badge ${STATUS_BADGE[u.preorder_status] || 'admin-badge-ordered'}`}>
                        {u.preorder_status || 'Ordered'}
                      </span>
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
