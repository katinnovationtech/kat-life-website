const express = require('express');
const router = express.Router();
const pool = require('../database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existing = await pool.query(
      'SELECT id FROM email_subscriptions WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'This email is already subscribed.' });
    }

    await pool.query('INSERT INTO email_subscriptions (email) VALUES ($1)', [email.trim().toLowerCase()]);
    res.status(201).json({ success: true, message: 'Thank you for subscribing!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
