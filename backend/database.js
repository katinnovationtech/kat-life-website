const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'kat_life.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('skort', 'short')),
    color TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0.00,
    image_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS email_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS guest_preorders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    product_interest TEXT NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    discount_code TEXT NOT NULL UNIQUE,
    is_verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed products if table is empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
if (count.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, type, color, price, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const desc = 'Your smart, wearable short designed to promote bone vitality and postural alignment using gentle, non-invasive electrical stimulation. Seamlessly integrating into daily routines, it acts as a wellness supplement for your core.';

  const products = [
    // Wellness Skorts
    ['OSTAYA™ Wellness Skort', 'skort', 'White',      0.00, '/images/skort-white.png',      desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Black',      0.00, '/images/skort-black.png',      desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Royal Blue', 0.00, '/images/skort-royal-blue.png', desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Grey',       0.00, '/images/skort-grey.png',       desc],
    // Wellness Shorts
    ['OSTAYA™ Wellness Short', 'short', 'Black',      0.00, '/images/shorts-black.png',     desc],
    ['OSTAYA™ Wellness Short', 'short', 'White',      0.00, '/images/shorts-white.png',     desc],
    ['OSTAYA™ Wellness Short', 'short', 'Navy Blue',  0.00, '/images/shorts-navy-blue.png', desc],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });
  insertMany(products);
  console.log('Database seeded with 8 products.');
}

// Migrate: update product image_urls from placeholder URLs to actual images
const hasPlaceholder = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE image_url LIKE 'https://picsum.photos%'").get();
if (hasPlaceholder.cnt > 0) {
  db.exec(`
    UPDATE products SET image_url = '/images/skort-white.png'      WHERE type = 'skort' AND color = 'White';
    UPDATE products SET image_url = '/images/skort-black.png'      WHERE type = 'skort' AND color = 'Black';
    UPDATE products SET image_url = '/images/skort-royal-blue.png' WHERE type = 'skort' AND color = 'Royal Blue';
    UPDATE products SET image_url = '/images/skort-grey.png'       WHERE type = 'skort' AND color = 'Grey';
    UPDATE products SET image_url = '/images/shorts-black.png'     WHERE type = 'short' AND color = 'Black';
    UPDATE products SET image_url = '/images/shorts-white.png'     WHERE type = 'short' AND color = 'White';
    UPDATE products SET image_url = '/images/shorts-navy-blue.png' WHERE type = 'short' AND color = 'Navy Blue';
    DELETE FROM products WHERE type = 'short' AND color = 'Grey';
  `);
  console.log('Migrated product images to actual photo files.');
}

// Migrate: add health profile columns to users table if they don't exist
const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
const healthCols = [
  ['activity_level', 'TEXT'],
  ['primary_health_goal', 'TEXT'],
  ['health_concerns', 'TEXT'],
  ['age_range', 'TEXT'],
  ['how_heard', 'TEXT'],
];
for (const [col, type] of healthCols) {
  if (!userCols.includes(col)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
  }
}

module.exports = db;
