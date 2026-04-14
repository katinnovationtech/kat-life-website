import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetch('/api/admin/subscribers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setSubscribers(d.subscribers); })
      .finally(() => setLoading(false));
  }, [token]);

  const exportCSV = () => {
    const headers = 'Email,Subscribed Date\n';
    const rows = subscribers.map((s) => `"${s.email}","${s.subscribed_at}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Newsletter">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Subscribers</h2>
          <div className="admin-controls">
            <span style={{ fontSize: '0.875rem', color: '#6b6b6b', fontWeight: 500 }}>
              Total: <strong style={{ color: '#1a5f7a' }}>{subscribers.length}</strong>
            </span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportCSV}>⤓ Export CSV</button>
          </div>
        </div>
        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Subscribed Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan={3}>
                    <div className="admin-empty"><div className="admin-empty-icon">✉</div><p>No subscribers yet.</p></div>
                  </td></tr>
                ) : subscribers.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: '#6b6b6b' }}>{i + 1}</td>
                    <td>{s.email}</td>
                    <td style={{ color: '#6b6b6b' }}>{new Date(s.subscribed_at).toLocaleString()}</td>
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

export default AdminNewsletter;
