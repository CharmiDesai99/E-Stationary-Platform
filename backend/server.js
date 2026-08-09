const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration matching Django session behavior
app.use(session({
  secret: 'shree-sales-node-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Serve media files at /media
const mediaPath = path.join(__dirname, 'media');
app.use('/media', express.static(mediaPath));

// API Health Check GET /api/
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shree Sales API is running'
  });
});
app.get('/api/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shree Sales API is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes.router);
app.use('/api', orderRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', utilityRoutes);
app.use('/api', adminRoutes);

// Health Check Root /
app.get('/', (req, res) => {
  res.send('Shree Sales Node.js + Express API Server is Running');
});

// Start Server on Port 8000
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Shree Sales Express Backend Running on Port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}/api/`);
  console.log(`=================================================`);
});
