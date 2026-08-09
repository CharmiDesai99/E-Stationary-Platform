const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
  console.log('=== TESTING NEW PRODUCT IMAGE UPLOAD ===');

  // Create a 1x1 PNG buffer
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const tempFilePath = path.join(__dirname, 'temp_test_pen.png');
  fs.writeFileSync(tempFilePath, samplePng);

  try {
    const form = new FormData();
    form.append('name', 'Test Gel Pen Gold Edition');
    form.append('price', '99.00');
    form.append('description', 'Smooth writing gel pen with gold clip');
    form.append('category', '1');
    form.append('is_best_seller', 'true');
    form.append('stock', '150');
    form.append('image', fs.createReadStream(tempFilePath));

    const response = await axios.post('http://localhost:8000/api/admin-api/products/', form, {
      headers: form.getHeaders()
    });

    console.log('API Response Status:', response.status);
    console.log('Created Product ID:', response.data.id);
    console.log('Returned image path:', response.data.image);
    console.log('Returned image_url:', response.data.image_url);

    // Verify direct HTTP accessibility of returned image_url
    const imgCheck = await axios.get(response.data.image_url);
    console.log('Image direct HTTP access status:', imgCheck.status, '(Content-Type:', imgCheck.headers['content-type'], ')');

    if (imgCheck.status === 200) {
      console.log('✅ NEW PRODUCT IMAGE UPLOAD & DISPLAY VERIFIED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('❌ Upload Test Failed:', err.response ? err.response.data : err.message);
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

testUpload();
