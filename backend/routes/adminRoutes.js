const express = require('express');
const router = express.Router();
const upload = require('../uploadMiddleware');
const { queryAll, queryGet, queryRun } = require('../database');
const { sendMail } = require('../emailUtils');
const { formatProduct } = require('./productRoutes');
const { requireAdmin } = require('./authRoutes');

// Apply strict backend admin protection (ONLY aharsh1993@gmail.com)
router.use(requireAdmin);

function formatOrder(o, items, req) {
  const host = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:8000';
  
  let paymentScreenshotUrl = null;
  if (o.payment_screenshot) {
    if (o.payment_screenshot.startsWith('http://') || o.payment_screenshot.startsWith('https://')) {
      paymentScreenshotUrl = o.payment_screenshot;
    } else {
      const cleanPath = o.payment_screenshot.replace(/^\/?media\//, '').replace(/^\//, '');
      paymentScreenshotUrl = `${host}/media/${cleanPath}`;
    }
  }

  const itemList = items.map(i => {
    let stampImgUrl = null;
    if (i.stamp_image) {
      if (i.stamp_image.startsWith('http://') || i.stamp_image.startsWith('https://')) {
        stampImgUrl = i.stamp_image;
      } else {
        const cleanPath = i.stamp_image.replace(/^\/?media\//, '').replace(/^\//, '');
        stampImgUrl = `${host}/media/${cleanPath}`;
      }
    }

    return {
      id: i.id,
      product: i.product_id,
      product_name: i.product_name,
      product_image: i.product_image || null,
      price: String(i.price),
      quantity: i.quantity,
      shape: i.shape,
      color: i.color,
      stamp_text: i.stamp_text,
      stamp_image: i.stamp_image,
      stamp_image_url: stampImgUrl,
      stamp_type: i.stamp_type
    };
  });

  return {
    id: o.id,
    customer_name: o.customer_name,
    email: o.email,
    phone: o.phone,
    address: o.address,
    city: o.city,
    pincode: o.pincode,
    location_link: o.location_link,
    location_type: o.location_type,
    user_comment: o.user_comment,
    total_amount: String(o.total_amount),
    platform_charge: String(o.platform_charge),
    payment_method: o.payment_method,
    payment_screenshot: o.payment_screenshot,
    payment_screenshot_url: paymentScreenshotUrl,
    status: o.status,
    admin_comment: o.admin_comment,
    created_at: o.created_at,
    items: itemList
  };
}

// ADMIN USERS GET /api/admin-api/users/
router.get('/admin-api/users/', async (req, res) => {
  try {
    const users = await queryAll(
      'SELECT id, username, email, date_joined, last_login FROM auth_user ORDER BY date_joined DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ORDERS GET /api/admin-api/orders/
router.get('/admin-api/orders/', async (req, res) => {
  try {
    const statusParam = req.query.status;
    let sql = 'SELECT * FROM products_order';
    let params = [];

    if (statusParam) {
      sql += ' WHERE status = ?';
      params.push(statusParam);
      if (statusParam === 'pending') {
        sql += ' ORDER BY created_at ASC';
      } else {
        sql += ' ORDER BY created_at DESC';
      }
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const orders = await queryAll(sql, params);
    const orderData = [];

    for (const o of orders) {
      const items = await queryAll('SELECT * FROM products_orderitem WHERE order_id = ?', [o.id]);
      orderData.push(formatOrder(o, items, req));
    }

    res.json(orderData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ORDER DETAIL GET /api/admin-api/orders/:order_id/
router.get('/admin-api/orders/:order_id/', async (req, res) => {
  try {
    const o = await queryGet('SELECT * FROM products_order WHERE id = ?', [req.params.order_id]);
    if (!o) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await queryAll('SELECT * FROM products_orderitem WHERE order_id = ?', [o.id]);
    res.json(formatOrder(o, items, req));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN UPDATE ORDER STATUS PUT /api/admin-api/orders/:order_id/status/
router.put('/admin-api/orders/:order_id/status/', async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const order = await queryGet('SELECT * FROM products_order WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const newStatus = req.body.status;
    const adminComment = req.body.admin_comment || '';

    if (newStatus) {
      await queryRun('UPDATE products_order SET status = ? WHERE id = ?', [newStatus, orderId]);
    }
    if (adminComment) {
      await queryRun('UPDATE products_order SET admin_comment = ? WHERE id = ?', [adminComment, orderId]);
    }

    // Email notification to actual customer
    const formattedStatus = (newStatus || order.status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const adminMsgStr = adminComment ? `\n\nNote from Admin: ${adminComment}` : '';
    
    if (order.email) {
      sendMail({
        to: order.email,
        subject: `Order #${order.id} Status Update: ${formattedStatus} - Shree Sales`,
        text: `Dear ${order.customer_name || 'Customer'},\n\nThe status of your Order #${order.id} has been updated to: ${formattedStatus}.${adminMsgStr}\n\nTotal Amount: ₹${order.total_amount}\n\nThank you for choosing Shree Sales!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #06275c;">Order Status Update</h2>
            <p>Dear <b>${order.customer_name || 'Customer'}</b>,</p>
            <p>Your Order <b>#${order.id}</b> status has been updated to:</p>
            <div style="background: #e8f0fe; color: #1a237e; padding: 12px; border-radius: 6px; font-size: 1.2rem; font-weight: bold; text-align: center; margin: 15px 0;">
              ${formattedStatus}
            </div>
            ${adminComment ? `<p><b>Admin Note:</b> ${adminComment}</p>` : ''}
            <p>Total Amount: ₹${order.total_amount}</p>
            <p>Thank you for choosing Shree Sales!</p>
          </div>
        `
      }).catch(err => {
        console.error(`Order #${orderId} status change email failed:`, err.message);
      });
    }

    res.json({ message: `Order #${orderId} status updated to ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN SALES REPORT GET /api/admin-api/sales-report/
router.get('/admin-api/sales-report/', async (req, res) => {
  try {
    // 1. Overall Sales
    const totalOrdersRow = await queryGet('SELECT COUNT(*) as cnt FROM products_order WHERE status != "cancelled"');
    const totalQtyRow = await queryGet(
      'SELECT SUM(i.quantity) as qty FROM products_orderitem i JOIN products_order o ON i.order_id = o.id WHERE o.status != "cancelled"'
    );

    const totalOrders = totalOrdersRow ? totalOrdersRow.cnt : 0;
    const totalProductsSold = totalQtyRow && totalQtyRow.qty !== null ? parseInt(totalQtyRow.qty, 10) : 0;

    // 2. Fetch all valid orders with their items for detail drilldown
    const allOrders = await queryAll('SELECT * FROM products_order WHERE status != "cancelled" ORDER BY created_at DESC');
    for (const o of allOrders) {
      o.items = await queryAll('SELECT * FROM products_orderitem WHERE order_id = ?', [o.id]);
    }

    // 3. Weekly Sales (Day-wise breakdown for Mon to Sun)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyMap = {
      Monday: { day: 'Monday', orders: 0, revenue: 0, ordersList: [] },
      Tuesday: { day: 'Tuesday', orders: 0, revenue: 0, ordersList: [] },
      Wednesday: { day: 'Wednesday', orders: 0, revenue: 0, ordersList: [] },
      Thursday: { day: 'Thursday', orders: 0, revenue: 0, ordersList: [] },
      Friday: { day: 'Friday', orders: 0, revenue: 0, ordersList: [] },
      Saturday: { day: 'Saturday', orders: 0, revenue: 0, ordersList: [] },
      Sunday: { day: 'Sunday', orders: 0, revenue: 0, ordersList: [] }
    };

    allOrders.forEach(o => {
      const dt = new Date(o.created_at);
      if (!isNaN(dt.getTime())) {
        const dayName = daysOfWeek[dt.getDay()];
        if (weeklyMap[dayName]) {
          weeklyMap[dayName].orders += 1;
          weeklyMap[dayName].revenue += parseFloat(o.total_amount || 0);
          weeklyMap[dayName].ordersList.push(o);
        }
      }
    });

    const weeklyReport = [
      weeklyMap.Monday,
      weeklyMap.Tuesday,
      weeklyMap.Wednesday,
      weeklyMap.Thursday,
      weeklyMap.Friday,
      weeklyMap.Saturday,
      weeklyMap.Sunday
    ];

    // 4. Monthly Sales Breakdown
    const monthlyMap = {};
    allOrders.forEach(o => {
      const dt = new Date(o.created_at);
      if (!isNaN(dt.getTime())) {
        const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = dt.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { monthKey, label: monthLabel, orders: 0, revenue: 0, ordersList: [] };
        }
        monthlyMap[monthKey].orders += 1;
        monthlyMap[monthKey].revenue += parseFloat(o.total_amount || 0);
        monthlyMap[monthKey].ordersList.push(o);
      }
    });

    const monthlyReport = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // 5. Product Sales Report with detailed order references
    const productSalesReportRaw = await queryAll(`
      SELECT 
        i.product_name,
        i.product_id,
        SUM(i.quantity) as quantity_sold,
        SUM(i.price * i.quantity) as total_revenue
      FROM products_orderitem i
      JOIN products_order o ON i.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY i.product_name
      ORDER BY total_revenue DESC
    `);

    const productSalesReport = [];
    for (const p of productSalesReportRaw) {
      const relatedOrders = await queryAll(`
        SELECT 
          o.id as order_id,
          o.customer_name,
          o.email,
          o.phone,
          o.status,
          o.created_at,
          i.quantity,
          i.price,
          (i.quantity * i.price) as item_total
        FROM products_orderitem i
        JOIN products_order o ON i.order_id = o.id
        WHERE i.product_name = ? AND o.status != 'cancelled'
        ORDER BY o.created_at DESC
      `, [p.product_name]);

      productSalesReport.push({
        product_name: p.product_name,
        product_id: p.product_id,
        quantity_sold: p.quantity_sold,
        total_revenue: p.total_revenue,
        ordersList: relatedOrders
      });
    }

    return res.json({
      overall: {
        totalOrders,
        totalProductsSold
      },
      weekly: weeklyReport,
      monthly: monthlyReport,
      products: productSalesReport
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ADMIN PRODUCTS GET / POST / PUT / DELETE /api/admin-api/products/:product_id?
router.route('/admin-api/products/:product_id?')
  .get(async (req, res) => {
    try {
      const products = await queryAll('SELECT p.*, c.name AS category_name FROM products_product p LEFT JOIN products_category c ON p.category_id = c.id ORDER BY p.id DESC');
      const formatted = products.map(p => formatProduct(p, req));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  .post(upload.single('image'), async (req, res) => {
    try {
      const body = req.body || {};
      const imagePath = req.file ? `products/${req.file.filename}` : (body.image || '');

      const result = await queryRun(
        `INSERT INTO products_product (name, price, description, image, category_id, is_best_seller, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          body.name || '',
          parseFloat(body.price || 0),
          body.description || '',
          imagePath,
          parseInt(body.category || body.category_id || 1, 10),
          body.is_best_seller === 'true' || body.is_best_seller === true || body.is_best_seller === 1 ? 1 : 0,
          parseInt(body.stock || 0, 10)
        ]
      );

      const newProduct = await queryGet('SELECT * FROM products_product WHERE id = ?', [result.lastID]);
      res.status(201).json(formatProduct(newProduct, req));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  })
  .put(upload.single('image'), async (req, res) => {
    try {
      const productId = req.params.product_id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID required' });
      }

      const existing = await queryGet('SELECT * FROM products_product WHERE id = ?', [productId]);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }

      const body = req.body || {};
      const name = body.name !== undefined ? body.name : existing.name;
      const price = body.price !== undefined ? parseFloat(body.price) : existing.price;
      const description = body.description !== undefined ? body.description : existing.description;
      const categoryId = (body.category !== undefined || body.category_id !== undefined)
        ? parseInt(body.category || body.category_id, 10)
        : existing.category_id;
      const isBestSeller = body.is_best_seller !== undefined
        ? (body.is_best_seller === 'true' || body.is_best_seller === true || body.is_best_seller === 1 ? 1 : 0)
        : existing.is_best_seller;
      const stock = body.stock !== undefined ? parseInt(body.stock, 10) : existing.stock;
      const imagePath = req.file ? `products/${req.file.filename}` : existing.image;

      await queryRun(
        `UPDATE products_product
         SET name = ?, price = ?, description = ?, image = ?, category_id = ?, is_best_seller = ?, stock = ?
         WHERE id = ?`,
        [name, price, description, imagePath, categoryId, isBestSeller, stock, productId]
      );

      const updated = await queryGet('SELECT * FROM products_product WHERE id = ?', [productId]);
      res.json(formatProduct(updated, req));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  })
  .delete(async (req, res) => {
    try {
      const productId = req.params.product_id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID required' });
      }

      const existing = await queryGet('SELECT * FROM products_product WHERE id = ?', [productId]);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }

      await queryRun('DELETE FROM products_product WHERE id = ?', [productId]);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ADMIN FEEDBACK GET /api/admin-api/feedback/
router.get('/admin-api/feedback/', async (req, res) => {
  try {
    const feedbacks = await queryAll('SELECT * FROM products_feedback ORDER BY created_at DESC');
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
});

// ADMIN CATEGORIES GET /api/admin-api/categories/
router.get('/admin-api/categories/', async (req, res) => {
  try {
    const categories = await queryAll('SELECT id, name FROM products_category ORDER BY id ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
