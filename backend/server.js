const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./database');

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const subscribeRouter = require('./routes/subscribe');
const contactRouter = require('./routes/contact');
const preorderRouter = require('./routes/preorder');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const productTypesRouter = require('./routes/productTypes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/product-types', productTypesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/contact', contactRouter);
app.use('/api/preorder', preorderRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KAT Life API is running' });
});

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      price REAL DEFAULT 0,
      image_url TEXT,
      description TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      product_type_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_id INTEGER,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      city TEXT,
      country TEXT,
      password_hash TEXT NOT NULL,
      consent_contacted INTEGER DEFAULT 0,
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
      is_verified INTEGER DEFAULT 0,
      preorder_status TEXT DEFAULT 'Ordered',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guest_preorders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      city TEXT,
      country TEXT,
      product_interest TEXT,
      color TEXT,
      size TEXT,
      status TEXT DEFAULT 'Ordered',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      contact TEXT,
      email TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL
    );
  `);

  // Add product_type_id column to products if it doesn't exist (migration for existing DBs)
  try {
    db.exec('ALTER TABLE products ADD COLUMN product_type_id INTEGER');
  } catch {
    // Column already exists — safe to ignore
  }

  // Seed product types if empty
  const typeCount = db.prepare('SELECT COUNT(*) as cnt FROM product_types').get();
  if (typeCount.cnt === 0) {
    const insertType = db.prepare('INSERT INTO product_types (name, slug) VALUES (?, ?)');
    const seedTypes = db.transaction(() => {
      insertType.run('OSTAYA Skort', 'ostaya-skort');
      insertType.run('OSTAYA Short', 'ostaya-short');
      insertType.run('CURVA Short', 'curva-short');
      insertType.run('ARRO Top', 'arro-top');
    });
    seedTypes();
    console.log('Seeded 4 product types.');
  }

  // Seed products if empty
  const productCount = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (productCount.cnt === 0) {
    const desc = 'Your smart, wearable short designed to promote bone vitality and postural alignment using gentle, non-invasive electrical stimulation. Seamlessly integrating into daily routines, it acts as a wellness supplement for your core.';
    const insertProduct = db.prepare(
      'INSERT INTO products (name, type, color, price, image_url, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const seedProducts = db.transaction(() => {
      insertProduct.run('OSTAYA™ Wellness Skort', 'skort', 'White',      0, '/images/skort-white.png',      desc);
      insertProduct.run('OSTAYA™ Wellness Skort', 'skort', 'Black',      0, '/images/skort-black.png',      desc);
      insertProduct.run('OSTAYA™ Wellness Skort', 'skort', 'Royal Blue', 0, '/images/skort-royal-blue.png', desc);
      insertProduct.run('OSTAYA™ Wellness Skort', 'skort', 'Grey',       0, '/images/skort-grey.png',       desc);
      insertProduct.run('OSTAYA™ Wellness Short', 'short', 'Black',      0, '/images/shorts-black.png',     desc);
      insertProduct.run('OSTAYA™ Wellness Short', 'short', 'White',      0, '/images/shorts-white.png',     desc);
      insertProduct.run('OSTAYA™ Wellness Short', 'short', 'Navy Blue',  0, '/images/shorts-navy-blue.png', desc);
    });
    seedProducts();
    console.log('Database seeded with 7 products.');
  }

  // Migration: link existing products to product_types where not yet linked
  db.prepare(`
    UPDATE products SET product_type_id = (
      SELECT id FROM product_types WHERE slug = 'ostaya-skort' LIMIT 1
    ) WHERE type = 'skort' AND product_type_id IS NULL
  `).run();
  db.prepare(`
    UPDATE products SET product_type_id = (
      SELECT id FROM product_types WHERE slug = 'ostaya-short' LIMIT 1
    ) WHERE type = 'short' AND product_type_id IS NULL
  `).run();

  // Seed default admin if none exists
  const adminExists = db.prepare("SELECT COUNT(*) as cnt FROM admin_users WHERE username = 'admin'").get();
  if (adminExists.cnt === 0) {
    const hashed = bcrypt.hashSync('Admin@KAT2026', 10);
    db.prepare('INSERT INTO admin_users (username, email, password, role) VALUES (?, ?, ?, ?)').run(
      'admin', 'admin@katlife.com', hashed, 'superadmin'
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

initDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`KAT Life backend running on port ${PORT}`);
});
