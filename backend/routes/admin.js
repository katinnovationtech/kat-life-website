const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();

// ─── Auth Middleware ──────────────────────────────────────────────────────────

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

// ─── Authentication ───────────────────────────────────────────────────────────

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: 'Username and password required' });

  try {
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)').run(
      admin.id, token, expiresAt
    );

    res.json({
      success: true,
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/logout
router.post('/logout', requireAdmin, (req, res) => {
  try {
    const token = req.headers['authorization'].replace('Bearer ', '');
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

router.get('/stats', requireAdmin, (req, res) => {
  try {
    const totalGuestPreorders = db.prepare('SELECT COUNT(*) as cnt FROM guest_preorders').get().cnt;
    const totalMemberPreorders = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE preorder_status IS NOT NULL AND preorder_status != ''").get().cnt;
    const totalSignups = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const totalSubscribers = db.prepare('SELECT COUNT(*) as cnt FROM email_subscriptions').get().cnt;
    const totalMessages = db.prepare('SELECT COUNT(*) as cnt FROM contact_messages').get().cnt;
    const unreadMessages = db.prepare('SELECT COUNT(*) as cnt FROM contact_messages WHERE is_read = 0').get().cnt;
    const statusCounts = db.prepare('SELECT status, COUNT(*) as cnt FROM guest_preorders GROUP BY status').all();
    const recentActivity = db.prepare(
      'SELECT id, full_name, email, product_interest as product, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC LIMIT 10'
    ).all();

    res.json({
      success: true,
      stats: {
        totalGuestPreorders,
        totalMemberPreorders,
        totalPreorders: totalGuestPreorders + totalMemberPreorders,
        totalSignups,
        totalSubscribers,
        totalMessages,
        unreadMessages,
        statusCounts,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Pre-Orders ───────────────────────────────────────────────────────────────

router.get('/preorders/guest', requireAdmin, (req, res) => {
  try {
    const preorders = db.prepare(
      'SELECT id, full_name, email, phone, city, country, product_interest, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC'
    ).all();
    res.json({ success: true, preorders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/members', requireAdmin, (req, res) => {
  try {
    const preorders = db.prepare(
      `SELECT id, first_name, last_name, email, phone, city, country,
       age_range, sex, height_feet, height_inches, weight, weight_unit,
       activity_level, primary_health_goal, how_heard, health_concerns,
       discount_code, consent_contacted, preorder_status, created_at
       FROM users ORDER BY created_at DESC`
    ).all();
    res.json({ success: true, preorders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/all', requireAdmin, (req, res) => {
  try {
    const guests = db.prepare("SELECT *, 'guest' as type FROM guest_preorders ORDER BY created_at DESC").all();
    const members = db.prepare(
      `SELECT id, COALESCE(first_name || ' ' || last_name, username) as full_name,
       email, discount_code, preorder_status as status, created_at, 'member' as type
       FROM users ORDER BY created_at DESC`
    ).all();
    const combined = [...guests, ...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, preorders: combined });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/preorders/guest/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  try {
    db.prepare('UPDATE guest_preorders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/preorders/member/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  try {
    db.prepare('UPDATE users SET preorder_status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/export', requireAdmin, (req, res) => {
  try {
    const { type } = req.query;
    const headers = 'Type,ID,Name,Email,Phone,City,Country,Product,Color,Size,Status,Date\n';
    let csv = headers;

    if (!type || type === 'guest') {
      const rows = db.prepare(
        'SELECT id, full_name, email, phone, city, country, product_interest, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC'
      ).all();
      csv += rows.map(r =>
        `Guest,${r.id},"${r.full_name || ''}","${r.email || ''}","${r.phone || ''}","${r.city || ''}","${r.country || ''}","${r.product_interest || ''}","${r.color || ''}","${r.size || ''}","${r.status || ''}","${r.created_at || ''}"`
      ).join('\n');
    }

    if (!type || type === 'member') {
      const rows = db.prepare(
        `SELECT id, COALESCE(first_name || ' ' || last_name, username) as display_name,
         email, discount_code, preorder_status, created_at FROM users ORDER BY created_at DESC`
      ).all();
      if (!type || type === 'guest') csv += '\n';
      csv += rows.map(r =>
        `Member,${r.id},"${r.display_name || ''}","${r.email || ''}","","","","${r.discount_code || ''}","","","${r.preorder_status || ''}","${r.created_at || ''}"`
      ).join('\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="preorders.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Products / Inventory ─────────────────────────────────────────────────────

router.get('/products', requireAdmin, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, pt.name as product_type_name, pt.slug as product_type_slug
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      ORDER BY pt.name, p.name, p.color
    `).all();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', requireAdmin, (req, res) => {
  const { name, color, price, description, image_url, product_type_id } = req.body;
  if (!name || !color || !product_type_id)
    return res.status(400).json({ success: false, error: 'Name, color and product type are required' });

  try {
    const typeRow = db.prepare('SELECT slug FROM product_types WHERE id = ?').get(product_type_id);
    const typeSlug = typeRow?.slug || 'other';

    const info = db.prepare(
      'INSERT INTO products (name, type, color, price, image_url, description, product_type_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, typeSlug, color, price || 0, image_url || '', description || '', product_type_id);

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const { name, color, price, description, image_url, product_type_id } = req.body;
  try {
    const typeRow = db.prepare('SELECT slug FROM product_types WHERE id = ?').get(product_type_id);
    const typeSlug = typeRow?.slug || 'other';

    db.prepare(
      'UPDATE products SET name = ?, type = ?, color = ?, price = ?, description = ?, image_url = ?, product_type_id = ? WHERE id = ?'
    ).run(name, typeSlug, color, price, description, image_url, product_type_id || null, req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Product Types (admin view with counts) ───────────────────────────────────

router.get('/product-types', requireAdmin, (req, res) => {
  try {
    const types = db.prepare(`
      SELECT pt.*, COUNT(p.id) as product_count
      FROM product_types pt
      LEFT JOIN products p ON p.product_type_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.name
    `).all();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id/availability', requireAdmin, (req, res) => {
  const { is_available } = req.body;
  try {
    db.prepare('UPDATE products SET is_available = ? WHERE id = ?').run(is_available ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(
      `SELECT id, username, first_name, last_name, email, phone, city, country,
       age_range, sex, height_feet, height_inches, weight, weight_unit,
       primary_health_goal, activity_level, health_concerns, how_heard,
       discount_code, preorder_status, created_at
       FROM users ORDER BY created_at DESC`
    ).all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/subscribers', requireAdmin, (req, res) => {
  try {
    const subscribers = db.prepare('SELECT * FROM email_subscriptions ORDER BY subscribed_at DESC').all();
    res.json({ success: true, subscribers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/contacts', requireAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY sent_at DESC').all();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/contacts/:id/read', requireAdmin, (req, res) => {
  try {
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
