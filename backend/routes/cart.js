const express = require('express');
const router = express.Router();
const pool = require('../database');

// POST /api/cart — add item
router.post('/', async (req, res) => {
  try {
    const { session_id, product_id, size, color, quantity = 1 } = req.body;
    if (!session_id || !product_id || !size || !color) {
      return res.status(400).json({ success: false, error: 'session_id, product_id, size, and color are required.' });
    }

    const existResult = await pool.query(
      'SELECT * FROM cart WHERE session_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
      [session_id, product_id, size, color]
    );
    const existing = existResult.rows[0];

    if (existing) {
      await pool.query('UPDATE cart SET quantity = quantity + $1 WHERE id = $2', [quantity, existing.id]);
      const updated = await pool.query('SELECT * FROM cart WHERE id = $1', [existing.id]);
      return res.json({ success: true, data: updated.rows[0] });
    }

    const insertResult = await pool.query(
      'INSERT INTO cart (session_id, product_id, size, color, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [session_id, product_id, size, color, quantity]
    );
    const item = await pool.query('SELECT * FROM cart WHERE id = $1', [insertResult.rows[0].id]);
    res.status(201).json({ success: true, data: item.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cart/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name, p.image_url, p.price as unit_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.session_id = $1
    `, [req.params.sessionId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be at least 1.' });
    }
    await pool.query('UPDATE cart SET quantity = $1 WHERE id = $2', [quantity, req.params.itemId]);
    const result = await pool.query('SELECT * FROM cart WHERE id = $1', [req.params.itemId]);
    const item = result.rows[0];
    if (!item) return res.status(404).json({ success: false, error: 'Cart item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cart WHERE id = $1', [req.params.itemId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found.' });
    }
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
