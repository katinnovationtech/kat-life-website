const express = require('express');
const router = express.Router();
const pool = require('../database');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    const result = await pool.query(
      `SELECT s.*, a.id as admin_id, a.username, a.email, a.role
       FROM admin_sessions s
       JOIN admin_users a ON s.admin_id = a.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    const session = result.rows[0];
    if (!session) return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    req.admin = { id: session.admin_id, username: session.username, email: session.email, role: session.role };
    next();
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// GET /api/product-types — public, active types only
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM product_types WHERE is_active = true ORDER BY name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/product-types — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  try {
    const existing = await pool.query(
      'SELECT id FROM product_types WHERE name = $1 OR slug = $2',
      [trimmed, slug]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'A product type with this name already exists.' });
    }
    const result = await pool.query(
      'INSERT INTO product_types (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [trimmed, slug, description?.trim() || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/product-types/:id — admin only
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description, is_active } = req.body;
  const { id } = req.params;
  try {
    const current = await pool.query('SELECT * FROM product_types WHERE id = $1', [id]);
    if (!current.rows[0]) {
      return res.status(404).json({ success: false, error: 'Product type not found.' });
    }
    const cur = current.rows[0];
    const newName = name?.trim() || cur.name;
    const newSlug = slugify(newName);

    if (newName !== cur.name) {
      const existing = await pool.query(
        'SELECT id FROM product_types WHERE (name = $1 OR slug = $2) AND id != $3',
        [newName, newSlug, id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'A product type with this name already exists.' });
      }
    }

    const newActive = is_active !== undefined ? is_active : cur.is_active;
    const newDesc = description !== undefined ? (description?.trim() || null) : cur.description;

    const result = await pool.query(
      'UPDATE product_types SET name = $1, slug = $2, description = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [newName, newSlug, newDesc, newActive, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/product-types/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const typeResult = await pool.query('SELECT * FROM product_types WHERE id = $1', [id]);
    if (!typeResult.rows[0]) {
      return res.status(404).json({ success: false, error: 'Product type not found.' });
    }
    const typeName = typeResult.rows[0].name;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE product_type_id = $1',
      [id]
    );
    const count = parseInt(countResult.rows[0].count);
    if (count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete "${typeName}" because ${count} product${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} using this type. Please reassign or delete those products first.`,
      });
    }

    await pool.query('DELETE FROM product_types WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
