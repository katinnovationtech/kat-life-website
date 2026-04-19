const express = require('express');
const router = express.Router();
const pool = require('../database');

// POST /api/preorder/guest
router.post('/guest', async (req, res) => {
  const { full_name, email, phone, city, country, product_interest, color, size, session_id } = req.body;

  if (!full_name || !email || !phone || !city || !country || !product_interest || !color || !size) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM guest_preorders WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This email has already been registered for a pre-order.',
      });
    }

    await pool.query(
      'INSERT INTO guest_preorders (full_name, email, phone, city, country, product_interest, color, size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [full_name, email, phone, city, country, product_interest, color, size]
    );

    if (session_id) {
      await pool.query('DELETE FROM cart WHERE session_id = $1', [session_id]);
    }

    console.log(`[PreOrder] Guest pre-order registered: ${email}`);
    res.json({ success: true, message: 'Pre-order registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

module.exports = router;
