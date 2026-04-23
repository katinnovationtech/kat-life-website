const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pt.name as product_type_name, pt.slug as product_type_slug
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      ORDER BY pt.name NULLS LAST, p.name, p.color
    `);
    const products = result.rows;

    const grouped = {};
    products.forEach(product => {
      const key = product.product_type_id
        ? `type_${product.product_type_id}`
        : `legacy_${product.type}`;

      const typeName = product.product_type_name || product.type;
      const typeSlug = product.product_type_slug || product.type;

      if (!grouped[key]) {
        grouped[key] = {
          base_product: typeSlug,
          product_type_id: product.product_type_id,
          product_type_name: typeName,
          product_type_slug: typeSlug,
          name: product.name,
          type: product.type,
          variants: [],
        };
      }
      grouped[key].variants.push({
        id: product.id,
        color: product.color,
        image_url: product.image_url,
        price: parseFloat(product.price) || 0,
        product_type_id: product.product_type_id,
        type: product.type,
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pt.name as product_type_name, pt.slug as product_type_slug
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.id = $1
    `, [req.params.id]);
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
