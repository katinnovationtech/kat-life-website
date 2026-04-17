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
    first_name, last_name, email, phone, city, country,
    password, confirm_password, terms_accepted, consent_contacted,
    age_range, sex, height_feet, height_inches, weight, weight_unit,
    primary_goal, how_heard, activity_level, main_concerns,
    session_id,
  } = req.body;

  // Required field checks
  if (!first_name || !last_name || !email || !phone || !city || !country) {
    return res.status(400).json({ success: false, error: 'All contact fields are required.' });
  }
  if (!password || !confirm_password) {
    return res.status(400).json({ success: false, error: 'Password fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, field: 'email', error: 'Please enter a valid email address.' });
  }

  const strengthErrors = validatePasswordStrength(password);
  if (strengthErrors.length > 0) {
    return res.status(400).json({
      success: false,
      field: 'password',
      error: `Password must have: ${strengthErrors.join(', ')}.`,
    });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, field: 'confirm_password', error: 'Passwords do not match.' });
  }

  if (!terms_accepted) {
    return res.status(400).json({ success: false, error: 'You must accept the Terms and Conditions.' });
  }
  if (!consent_contacted) {
    return res.status(400).json({ success: false, error: 'Contact consent is required.' });
  }

  // Step 2 validation
  if (!age_range) {
    return res.status(400).json({ success: false, field: 'age_range', error: 'Please select your age range.' });
  }
  if (!sex) {
    return res.status(400).json({ success: false, field: 'sex', error: 'Please select your sex.' });
  }
  if (!weight) {
    return res.status(400).json({ success: false, field: 'weight', error: 'Weight is required.' });
  }
  if (!primary_goal) {
    return res.status(400).json({ success: false, field: 'primary_goal', error: 'Please select your primary goal.' });
  }
  if (!how_heard) {
    return res.status(400).json({ success: false, field: 'how_heard', error: 'Please tell us how you heard about us.' });
  }
  if (!activity_level) {
    return res.status(400).json({ success: false, field: 'activity_level', error: 'Please select your activity level.' });
  }
  if (!main_concerns || (Array.isArray(main_concerns) && main_concerns.length === 0)) {
    return res.status(400).json({ success: false, field: 'main_concerns', error: 'Please select at least one concern.' });
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

    while (db.prepare('SELECT id FROM users WHERE discount_code = ?').get(discountCode)) {
      discountCode = generateDiscountCode();
    }

    const mainConcernsStr = Array.isArray(main_concerns)
      ? main_concerns.join(',')
      : String(main_concerns);

    // Use email as username to satisfy the NOT NULL UNIQUE constraint on the legacy column
    db.prepare(
      `INSERT INTO users
        (username, email, password_hash, discount_code, is_verified, verification_token,
         first_name, last_name, phone, city, country, consent_contacted,
         age_range, sex, height_feet, height_inches, weight, weight_unit,
         primary_health_goal, how_heard, activity_level, health_concerns)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      email, email, passwordHash, discountCode, verificationToken,
      first_name.trim(), last_name.trim(), phone.trim(), city.trim(), country,
      consent_contacted ? 1 : 0,
      age_range, sex,
      height_feet ? parseInt(height_feet) : null,
      height_inches ? parseInt(height_inches) : null,
      weight ? parseFloat(weight) : null,
      weight_unit || 'lbs',
      primary_goal, how_heard, activity_level, mainConcernsStr
    );

    if (session_id) {
      db.prepare('DELETE FROM cart WHERE session_id = ?').run(session_id);
    }

    console.log(`[Auth] New signup: ${email} | Discount: ${discountCode}`);

    res.json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login  (uses email)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  try {
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in.',
        unverified: true,
      });
    }

    const displayName = (user.first_name && user.last_name)
      ? `${user.first_name} ${user.last_name}`
      : user.username;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: displayName,
        email: user.email,
        discount_code: user.discount_code,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/forgot-password  (email only)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found with that email address.' });
  }

  const resetToken = generateToken();
  db.prepare('UPDATE users SET reset_token = ? WHERE id = ?').run(resetToken, user.id);

  console.log(`[Auth] Password reset token for ${email}: ${resetToken}`);

  res.json({ success: true, message: 'Password reset link has been sent to your email.' });
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { username, email, old_password, new_password, confirm_new_password } = req.body;

  if ((!username && !email) || !old_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // Support lookup by either email or username (legacy support)
  const identifier = email || username;
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(identifier, identifier);
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
