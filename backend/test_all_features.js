const http = require('http');
const { getSmtpStatus } = require('./emailUtils');

function makeRequest(path, method = 'GET', postData = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, setCookie });
        } catch (e) {
          resolve({ status: res.statusCode, data, setCookie });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('       SHREE SALES API VERIFICATION TEST');
  console.log('==================================================\n');

  try {
    // 1. Health Check
    const health = await makeRequest('/api/');
    console.log('[1] GET /api/ Health Check:', health.status === 200 ? 'PASS ✅' : 'FAIL ❌', health.data);

    // 2. Dynamic Stats
    const stats = await makeRequest('/api/stats/');
    console.log('[2] GET /api/stats/ Real Database Stats:', stats.status === 200 ? 'PASS ✅' : 'FAIL ❌', stats.data);

    // 3. Products All & Category
    const productsAll = await makeRequest('/api/products/all/');
    console.log('[3] GET /api/products/all/:', productsAll.status === 200 ? `PASS ✅ (${productsAll.data.length} products found)` : 'FAIL ❌');

    // 4. Best Sellers
    const bestSellers = await makeRequest('/api/best-sellers/');
    console.log('[4] GET /api/best-sellers/:', bestSellers.status === 200 ? `PASS ✅ (${bestSellers.data.length} items)` : 'FAIL ❌');

    // 5. Admin Sales Report
    const salesReport = await makeRequest('/api/admin-api/sales-report/');
    console.log('[5] GET /api/admin-api/sales-report/:', salesReport.status === 200 ? 'PASS ✅' : 'FAIL ❌');
    if (salesReport.status === 200) {
      console.log('    - Overall Revenue:', salesReport.data.overall?.totalRevenue);
      console.log('    - Overall Orders:', salesReport.data.overall?.totalOrders);
      console.log('    - Weekly Days Count:', salesReport.data.weekly?.length);
      console.log('    - Product Sales Count:', salesReport.data.products?.length);
    }

    // 6. Test Login & Session Auth Flow
    const loginRes = await makeRequest('/api/auth/login/', 'POST', { username: 'PalakBhut', password: 'password123' });
    console.log('[6] POST /api/auth/login/ (PalakBhut):', loginRes.status === 200 ? 'PASS ✅' : `STATUS ${loginRes.status}`, loginRes.data);

    let sessionCookie = null;
    if (loginRes.setCookie) {
      sessionCookie = loginRes.setCookie[0];
      const profileRes = await makeRequest('/api/auth/profile/', 'GET', null, sessionCookie);
      console.log('[7] GET /api/auth/profile/ with active session:', profileRes.status === 200 ? 'PASS ✅' : 'FAIL ❌', profileRes.data.username);
    }

    // Unauthenticated profile check
    const unauthProfile = await makeRequest('/api/auth/profile/');
    console.log('[8] GET /api/auth/profile/ unauthenticated check (Expect 401):', unauthProfile.status === 401 ? 'PASS ✅' : 'FAIL ❌', unauthProfile.status);

    // 7. Nodemailer SMTP Status
    const smtp = getSmtpStatus();
    console.log('[9] Nodemailer Gmail SMTP Status:', smtp.verified ? 'PASS ✅' : 'FAIL/BLOCKED ❌', smtp.message);

    console.log('\n==================================================');
    console.log('        TEST COMPLETED SUCCESSFULLY');
    console.log('==================================================');

  } catch (err) {
    console.error('Test script error:', err.message);
  }
}

runTests();
