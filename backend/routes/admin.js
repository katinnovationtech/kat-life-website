const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../database');

const router = express.Router();

// ─── Auth Middleware ──────────────────────────────────────────────────────────

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
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ─── Authentication ───────────────────────────────────────────────────────────

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: 'Username and password required' });

  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES ($1, $2, $3)',
      [admin.id, token, expiresAt]
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
router.post('/logout', requireAdmin, async (req, res) => {
  try {
    const token = req.headers['authorization'].replace('Bearer ', '');
    await pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
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

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      guestResult,
      memberResult,
      signupsResult,
      subscribersResult,
      messagesResult,
      unreadResult,
      statusResult,
      activityResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM guest_preorders'),
      pool.query("SELECT COUNT(*) FROM users WHERE preorder_status IS NOT NULL AND preorder_status != ''"),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM email_subscriptions'),
      pool.query('SELECT COUNT(*) FROM contact_messages'),
      pool.query('SELECT COUNT(*) FROM contact_messages WHERE is_read = false'),
      pool.query('SELECT status, COUNT(*) as cnt FROM guest_preorders GROUP BY status'),
      pool.query('SELECT id, full_name, email, product_interest as product, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC LIMIT 10'),
    ]);

    const totalGuestPreorders = parseInt(guestResult.rows[0].count);
    const totalMemberPreorders = parseInt(memberResult.rows[0].count);

    res.json({
      success: true,
      stats: {
        totalGuestPreorders,
        totalMemberPreorders,
        totalPreorders: totalGuestPreorders + totalMemberPreorders,
        totalSignups: parseInt(signupsResult.rows[0].count),
        totalSubscribers: parseInt(subscribersResult.rows[0].count),
        totalMessages: parseInt(messagesResult.rows[0].count),
        unreadMessages: parseInt(unreadResult.rows[0].count),
        statusCounts: statusResult.rows,
        recentActivity: activityResult.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Pre-Orders ───────────────────────────────────────────────────────────────

router.get('/preorders/guest', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, city, country, product_interest, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC'
    );
    res.json({ success: true, preorders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/members', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, city, country,
       age_range, sex, height_feet, height_inches, weight, weight_unit,
       activity_level, primary_health_goal, how_heard, health_concerns,
       discount_code, consent_contacted, preorder_status, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, preorders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/all', requireAdmin, async (req, res) => {
  try {
    const [guestResult, memberResult] = await Promise.all([
      pool.query("SELECT *, 'guest' as type FROM guest_preorders ORDER BY created_at DESC"),
      pool.query(
        `SELECT id, COALESCE(first_name || ' ' || last_name, username) as full_name,
         email, discount_code, preorder_status as status, created_at, 'member' as type
         FROM users ORDER BY created_at DESC`
      ),
    ]);
    const combined = [...guestResult.rows, ...memberResult.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, preorders: combined });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/preorders/guest/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  try {
    await pool.query('UPDATE guest_preorders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/preorders/member/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Ordered', 'Processing', 'In Delivery', 'Delivered'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });

  try {
    await pool.query('UPDATE users SET preorder_status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/preorders/export', requireAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    const headers = 'Type,ID,Name,Email,Phone,City,Country,Product,Color,Size,Status,Date\n';
    let csv = headers;

    if (!type || type === 'guest') {
      const result = await pool.query(
        'SELECT id, full_name, email, phone, city, country, product_interest, color, size, status, created_at FROM guest_preorders ORDER BY created_at DESC'
      );
      const guestRows = result.rows.map(r =>
        `Guest,${r.id},"${r.full_name || ''}","${r.email || ''}","${r.phone || ''}","${r.city || ''}","${r.country || ''}","${r.product_interest || ''}","${r.color || ''}","${r.size || ''}","${r.status || ''}","${r.created_at || ''}"`
      ).join('\n');
      csv += guestRows;
    }

    if (!type || type === 'member') {
      const result = await pool.query(
        `SELECT id, COALESCE(first_name || ' ' || last_name, username) as display_name,
         email, discount_code, preorder_status, created_at FROM users ORDER BY created_at DESC`
      );
      const memberRows = result.rows.map(r =>
        `Member,${r.id},"${r.display_name || ''}","${r.email || ''}","","","","${r.discount_code || ''}","","","${r.preorder_status || ''}","${r.created_at || ''}"`
      ).join('\n');
      if (!type || type === 'guest') csv += '\n';
      csv += memberRows;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="preorders.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Products / Inventory ─────────────────────────────────────────────────────

router.get('/products', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', requireAdmin, async (req, res) => {
  const { name, type, color, price, description, image_url } = req.body;
  if (!name || !type || !color)
    return res.status(400).json({ success: false, error: 'Name, type and color required' });

  try {
    const result = await pool.query(
      'INSERT INTO products (name, type, color, price, image_url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, type, color, price || 0, image_url || '', description || '']
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
  const { name, type, color, price, description, image_url } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name = $1, type = $2, color = $3, price = $4, description = $5, image_url = $6 WHERE id = $7',
      [name, type, color, price, description, image_url, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id/availability', requireAdmin, async (req, res) => {
  const { is_available } = req.body;
  try {
    await pool.query('UPDATE products SET is_available = $1 WHERE id = $2', [is_available ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, first_name, last_name, email, phone, city, country,
       age_range, sex, height_feet, height_inches, weight, weight_unit,
       primary_health_goal, activity_level, health_concerns, how_heard,
       discount_code, preorder_status, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/subscribers', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM email_subscriptions ORDER BY subscribed_at DESC');
    res.json({ success: true, subscribers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/contacts', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY sent_at DESC');
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/contacts/:id/read', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
