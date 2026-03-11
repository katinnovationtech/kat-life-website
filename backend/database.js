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
    ['OSTAYA™ Wellness Skort', 'skort', 'White',      0.00, 'https://picsum.photos/seed/skort-white/600/700',      desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Black',      0.00, 'https://picsum.photos/seed/skort-black/600/700',      desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Royal Blue', 0.00, 'https://picsum.photos/seed/skort-royalblue/600/700', desc],
    ['OSTAYA™ Wellness Skort', 'skort', 'Grey',       0.00, 'https://picsum.photos/seed/skort-grey/600/700',       desc],
    // Wellness Shorts
    ['OSTAYA™ Wellness Short', 'short', 'Black',      0.00, 'https://picsum.photos/seed/short-black/600/700',      desc],
    ['OSTAYA™ Wellness Short', 'short', 'White',      0.00, 'https://picsum.photos/seed/short-white/600/700',      desc],
    ['OSTAYA™ Wellness Short', 'short', 'Grey',       0.00, 'https://picsum.photos/seed/short-grey/600/700',       desc],
    ['OSTAYA™ Wellness Short', 'short', 'Navy Blue',  0.00, 'https://picsum.photos/seed/short-navyblue/600/700',  desc],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });
  insertMany(products);
  console.log('Database seeded with 8 products.');
}

module.exports = db;
