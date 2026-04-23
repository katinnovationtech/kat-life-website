import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import API_URL from '../../config';

const EMPTY_FORM = { name: '', description: '' };

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function TypeModal({ type, onClose, onSave }) {
  const [form, setForm] = useState(type ? { name: type.name, description: type.description || '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const slugPreview = form.name.trim() ? slugify(form.name.trim()) : '—';

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Type name is required.'); return; }
    setSaving(true);
    setError('');
    const err = await onSave(form, type?.id);
    if (err) { setError(err); setSaving(false); }
    else onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="admin-modal-header">
          <h3>{type ? 'Edit Product Type' : 'Add New Product Type'}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-body">
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>}
          <div className="admin-field-group">
            <label>Type Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. CURVA Short"
              autoFocus
            />
            {form.name.trim() && (
              <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#6b6b6b' }}>
                Slug preview: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '3px' }}>{slugPreview}</code>
              </p>
            )}
          </div>
          <div className="admin-field-group">
            <label>Description <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of this product type…"
              rows={3}
            />
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onClose}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Type'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Confirm Delete</h3>
          <button className="admin-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="admin-modal-body">
          <p style={{ margin: 0, color: '#1a1a1a', fontSize: '0.9rem', lineHeight: '1.5' }}>{message}</p>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onCancel}>Cancel</button>
          {danger && <button className="admin-btn admin-btn-danger" onClick={onConfirm}>{confirmLabel}</button>}
        </div>
      </div>
    </div>
  );
}

function AdminProductTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const token = localStorage.getItem('adminToken');

  const fetchTypes = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/product-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTypes(d.data); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleSave = async (form, id) => {
    const url = id ? `${API_URL}/api/product-types/${id}` : `${API_URL}/api/product-types`;
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) return data.error || 'Failed to save.';
      fetchTypes();
      return null;
    } catch {
      return 'Network error. Please try again.';
    }
  };

  const handleToggleActive = async (type) => {
    try {
      await fetch(`${API_URL}/api/product-types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !type.is_active }),
      });
      fetchTypes();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_URL}/api/product-types/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        setDeleteError('');
        fetchTypes();
      } else {
        setDeleteError(data.error || 'Could not delete.');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
    }
  };

  return (
    <AdminLayout title="Product Types">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Product Types ({types.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => setModalType(null)}>
            + Add New Type
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading product types…</div>
        ) : types.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🏷</div>
            <p>No product types found. Add one to get started.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: '#6b6b6b' }}>#{t.id}</td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#374151' }}>
                        {t.slug}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: parseInt(t.product_count) > 0 ? '#1a5f7a' : '#9ca3af' }}>
                        {t.product_count}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label className="admin-toggle">
                          <input
                            type="checkbox"
                            checked={t.is_active}
                            onChange={() => handleToggleActive(t)}
                          />
                          <span className="admin-toggle-slider" />
                        </label>
                        <span className={`admin-badge ${t.is_active ? 'admin-badge-available' : 'admin-badge-soldout'}`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => setModalType(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => { setDeleteTarget(t); setDeleteError(''); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalType !== undefined && (
        <TypeModal
          type={modalType}
          onClose={() => setModalType(undefined)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && !deleteError && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        />
      )}

      {deleteTarget && deleteError && (
        <ConfirmDialog
          message={deleteError}
          onConfirm={() => {}}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
          confirmLabel="Delete"
          danger={false}
        />
      )}
    </AdminLayout>
  );
}

export default AdminProductTypes;
