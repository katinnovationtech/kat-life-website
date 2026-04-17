const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/preorder-guest
router.post('/guest', (req, res) => {
  const { full_name, email, phone, city, country, product_interest, color, size, session_id } = req.body;

  // Validate required fields
  if (!full_name || !email || !phone || !city || !country || !product_interest || !color || !size) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  // Check for duplicate email
  const existing = db.prepare('SELECT id FROM guest_preorders WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'This email has already been registered for a pre-order.',
    });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO guest_preorders (full_name, email, phone, city, country, product_interest, color, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(full_name, email, phone, city, country, product_interest, color, size);
    if (session_id) {
      db.prepare('DELETE FROM cart WHERE session_id = ?').run(session_id);
    }
    console.log(`[PreOrder] Guest pre-order registered: ${email}`);
    res.json({ success: true, message: 'Pre-order registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

module.exports = router;
