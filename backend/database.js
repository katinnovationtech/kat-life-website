console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:VZorOUrpKZgJGPjLJuCkLHkGZLBYppNX@shortline.proxy.rlwy.net:28176/railway';

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('Using connection:', connectionString.substring(0, 30) + '...');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;