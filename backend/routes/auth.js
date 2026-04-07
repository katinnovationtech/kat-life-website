const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

const SALT_ROUNDS = 10;

function generateDiscountCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `OSTAYA25-${suffix}`;
}

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('at least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('at least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('at least one special character');
  return errors;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const {
    username, email, password, confirm_password, terms_accepted,
    activity_level, primary_health_goal, health_concerns, age_range, how_heard,
  } = req.body;

  if (!username || !email || !password || !confirm_password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // Validate health questions
  if (!activity_level) {
    return res.status(400).json({ success: false, field: 'activity_level', error: 'Please select your activity level.' });
  }
  if (!primary_health_goal) {
    return res.status(400).json({ success: false, field: 'primary_health_goal', error: 'Please select your primary health goal.' });
  }
  if (!health_concerns || (Array.isArray(health_concerns) && health_concerns.length === 0)) {
    return res.status(400).json({ success: false, field: 'health_concerns', error: 'Please select at least one health concern.' });
  }
  if (!age_range) {
    return res.status(400).json({ success: false, field: 'age_range', error: 'Please select your age range.' });
  }
  if (!how_heard) {
    return res.status(400).json({ success: false, field: 'how_heard', error: 'Please tell us how you heard about us.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const strengthErrors = validatePasswordStrength(password);
  if (strengthErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Password must have: ${strengthErrors.join(', ')}.`,
    });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, error: 'Passwords do not match.' });
  }

  if (!terms_accepted) {
    return res.status(400).json({ success: false, error: 'You must accept the Terms and Conditions.' });
  }

  // Check for duplicate username
  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUsername) {
    return res.status(409).json({ success: false, field: 'username', error: 'This username is already taken.' });
  }

  // Check for duplicate email
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    return res.status(409).json({ success: false, field: 'email', error: 'This email is already registered.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = generateToken();
    let discountCode = generateDiscountCode();

    // Ensure discount code is unique
    while (db.prepare('SELECT id FROM users WHERE discount_code = ?').get(discountCode)) {
      discountCode = generateDiscountCode();
    }

    const healthConcernsStr = Array.isArray(health_concerns)
      ? health_concerns.join(',')
      : String(health_concerns);

    db.prepare(
      `INSERT INTO users
        (username, email, password_hash, discount_code, is_verified, verification_token,
         activity_level, primary_health_goal, health_concerns, age_range, how_heard)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`
    ).run(
      username, email, passwordHash, discountCode, verificationToken,
      activity_level, primary_health_goal, healthConcernsStr, age_range, how_heard
    );

    console.log(`[Auth] New signup: ${email} | Verification token: ${verificationToken} | Discount: ${discountCode}`);

    res.json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  try {
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in.',
        unverified: true,
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        discount_code: user.discount_code,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ success: false, error: 'Username and email are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND email = ?').get(username, email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found with that username and email.' });
  }

  const resetToken = generateToken();
  db.prepare('UPDATE users SET reset_token = ? WHERE id = ?').run(resetToken, user.id);

  console.log(`[Auth] Password reset token for ${email}: ${resetToken}`);

  res.json({ success: true, message: 'Password reset link has been sent to your email.' });
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { username, old_password, new_password, confirm_new_password } = req.body;

  if (!username || !old_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  try {
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Old password is incorrect.' });
    }

    const strengthErrors = validatePasswordStrength(new_password);
    if (strengthErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Password must have: ${strengthErrors.join(', ')}.`,
      });
    }

    if (new_password !== confirm_new_password) {
      return res.status(400).json({ success: false, error: 'New passwords do not match.' });
    }

    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    console.log(`[Auth] Password changed for: ${user.email}`);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

module.exports = router;
