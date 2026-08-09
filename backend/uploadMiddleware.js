const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mediaDir = path.join(__dirname, 'media');

// Ensure directories exist
const productsDir = path.join(mediaDir, 'products');
const paymentDir = path.join(mediaDir, 'payment_screenshots');
const stampDir = path.join(mediaDir, 'stamp_designs');

[productsDir, paymentDir, stampDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'payment_screenshot') {
      cb(null, paymentDir);
    } else if (file.fieldname === 'stamp_image') {
      cb(null, stampDir);
    } else {
      cb(null, productsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = upload;
