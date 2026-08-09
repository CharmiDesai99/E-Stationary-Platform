const express = require('express');
const router = express.Router();
const { queryGet, queryRun } = require('../database');

// GET /api/visitors/
router.get('/visitors/', async (req, res) => {
  try {
    let visitor = await queryGet('SELECT * FROM products_visitor WHERE id = 1');
    if (!visitor) {
      await queryRun('INSERT INTO products_visitor (id, count) VALUES (1, 0)');
      visitor = { id: 1, count: 0 };
    }

    if (!req.session || !req.session.has_visited) {
      const newCount = visitor.count + 1;
      await queryRun('UPDATE products_visitor SET count = ? WHERE id = 1', [newCount]);
      visitor.count = newCount;
      if (req.session) {
        req.session.has_visited = true;
      }
    }

    res.json({ visitors: visitor.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/
router.get('/stats/', async (req, res) => {
  try {
    // Unique customer count (excluding admins/staff) from users and orders
    const happyCustRow = await queryGet(`
      SELECT COUNT(DISTINCT email) as cnt 
      FROM (
        SELECT email FROM auth_user WHERE is_staff = 0 AND is_superuser = 0 AND email != 'aharsh1993@gmail.com' AND email IS NOT NULL AND email != ''
        UNION
        SELECT email FROM products_order WHERE email != 'aharsh1993@gmail.com' AND email IS NOT NULL AND email != ''
      )
    `);
    const productCountRow = await queryGet('SELECT COUNT(*) as cnt FROM products_product');
    const avgStarsRow = await queryGet('SELECT AVG(stars) as avg_stars FROM products_feedback');

    const rawCustomerCount = happyCustRow ? happyCustRow.cnt : 0;
    // Base 1000 + actual customer count
    const happyCustomers = 1000 + rawCustomerCount;
    const productsAvailable = productCountRow ? productCountRow.cnt : 0;
    
    let satisfaction = 95; // Default if no reviews
    if (avgStarsRow && avgStarsRow.avg_stars !== null && avgStarsRow.avg_stars !== undefined) {
      const avg = parseFloat(avgStarsRow.avg_stars);
      satisfaction = Math.round((avg / 5) * 100);
    }

    // Dynamic years in business calculated from configured business start year (2021)
    const BUSINESS_START_YEAR = 2021;
    const currentYear = new Date().getFullYear();
    const yearsInBusiness = Math.max(1, currentYear - BUSINESS_START_YEAR);

    res.json({
      happyCustomers,
      happy_customers: happyCustomers,
      productsAvailable,
      products_available: productsAvailable,
      satisfaction,
      customer_satisfaction: satisfaction,
      yearsInBusiness,
      years: yearsInBusiness
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
