const express = require('express');
const router = express.Router();
const pool = require('../database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { full_name, contact, email, message } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!contact || !contact.trim()) {
      return res.status(400).json({ success: false, error: 'Contact is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ success: false, error: 'Message must not exceed 500 characters.' });
    }

    await pool.query(
      'INSERT INTO contact_messages (full_name, contact, email, message) VALUES ($1, $2, $3, $4)',
      [full_name.trim(), contact.trim(), email.trim().toLowerCase(), message.trim()]
    );

    res.status(201).json({ success: true, message: "Your message has been sent. We'll be in touch soon!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
