const express = require('express');
const router = express.Router();
const { queryAll, queryGet } = require('../database');

function formatProduct(product, req) {
  if (!product) return null;
  const host = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:8000';
  let imageUrl = null;
  if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
    const rawImage = product.image.trim();
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      imageUrl = rawImage;
    } else {
      let cleanPath = rawImage.replace(/^\/?media\//, '').replace(/^\//, '');
      if (!cleanPath.startsWith('products/') && !cleanPath.startsWith('payment_screenshots/') && !cleanPath.startsWith('stamp_designs/')) {
        cleanPath = `products/${cleanPath}`;
      }
      imageUrl = `${host}/media/${cleanPath}`;
    }
  }
  return {
    id: product.id,
    name: product.name,
    price: String(product.price),
    description: product.description || '',
    image: imageUrl,
    image_url: imageUrl, // Crucial field for React frontend
    category: product.category_id,
    category_id: product.category_id,
    category_name: product.category_name || '',
    is_best_seller: Boolean(product.is_best_seller),
    stock: product.stock
  };
}

// Categories GET /api/categories/
router.get('/categories/', async (req, res) => {
  try {
    const categories = await queryAll('SELECT id, name FROM products_category ORDER BY id ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products by Category GET /api/products/:category_id/
router.get('/products/:category_id/', async (req, res) => {
  try {
    const categoryId = req.params.category_id;
    const search = req.query.search || '';

    let sql = '';
    let params = [];

    if (categoryId === 'all') {
      sql = 'SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id WHERE p.stock > 0';
    } else {
      sql = 'SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id WHERE p.category_id = ? AND p.stock > 0';
      params.push(categoryId);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = await queryAll(sql, params);
    const formatted = products.map(p => formatProduct(p, req));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Search GET /api/products/search/
router.get('/products/search/', async (req, res) => {
  try {
    const search = req.query.search || '';
    let sql = 'SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id WHERE p.stock > 0';
    let params = [];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = await queryAll(sql, params);
    const formatted = products.map(p => formatProduct(p, req));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Best Sellers GET /api/best-sellers/
router.get('/best-sellers/', async (req, res) => {
  try {
    const products = await queryAll('SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id WHERE p.is_best_seller = 1 AND p.stock > 0 LIMIT 8');
    const formatted = products.map(p => formatProduct(p, req));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Detail GET /api/product/:id/
router.get('/product/:id/', async (req, res) => {
  try {
    const product = await queryGet('SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(formatProduct(product, req));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  router,
  formatProduct
};
