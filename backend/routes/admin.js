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

  const session = db.prepare(
    "SELECT s.*, a.id as admin_id, a.username, a.email, a.role FROM admin_sessions s JOIN admin_users a ON s.admin_id = a.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).get(token);

  if (!session) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

  req.admin = { id: session.admin_id, username: session.username, email: session.email, role: session.role };
  next();
}

// ─── Authentication ───────────────────────────────────────────────────────────

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: 'Username and password required' });

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];

  db.prepare('INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)').run(admin.id, token, expiresAt);

  res.json({
    success: true,
    token,
    admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
  });
});

// POST /api/admin/logout
router.post('/logout', requireAdmin, (req, res) => {
  const token = req.headers['authorization'].replace('Bearer ', '');
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

router.get('/stats', requireAdmin, (req, res) => {
  const totalGuestPreorders = db.prepare('SELECT COUNT(*) as cnt FROM guest_preorders').get().cnt;
  const totalMemberPreorders = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE preorder_status IS NOT NULL AND preorder_status != ''").get().cnt;
  const totalSignups = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const totalSubscribers = db.prepare('SELECT COUNT(*) as cnt FROM email_subscriptions').get().cnt;
  const totalMessages = db.prepare('SELECT COUNT(*) as cnt FROM contact_messages').get().cnt;
  const unreadMessages = db.prepare('SELECT COUNT(*) as cnt FROM contact_messages WHERE is_read = 0').get().cnt;

  const statusCounts = db.prepare(
    "SELECT status, COUNT(*) as cnt FROM guest_preorders GROUP BY status"
  ).all();

  const recentActivity = db.prepare(
    "SELECT id, full_name, email, product_interest as product, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC LIMIT 10"
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
});

// ─── Pre-Orders ───────────────────────────────────────────────────────────────

router.get('/preorders/guest', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM guest_preorders ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, preorders: rows });
});

router.get('/preorders/members', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, username, email, discount_code, preorder_status, activity_level, primary_health_goal, age_range, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, preorders: rows });
});

router.get('/preorders/all', requireAdmin, (req, res) => {
  const guests = db.prepare('SELECT *, "guest" as type FROM guest_preorders ORDER BY created_at DESC').all();
  const members = db.prepare(
    'SELECT id, username as full_name, email, discount_code, preorder_status as status, created_at, "member" as type FROM users ORDER BY created_at DESC'
  ).all();
  const combined = [...guests, ...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ success: true, preorders: combined });
});

router.put('/preorders/guest/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  db.prepare('UPDATE guest_preorders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.put('/preorders/member/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  db.prepare('UPDATE users SET preorder_status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.get('/preorders/export', requireAdmin, (req, res) => {
  const guests = db.prepare('SELECT * FROM guest_preorders ORDER BY created_at DESC').all();
  const members = db.prepare(
    'SELECT id, username, email, discount_code, preorder_status, created_at FROM users ORDER BY created_at DESC'
  ).all();

  const headers = 'Type,ID,Name,Email,Phone,Product,Color,Size,Status,Date\n';
  const guestRows = guests.map(r =>
    `Guest,${r.id},"${r.full_name}","${r.email}","${r.phone || ''}","${r.product_interest}","${r.color}","${r.size}","${r.status}","${r.created_at}"`
  ).join('\n');
  const memberRows = members.map(r =>
    `Member,${r.id},"${r.username}","${r.email}","${r.discount_code || ''}","","","","${r.preorder_status}","${r.created_at}"`
  ).join('\n');

  const csv = headers + guestRows + '\n' + memberRows;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="preorders.csv"');
  res.send(csv);
});

// ─── Products / Inventory ─────────────────────────────────────────────────────

router.get('/products', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json({ success: true, products: rows });
});

router.post('/products', requireAdmin, (req, res) => {
  const { name, type, color, price, description, image_url, is_available } = req.body;
  if (!name || !type || !color) return res.status(400).json({ success: false, error: 'Name, type and color required' });

  const result = db.prepare(
    'INSERT INTO products (name, type, color, price, image_url, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, type, color, price || 0, image_url || '', description || '');

  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const { name, type, color, price, description, image_url } = req.body;
  db.prepare(
    'UPDATE products SET name = ?, type = ?, color = ?, price = ?, description = ?, image_url = ? WHERE id = ?'
  ).run(name, type, color, price, description, image_url, req.params.id);
  res.json({ success: true });
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/products/:id/availability', requireAdmin, (req, res) => {
  // Toggle: add/remove from "sold out" by price marker or a new column
  // We add is_available column via migration in database.js — check and add here if missing
  const cols = db.prepare('PRAGMA table_info(products)').all().map(c => c.name);
  if (!cols.includes('is_available')) {
    db.exec('ALTER TABLE products ADD COLUMN is_available INTEGER NOT NULL DEFAULT 1');
  }
  const { is_available } = req.body;
  db.prepare('UPDATE products SET is_available = ? WHERE id = ?').run(is_available ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, username, email, discount_code, preorder_status, activity_level, primary_health_goal, age_range, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, users: rows });
});

router.get('/subscribers', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM email_subscriptions ORDER BY subscribed_at DESC').all();
  res.json({ success: true, subscribers: rows });
});

router.get('/contacts', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY sent_at DESC').all();
  res.json({ success: true, messages: rows });
});

router.put('/contacts/:id/read', requireAdmin, (req, res) => {
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
