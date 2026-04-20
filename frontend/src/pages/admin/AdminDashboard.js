import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import API_URL from '../../config';

const STATUS_BADGE = {
  Ordered: 'admin-badge-ordered',
  Processing: 'admin-badge-processing',
  'In Delivery': 'admin-badge-delivery',
  Delivered: 'admin-badge-delivered',
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setStats(data.stats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="admin-loading">Loading dashboard…</div>
      ) : stats ? (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">🛍</div>
              <div className="admin-stat-info">
                <h3>{stats.totalPreorders}</h3>
                <p>Total Pre-Orders</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-info">
                <h3>{stats.totalSignups}</h3>
                <p>Total Signups</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">✉</div>
              <div className="admin-stat-info">
                <h3>{stats.totalSubscribers}</h3>
                <p>Newsletter Subscribers</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">💬</div>
              <div className="admin-stat-info">
                <h3>{stats.unreadMessages}</h3>
                <p>Unread Messages</p>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Recent Pre-Orders</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Product</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6b6b6b' }}>No pre-orders yet</td></tr>
                  ) : (
                    stats.recentActivity.map((o) => (
                      <tr key={o.id}>
                        <td>{o.full_name}</td>
                        <td>{o.email}</td>
                        <td>{o.product}</td>
                        <td>{o.color}</td>
                        <td>{o.size}</td>
                        <td>
                          <span className={`admin-badge ${STATUS_BADGE[o.status] || 'admin-badge-ordered'}`}>
                            {o.status || 'Ordered'}
                          </span>
                        </td>
                        <td style={{ color: '#6b6b6b' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-empty">
          <div className="admin-empty-icon">⚠</div>
          <p>Could not load dashboard data.</p>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
