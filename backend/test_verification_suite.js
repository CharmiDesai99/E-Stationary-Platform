const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const axios = require('axios');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { queryGet, queryAll, queryRun } = require('./database');
const { getSmtpStatus, transporter } = require('./emailUtils');

async function runSuite() {
  console.log('===========================================================');
  console.log('  SHREE SALES SYSTEM FULL VERIFICATION SUITE');
  console.log('===========================================================\n');

  // 1. Initialize Express test server on port 8009
  const app = express();
  const PORT = 8009;

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));

  app.use('/media', express.static(path.join(__dirname, 'media')));
  app.get('/api', (req, res) => res.json({ status: 'ok', message: 'Shree Sales API is running' }));
  app.get('/api/', (req, res) => res.json({ status: 'ok', message: 'Shree Sales API is running' }));

  app.use('/api/auth', authRoutes);
  app.use('/api', productRoutes.router);
  app.use('/api', orderRoutes);
  app.use('/api', feedbackRoutes);
  app.use('/api', utilityRoutes);
  app.use('/api', adminRoutes);

  const server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on http://localhost:${PORT}`);

  const agent = new http.Agent({ keepAlive: true });
  const client = axios.create({
    baseURL: `http://localhost:${PORT}/api/`,
    withCredentials: true,
    httpAgent: agent
  });

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`${pass ? '✅ PASS' : '❌ FAIL/BLOCKED'} - ${name}: ${details}`);
  }

  try {
    // TEST 1: Health Check GET /api/
    const healthRes = await client.get('/');
    record('API Health Check', healthRes.status === 200, `Status: ${healthRes.status}, Message: ${healthRes.data.message}`);

    // TEST 2: Stats API GET /api/stats/
    const statsRes = await client.get('stats/');
    const sData = statsRes.data;
    const statsValid = sData.happyCustomers !== undefined && sData.productsAvailable !== undefined && sData.satisfaction !== undefined && sData.yearsInBusiness !== undefined;
    record('Dynamic Store Stats API (/api/stats/)', statsValid, `Happy Customers: ${sData.happyCustomers}, Products: ${sData.productsAvailable}, Satisfaction: ${sData.satisfaction}%, Years in Business: ${sData.yearsInBusiness}`);

    // TEST 3: Admin Sales Report GET /api/admin-api/sales-report/
    const salesRes = await client.get('admin-api/sales-report/');
    const sr = salesRes.data;
    const salesValid = sr.overall && sr.weekly && sr.monthly && sr.products;
    record('Sales Analytics & Reports API (/api/admin-api/sales-report/)', salesValid, `Total Orders: ${sr.overall?.totalOrders}, Total Revenue: ₹${sr.overall?.totalRevenue}, Products Sold: ${sr.overall?.totalProductsSold}, Weekly breakdown entries: ${sr.weekly?.length}, Products breakdown entries: ${sr.products?.length}`);

    // TEST 4: Profile Unauthenticated GET /api/auth/profile/
    try {
      await client.get('auth/profile/');
      record('Unauthenticated Profile API', false, 'Expected 401 but got 200');
    } catch (err) {
      record('Unauthenticated Profile API', err.response?.status === 401, `Returned expected status 401: ${err.response?.data?.error}`);
    }

    // TEST 5: Admin Login
    const loginRes = await client.post('auth/login/', {
      username: 'testadmin2',
      password: 'TestPassword123'
    });
    const cookieHeader = loginRes.headers['set-cookie'];
    const authHeaders = { headers: { Cookie: cookieHeader } };
    record('Admin Login API (/api/auth/login/)', loginRes.status === 200, `Logged in user: ${loginRes.data.username}, is_admin: ${loginRes.data.is_admin}`);

    // TEST 6: Profile Authenticated GET /api/auth/profile/
    const profileRes = await client.get('auth/profile/', authHeaders);
    record('Authenticated Profile API (/api/auth/profile/)', profileRes.status === 200, `Profile user: ${profileRes.data.username}, Orders count: ${profileRes.data.orders?.length}`);

    // TEST 7: Forgot Password API (/api/auth/forgot-password/)
    const forgotRes = await client.post('auth/forgot-password/', { email: 'aharsh1993@gmail.com' });
    const resetTokenRecord = await queryGet('SELECT * FROM auth_passwordresettoken ORDER BY id DESC LIMIT 1');
    const tokenCreated = resetTokenRecord && resetTokenRecord.used === 0;
    record('Forgot Password API (/api/auth/forgot-password/)', tokenCreated, `Token generated in DB: ${resetTokenRecord?.token?.substring(0, 10)}..., Expiration: ${resetTokenRecord?.expires_at}`);

    // TEST 8: Reset Password API (/api/auth/reset-password/)
    if (resetTokenRecord) {
      const resetRes = await client.post('auth/reset-password/', {
        token: resetTokenRecord.token,
        new_password: 'TestPassword123'
      });
      const updatedToken = await queryGet('SELECT * FROM auth_passwordresettoken WHERE id = ?', [resetTokenRecord.id]);
      record('Reset Password API (/api/auth/reset-password/)', resetRes.status === 200 && updatedToken.used === 1, `Reset response: ${resetRes.data.message}, Token marked used: ${updatedToken.used === 1}`);
    }

    // TEST 9: Image Serving Check
    const prodList = await client.get('products/all/');
    let sampleImgUrl = prodList.data[0]?.image_url;
    if (sampleImgUrl) {
      const imgRes = await axios.get(sampleImgUrl.replace('http://localhost:8000', `http://localhost:${PORT}`));
      record('Media Static Image Serving (/media/products/...)', imgRes.status === 200, `Successfully fetched sample product image, HTTP ${imgRes.status}, Content-Type: ${imgRes.headers['content-type']}`);
    } else {
      record('Media Static Image Serving', false, 'No product image found');
    }

    // TEST 10: Create Order API (/api/create-order/)
    const orderRes = await client.post('create-order/', {
      username: 'testadmin2',
      customer_name: 'Test Admin User',
      email: 'aharsh1993@gmail.com',
      phone: '9876543210',
      address: '123 Station Road',
      city: 'Ahmedabad',
      pincode: '380001',
      payment_method: 'cod',
      total_amount: 500,
      items: JSON.stringify([{ product: 5, product_name: '100 gsm JK shedar A4', price: 500, quantity: 1 }])
    }, authHeaders);
    record('Order Placement API (/api/create-order/)', orderRes.status === 201, `Order Created ID: ${orderRes.data.order_id}`);

    // TEST 11: Admin Order Status Update API (/api/admin-api/orders/:id/status/)
    if (orderRes.data.order_id) {
      const statusRes = await client.put(`admin-api/orders/${orderRes.data.order_id}/status/`, {
        status: 'out_for_delivery',
        admin_comment: 'Order packed and out for delivery!'
      }, authHeaders);
      const updatedOrder = await queryGet('SELECT * FROM products_order WHERE id = ?', [orderRes.data.order_id]);
      record('Admin Order Status Update API', statusRes.status === 200 && updatedOrder.status === 'out_for_delivery', `Updated Order #${orderRes.data.order_id} status to: ${updatedOrder.status}`);
    }

    // TEST 12: Gmail SMTP Verification Test
    await new Promise(resolve => {
      transporter.verify((err, success) => {
        if (err) {
          record('Gmail SMTP Dispatch Capability', false, `SMTP Auth/Connect Failed: ${err.message} (Mail dispatch will log errors without crashing transactions)`);
        } else {
          record('Gmail SMTP Dispatch Capability', true, 'SMTP credentials valid and ready');
        }
        resolve();
      });
    });

  } catch (err) {
    console.error('Fatal Verification Suite Error:', err.response?.data || err.message);
  } finally {
    server.close();
    console.log('\n===========================================================');
    console.log('  VERIFICATION SUITE COMPLETE');
    console.log('===========================================================');
  }
}

runSuite();
