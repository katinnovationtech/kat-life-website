import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetch('/api/admin/contacts', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMessages(d.messages); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleExpand = async (msg) => {
    if (expanded?.id === msg.id) {
      setExpanded(null);
      return;
    }
    setExpanded(msg);
    if (!msg.is_read) {
      await fetch(`/api/admin/contacts/${msg.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: 1 } : m));
    }
  };

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <AdminLayout title="Messages">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Contact Messages</h2>
          <span style={{ fontSize: '0.875rem', color: '#6b6b6b' }}>
            {unread > 0 ? (
              <span><strong style={{ color: '#1a5f7a' }}>{unread}</strong> unread</span>
            ) : (
              'All read'
            )}
          </span>
        </div>
        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact / Phone</th>
                  <th>Message Preview</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="admin-empty"><div className="admin-empty-icon">💬</div><p>No messages yet.</p></div>
                  </td></tr>
                ) : messages.map((m) => (
                  <React.Fragment key={m.id}>
                    <tr
                      className="admin-row-clickable"
                      onClick={() => handleExpand(m)}
                      style={{ fontWeight: m.is_read ? 400 : 700 }}
                    >
                      <td>{m.full_name}{!m.is_read && <span style={{ marginLeft: '6px', display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#1a5f7a', verticalAlign: 'middle' }} />}</td>
                      <td>{m.email}</td>
                      <td>{m.contact}</td>
                      <td style={{ color: '#6b6b6b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.message.slice(0, 80)}{m.message.length > 80 ? '…' : ''}
                      </td>
                      <td style={{ color: '#6b6b6b', whiteSpace: 'nowrap' }}>{new Date(m.sent_at).toLocaleDateString()}</td>
                    </tr>
                    {expanded?.id === m.id && (
                      <tr>
                        <td colSpan={5} style={{ background: '#f7f9fc', padding: '0' }}>
                          <div style={{ padding: '20px 24px', borderTop: '2px solid #e8f4f8' }}>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#6b6b6b' }}><strong>From:</strong> {m.full_name}</span>
                              <span style={{ fontSize: '0.8rem', color: '#6b6b6b' }}><strong>Email:</strong> {m.email}</span>
                              <span style={{ fontSize: '0.8rem', color: '#6b6b6b' }}><strong>Contact:</strong> {m.contact}</span>
                              <span style={{ fontSize: '0.8rem', color: '#6b6b6b' }}><strong>Date:</strong> {new Date(m.sent_at).toLocaleString()}</span>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '14px 16px', fontSize: '0.9rem', lineHeight: '1.6', color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
                              {m.message}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminMessages;
