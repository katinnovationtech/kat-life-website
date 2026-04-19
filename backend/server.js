require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./database');

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const subscribeRouter = require('./routes/subscribe');
const contactRouter = require('./routes/contact');
const preorderRouter = require('./routes/preorder');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/contact', contactRouter);
app.use('/api/preorder', preorderRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KAT Life API is running' });
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      price DECIMAL(10,2) DEFAULT 0,
      image_url TEXT,
      description TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id INTEGER REFERENCES products(id),
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      city TEXT,
      country TEXT,
      password_hash TEXT NOT NULL,
      consent_contacted BOOLEAN DEFAULT false,
      sex TEXT,
      height_feet INTEGER,
      height_inches INTEGER,
      weight REAL,
      weight_unit TEXT DEFAULT 'lbs',
      age_range TEXT,
      primary_health_goal TEXT,
      how_heard TEXT,
      activity_level TEXT,
      health_concerns TEXT,
      discount_code TEXT UNIQUE,
      verification_token TEXT,
      reset_token TEXT,
      is_verified BOOLEAN DEFAULT false,
      preorder_status TEXT DEFAULT 'Ordered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guest_preorders (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      city TEXT,
      country TEXT,
      product_interest TEXT,
      color TEXT,
      size TEXT,
      status TEXT DEFAULT 'Ordered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_subscriptions (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      contact TEXT,
      email TEXT NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admin_users(id),
      token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );
  `);

  // Seed products if table is empty
  const countResult = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(countResult.rows[0].count) === 0) {
    const desc = 'Your smart, wearable short designed to promote bone vitality and postural alignment using gentle, non-invasive electrical stimulation. Seamlessly integrating into daily routines, it acts as a wellness supplement for your core.';
    const products = [
      ['OSTAYA™ Wellness Skort', 'skort', 'White',      0, '/images/skort-white.png',      desc],
      ['OSTAYA™ Wellness Skort', 'skort', 'Black',      0, '/images/skort-black.png',      desc],
      ['OSTAYA™ Wellness Skort', 'skort', 'Royal Blue', 0, '/images/skort-royal-blue.png', desc],
      ['OSTAYA™ Wellness Skort', 'skort', 'Grey',       0, '/images/skort-grey.png',       desc],
      ['OSTAYA™ Wellness Short', 'short', 'Black',      0, '/images/shorts-black.png',     desc],
      ['OSTAYA™ Wellness Short', 'short', 'White',      0, '/images/shorts-white.png',     desc],
      ['OSTAYA™ Wellness Short', 'short', 'Navy Blue',  0, '/images/shorts-navy-blue.png', desc],
    ];
    for (const [name, type, color, price, image_url, description] of products) {
      await pool.query(
        'INSERT INTO products (name, type, color, price, image_url, description) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, type, color, price, image_url, description]
      );
    }
    console.log('Database seeded with 7 products.');
  }

  // Seed default admin if none exists
  const adminResult = await pool.query("SELECT COUNT(*) FROM admin_users WHERE username = 'admin'");
  if (parseInt(adminResult.rows[0].count) === 0) {
    const hashed = await bcrypt.hash('Admin@KAT2026', 10);
    await pool.query(
      'INSERT INTO admin_users (username, email, password, role) VALUES ($1, $2, $3, $4)',
      ['admin', 'admin@katlife.com', hashed, 'superadmin']
    );
    console.log('\n========================================');
    console.log('  DEFAULT ADMIN ACCOUNT CREATED');
    console.log('  Username : admin');
    console.log('  Password : Admin@KAT2026');
    console.log('  Email    : admin@katlife.com');
    console.log('  Role     : superadmin');
    console.log('  Login at : http://localhost:3000/admin/login');
    console.log('========================================\n');
  }
}

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`KAT Life backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
