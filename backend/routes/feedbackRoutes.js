const express = require('express');
const router = express.Router();
const { queryAll, queryGet, queryRun } = require('../database');

// GET & POST /api/feedback/
router.route('/feedback/')
  .get(async (req, res) => {
    try {
      const feedbacks = await queryAll(
        'SELECT * FROM products_feedback WHERE stars > 3 AND user_id IS NOT NULL ORDER BY created_at DESC LIMIT 20'
      );
      const formatted = feedbacks.map(f => ({
        id: f.id,
        username: f.username || 'Anonymous',
        stars: f.stars,
        message: f.message || '',
        created_at: f.created_at,
        user: f.user_id,
        product: f.product_id
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  .post(async (req, res) => {
    try {
      const username = req.body.username || 'Anonymous';
      const stars = parseInt(req.body.stars || 5, 10);
      const message = req.body.message || '';
      const productId = req.body.product_id || null;

      let user = null;
      if (username) {
        user = await queryGet('SELECT * FROM auth_user WHERE username = ?', [username]);
      }

      let product = null;
      if (productId) {
        product = await queryGet('SELECT * FROM products_product WHERE id = ?', [productId]);
      }

      const createdAt = new Date().toISOString();
      await queryRun(
        'INSERT INTO products_feedback (user_id, product_id, username, stars, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [user ? user.id : null, product ? product.id : null, username, stars, message, createdAt]
      );

      res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
