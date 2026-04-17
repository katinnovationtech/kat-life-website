const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();

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

    const result = Object.values(grouped);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:id  — unchanged, used by product detail page
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
