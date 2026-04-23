const express = require('express');
const router = express.Router();
const db = require('../database');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  const session = db.prepare(`
    SELECT s.*, a.id as admin_id, a.username, a.email, a.role
    FROM admin_sessions s
    JOIN admin_users a ON s.admin_id = a.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token);

  if (!session) return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  req.admin = { id: session.admin_id, username: session.username, email: session.email, role: session.role };
  next();
}

// GET /api/product-types — public, active types only
router.get('/', (req, res) => {
  try {
    const types = db.prepare('SELECT * FROM product_types WHERE is_active = 1 ORDER BY name').all();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/product-types — admin only
router.post('/', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  try {
    const existing = db.prepare('SELECT id FROM product_types WHERE name = ? OR slug = ?').get(trimmed, slug);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A product type with this name already exists.' });
    }
    const info = db.prepare(
      'INSERT INTO product_types (name, slug, description) VALUES (?, ?, ?)'
    ).run(trimmed, slug, description?.trim() || null);
    const created = db.prepare('SELECT * FROM product_types WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/product-types/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const { name, description, is_active } = req.body;
  const { id } = req.params;
  try {
    const cur = db.prepare('SELECT * FROM product_types WHERE id = ?').get(id);
    if (!cur) {
      return res.status(404).json({ success: false, error: 'Product type not found.' });
    }
    const newName = name?.trim() || cur.name;
    const newSlug = slugify(newName);

    if (newName !== cur.name) {
      const existing = db.prepare('SELECT id FROM product_types WHERE (name = ? OR slug = ?) AND id != ?').get(newName, newSlug, id);
      if (existing) {
        return res.status(409).json({ success: false, error: 'A product type with this name already exists.' });
      }
    }

    const newActive = is_active !== undefined ? (is_active ? 1 : 0) : cur.is_active;
    const newDesc = description !== undefined ? (description?.trim() || null) : cur.description;

    db.prepare(
      'UPDATE product_types SET name = ?, slug = ?, description = ?, is_active = ? WHERE id = ?'
    ).run(newName, newSlug, newDesc, newActive, id);

    const updated = db.prepare('SELECT * FROM product_types WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/product-types/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const type = db.prepare('SELECT * FROM product_types WHERE id = ?').get(id);
    if (!type) {
      return res.status(404).json({ success: false, error: 'Product type not found.' });
    }

    const count = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE product_type_id = ?').get(id).cnt;
    if (count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete "${type.name}" because ${count} product${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} using this type. Please reassign or delete those products first.`,
      });
    }

    db.prepare('DELETE FROM product_types WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
