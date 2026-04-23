const express = require('express');
const router = express.Router();
const db = require('../database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe
router.post('/', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existing = db.prepare(
      'SELECT id FROM email_subscriptions WHERE email = ?'
    ).get(email.trim().toLowerCase());

    if (existing) {
      return res.status(409).json({ success: false, error: 'This email is already subscribed.' });
    }

    db.prepare('INSERT INTO email_subscriptions (email) VALUES (?)').run(email.trim().toLowerCase());
    res.status(201).json({ success: true, message: 'Thank you for subscribing!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
