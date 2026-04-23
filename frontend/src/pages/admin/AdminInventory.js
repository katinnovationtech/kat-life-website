import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import API_URL from '../../config';

const COLORS = ['White', 'Black', 'Grey', 'Royal Blue', 'Navy Blue'];

function ProductModal({ product, productTypes, onClose, onSave }) {
  const defaultTypeId = productTypes[0]?.id || '';
  const EMPTY_FORM = {
    name: '',
    product_type_id: defaultTypeId,
    color: 'White',
    price: '',
    description: '',
    image_url: '',
    is_available: true,
  };

  const [form, setForm] = useState(
    product
      ? {
          ...product,
          product_type_id: product.product_type_id || defaultTypeId,
          price: product.price || '',
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.product_type_id || !form.color) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-field-group">
            <label>Product Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. OSTAYA™ Wellness Skort" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-field-group">
              <label>Product Type</label>
              <select value={form.product_type_id} onChange={(e) => set('product_type_id', parseInt(e.target.value))}>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-field-group">
              <label>Color</label>
              <select value={form.color} onChange={(e) => set('color', e.target.value)}>
                {COLORS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-field-group">
            <label>Price (CAD$)</label>
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="admin-field-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Product description…" />
          </div>
          <div className="admin-field-group">
            <label>Image URL</label>
            <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="/images/product.png" />
          </div>
          <div className="admin-field-group">
            <label>Availability</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <label className="admin-toggle">
                <input type="checkbox" checked={!!form.is_available} onChange={(e) => set('is_available', e.target.checked)} />
                <span className="admin-toggle-slider" />
              </label>
              <span style={{ fontSize: '0.875rem', color: form.is_available ? '#065f46' : '#dc2626' }}>
                {form.is_available ? 'Available' : 'Sold Out'}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onClose}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Confirm Delete</h3>
          <button className="admin-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="admin-modal-body">
          <p style={{ margin: 0, color: '#1a1a1a', fontSize: '0.9rem' }}>{message}</p>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onCancel}>Cancel</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(undefined);
  const [deleteId, setDeleteId] = useState(null);
  const token = localStorage.getItem('adminToken');

  const fetchProducts = useCallback(() => {
    fetch(`${API_URL}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.products); })
      .finally(() => setLoading(false));
  }, [token]);

  const fetchProductTypes = useCallback(() => {
    fetch(`${API_URL}/api/admin/product-types`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProductTypes(d.data); });
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
  }, [fetchProducts, fetchProductTypes]);

  const handleSave = async (form) => {
    if (form.id) {
      await fetch(`${API_URL}/api/admin/products/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      await fetch(`${API_URL}/api/admin/products/${form.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_available: form.is_available }),
      });
    } else {
      await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
    }
    fetchProducts();
    fetchProductTypes();
  };

  const handleToggle = async (product) => {
    const newVal = !product.is_available;
    await fetch(`${API_URL}/api/admin/products/${product.id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_available: newVal }),
    });
    setProducts((prev) =>
      prev.map((p) => p.id === product.id ? { ...p, is_available: newVal ? 1 : 0 } : p)
    );
  };

  const handleDelete = async () => {
    await fetch(`${API_URL}/api/admin/products/${deleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  // Group products by product_type_id dynamically
  const groups = productTypes.map((type) => ({
    label: type.name,
    typeId: type.id,
    items: products.filter((p) => p.product_type_id === type.id),
  })).filter((g) => g.items.length > 0);

  // Uncategorized products
  const uncategorized = products.filter((p) => !p.product_type_id);
  if (uncategorized.length > 0) {
    groups.push({ label: 'Uncategorized', typeId: null, items: uncategorized });
  }

  const renderRows = (items) =>
    items.map((p) => (
      <tr key={p.id}>
        <td style={{ fontWeight: 500 }}>{p.name}</td>
        <td style={{ fontSize: '0.85rem', color: '#374151' }}>{p.product_type_name || p.type || '—'}</td>
        <td>{p.color}</td>
        <td>{p.price > 0 ? `CAD$${Number(p.price).toFixed(2)}` : 'TBD'}</td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="admin-toggle">
              <input type="checkbox" checked={p.is_available !== 0} onChange={() => handleToggle(p)} />
              <span className="admin-toggle-slider" />
            </label>
            <span className={`admin-badge ${p.is_available !== 0 ? 'admin-badge-available' : 'admin-badge-soldout'}`}>
              {p.is_available !== 0 ? 'Available' : 'Sold Out'}
            </span>
          </div>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setModalProduct(p)}>Edit</button>
            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
          </div>
        </td>
      </tr>
    ));

  return (
    <AdminLayout title="Inventory">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Products ({products.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => setModalProduct(null)}>+ Add New Product</button>
        </div>
        {loading ? (
          <div className="admin-loading">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Type</th><th>Color</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty-icon">📦</div><p>No products found.</p></div></td></tr>
              </tbody>
            </table>
          </div>
        ) : groups.length === 0 ? (
          // Fallback if product types haven't loaded yet
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Type</th><th>Color</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{renderRows(products)}</tbody>
            </table>
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#1a5f7a',
                borderBottom: '2px solid #e0f0f4',
                paddingBottom: '8px',
                marginBottom: '0',
              }}>
                {label} ({items.length})
              </h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Color</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{renderRows(items)}</tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {modalProduct !== undefined && productTypes.length > 0 && (
        <ProductModal
          product={modalProduct}
          productTypes={productTypes}
          onClose={() => setModalProduct(undefined)}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AdminLayout>
  );
}

export default AdminInventory;
