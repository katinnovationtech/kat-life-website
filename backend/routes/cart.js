const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/cart — add item
router.post('/', (req, res) => {
  try {
    const { session_id, product_id, size, color, quantity = 1 } = req.body;
    if (!session_id || !product_id || !size || !color) {
      return res.status(400).json({ success: false, error: 'session_id, product_id, size, and color are required.' });
    }

    // Check if same item already in cart
    const existing = db.prepare(
      'SELECT * FROM cart WHERE session_id = ? AND product_id = ? AND size = ? AND color = ?'
    ).get(session_id, product_id, size, color);

    if (existing) {
      db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
      const updated = db.prepare('SELECT * FROM cart WHERE id = ?').get(existing.id);
      return res.json({ success: true, data: updated });
    }

    const result = db.prepare(
      'INSERT INTO cart (session_id, product_id, size, color, quantity) VALUES (?, ?, ?, ?, ?)'
    ).run(session_id, product_id, size, color, quantity);

    const item = db.prepare('SELECT * FROM cart WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cart/:sessionId
router.get('/:sessionId', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT c.*, p.name, p.image_url, p.price as unit_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.session_id = ?
    `).all(req.params.sessionId);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be at least 1.' });
    }
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, req.params.itemId);
    const item = db.prepare('SELECT * FROM cart WHERE id = ?').get(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, error: 'Cart item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.itemId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found.' });
    }
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
