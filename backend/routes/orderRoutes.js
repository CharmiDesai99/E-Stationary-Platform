const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const upload = require('../uploadMiddleware');
const { queryGet, queryAll, queryRun } = require('../database');
const { sendMail } = require('../emailUtils');

const RAZORPAY_KEY_ID = 'rzp_test_Sk13qww3WmtggP';
const RAZORPAY_KEY_SECRET = 'N6V6eQvOkGCBvqfT5EET9V9d';

const razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

async function sendOrderConfirmationEmail(orderId) {
  try {
    const order = await queryGet('SELECT * FROM products_order WHERE id = ?', [orderId]);
    if (!order) {
      console.error(`Order confirmation email skipped: Order #${orderId} not found in DB.`);
      return;
    }

    const items = await queryAll('SELECT product_name, price, quantity FROM products_orderitem WHERE order_id = ?', [orderId]);
    const itemsSummary = items.map(i => `- ${i.product_name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join('\n');

    // Customer email notification
    if (order.email) {
      sendMail({
        to: order.email,
        subject: `Order #${order.id} Confirmed - Shree Sales E-Stationery`,
        text: `Dear ${order.customer_name || 'Customer'},\n\nThank you for your order! Your Order #${order.id} has been placed successfully.\n\nOrder Summary:\n${itemsSummary}\n\nTotal Amount: ₹${order.total_amount}\nPayment Method: ${order.payment_method?.toUpperCase()}\nDelivery Address: ${order.address}, ${order.city} - ${order.pincode}\n\nWe will update you when your order is shipped.\n\nBest regards,\nShree Sales Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #06275c; margin-top: 0;">Order Confirmed! 🎉</h2>
            <p>Dear <b>${order.customer_name || 'Customer'}</b>,</p>
            <p>Thank you for shopping with Shree Sales E-Stationery Platform! Your order <b>#${order.id}</b> has been received and is being processed.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #1a237e;">Order Summary</h3>
              <ul style="padding-left: 20px;">
                ${items.map(i => `<li>${i.product_name} × ${i.quantity} — <b>₹${i.price * i.quantity}</b></li>`).join('')}
              </ul>
              <hr style="border: 0; border-top: 1px solid #ddd;" />
              <p style="font-size: 1.1rem;"><b>Total Amount:</b> ₹${order.total_amount}</p>
              <p><b>Payment Method:</b> ${order.payment_method?.toUpperCase()}</p>
              <p><b>Shipping Address:</b> ${order.address}, ${order.city} - ${order.pincode}</p>
            </div>
            <p>Thank you for choosing Shree Sales!</p>
          </div>
        `
      }).catch(err => {
        console.error(`Order #${orderId} customer email notification failed:`, err.message);
      });
    } else {
      console.warn(`Order #${orderId} has no customer email address associated.`);
    }

    // Admin email notification
    sendMail({
      to: 'bhutpalak4@gmail.com',
      subject: `🚨 NEW ORDER #${order.id} Placed - Shree Sales`,
      text: `New order #${order.id} placed by ${order.customer_name} (${order.email}, Phone: ${order.phone}). Total: ₹${order.total_amount}.`
    }).catch(err => {
      console.error(`Order #${orderId} admin notification email failed:`, err.message);
    });
  } catch (err) {
    console.error('Order confirmation email handler error:', err.message);
  }
}

// CREATE ORDER POST /api/create-order/
router.post('/create-order/', upload.single('payment_screenshot'), async (req, res) => {
  try {
    const body = req.body || {};
    const username = body.username || body.customer_name;

    let user = null;
    if (username) {
      user = await queryGet('SELECT * FROM auth_user WHERE username = ?', [username]);
    }

    let itemsData = [];
    const itemsRaw = body.items || '[]';
    if (typeof itemsRaw === 'string') {
      try {
        itemsData = JSON.parse(itemsRaw);
      } catch (e) {
        itemsData = [];
      }
    } else if (Array.isArray(itemsRaw)) {
      itemsData = itemsRaw;
    }

    const paymentMethod = body.payment_method || 'cod';
    const totalAmount = parseFloat(body.total_amount || 0);
    const platformCharge = parseFloat(body.platform_charge || 0);

    // Validate stock
    for (const item of itemsData) {
      const pId = item.product;
      const qty = parseInt(item.quantity || 1, 10);
      if (pId) {
        const prod = await queryGet('SELECT * FROM products_product WHERE id = ?', [pId]);
        if (prod && prod.stock < qty) {
          return res.status(400).json({ error: `Not enough stock for ${prod.name}. Available: ${prod.stock}` });
        }
      }
    }

    const paymentScreenshot = req.file ? `payment_screenshots/${req.file.filename}` : null;
    const createdAt = new Date().toISOString();

    // Insert Order
    const orderResult = await queryRun(
      `INSERT INTO products_order (
        user_id, customer_name, email, phone, address, city, pincode,
        location_link, user_comment, location_type, total_amount, platform_charge,
        payment_method, payment_screenshot, status, admin_comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?)`,
      [
        user ? user.id : null,
        body.customer_name || '',
        body.email || '',
        body.phone || '',
        body.address || '',
        body.city || '',
        body.pincode || '',
        body.location_link || '',
        body.user_comment || '',
        body.location_type || 'House',
        totalAmount,
        platformCharge,
        paymentMethod,
        paymentScreenshot,
        createdAt
      ]
    );

    const orderId = orderResult.lastID;

    // Sync user profile if user exists
    if (user) {
      let profile = await queryGet('SELECT * FROM accounts_customerprofile WHERE user_id = ?', [user.id]);
      const fullName = (profile && profile.full_name) ? profile.full_name : (body.customer_name || '');
      const addr = (profile && profile.address) ? profile.address : (body.address || '');
      const pin = (profile && profile.pincode) ? profile.pincode : (body.pincode || '');
      const mob = (profile && profile.mobile) ? profile.mobile : (body.phone || '');

      if (!profile) {
        await queryRun(
          'INSERT INTO accounts_customerprofile (user_id, full_name, address, pincode, mobile) VALUES (?, ?, ?, ?, ?)',
          [user.id, fullName, addr, pin, mob]
        );
      } else {
        await queryRun(
          'UPDATE accounts_customerprofile SET full_name = ?, address = ?, pincode = ?, mobile = ? WHERE user_id = ?',
          [fullName, addr, pin, mob, user.id]
        );
      }
    }

    // Insert Order Items & Update Stock
    for (const item of itemsData) {
      const productId = item.product || null;
      let productName = item.product_name || '';

      if (productId) {
        const prod = await queryGet('SELECT * FROM products_product WHERE id = ?', [productId]);
        if (prod) {
          if (!productName) productName = prod.name;
          const newStock = Math.max(0, prod.stock - parseInt(item.quantity || 1, 10));
          await queryRun('UPDATE products_product SET stock = ? WHERE id = ?', [newStock, productId]);
        }
      }

      await queryRun(
        `INSERT INTO products_orderitem (
          order_id, product_id, product_name, price, quantity, shape, color, stamp_text, stamp_image, stamp_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          productId,
          productName,
          parseFloat(item.price || 0),
          parseInt(item.quantity || 1, 10),
          item.shape || '',
          item.color || '',
          item.stamp_text || '',
          item.stamp_image || null,
          item.stamp_type || ''
        ]
      );
    }

    // Handle Razorpay Online Payment
    if (paymentMethod === 'online') {
      try {
        const razorpayOrder = await razorpayClient.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          receipt: `order_${orderId}`,
          payment_capture: 1
        });

        return res.status(201).json({
          message: 'Order placed successfully, proceed to payment',
          order_id: orderId,
          razorpay_order_id: razorpayOrder.id,
          razorpay_amount: Math.round(totalAmount * 100),
          razorpay_key: RAZORPAY_KEY_ID,
          currency: 'INR'
        });
      } catch (err) {
        await queryRun('DELETE FROM products_order WHERE id = ?', [orderId]);
        await queryRun('DELETE FROM products_orderitem WHERE order_id = ?', [orderId]);
        return res.status(400).json({ error: 'Failed to create Razorpay order: ' + err.message });
      }
    }

    // COD or Screenshot Payment
    sendOrderConfirmationEmail(orderId);

    return res.status(201).json({
      message: 'Order placed successfully',
      order_id: orderId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// VERIFY PAYMENT POST /api/verify-payment/
router.post('/verify-payment/', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id } = req.body;

    const order = await queryGet('SELECT * FROM products_order WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: Invalid Signature' });
    }

    const existingComment = order.admin_comment ? order.admin_comment + '\n' : '';
    const newComment = existingComment + `Razorpay Payment ID: ${razorpay_payment_id}`;
    await queryRun('UPDATE products_order SET admin_comment = ? WHERE id = ?', [newComment, order_id]);

    sendOrderConfirmationEmail(order_id);

    return res.json({ message: 'Payment verified successfully' });
  } catch (err) {
    return res.status(400).json({ error: 'Payment verification failed: ' + err.message });
  }
});

// USER ORDERS GET /api/user-orders/
router.get('/user-orders/', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const user = await queryGet('SELECT * FROM auth_user WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orders = await queryAll('SELECT * FROM products_order WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
    const orderData = [];

    for (const o of orders) {
      const items = await queryAll('SELECT * FROM products_orderitem WHERE order_id = ?', [o.id]);
      const itemList = items.map(i => ({
        id: i.id,
        product: i.product_id,
        product_name: i.product_name,
        price: String(i.price),
        quantity: i.quantity,
        shape: i.shape,
        color: i.color,
        stamp_text: i.stamp_text,
        stamp_image: i.stamp_image,
        stamp_type: i.stamp_type
      }));

      orderData.push({
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
        status: o.status,
        admin_comment: o.admin_comment,
        created_at: o.created_at,
        items: itemList
      });
    }

    return res.json(orderData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
