const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    const products = result.rows;

    const grouped = {};
    products.forEach(product => {
      const key = product.type;
      if (!grouped[key]) {
        grouped[key] = {
          base_product: key,
          name: product.name,
          variants: []
        };
      }
      grouped[key].variants.push({
        id: product.id,
        color: product.color,
        image_url: product.image_url,
        price: product.price
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const product = result.rows[0];
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
