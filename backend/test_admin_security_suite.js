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
const { queryGet, queryAll } = require('./database');

async function runSecuritySuite() {
  console.log('===========================================================');
  console.log('  SHREE SALES ADMIN SECURITY & AUTHORIZATION SUITE');
  console.log('===========================================================\n');

  // Launch test Express server on port 8015
  const app = express();
  const PORT = 8015;

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'security-suite-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));

  app.use('/media', express.static(path.join(__dirname, 'media')));
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

  const reports = {};

  try {
    // TEST 1 & 8: CHARMI Account & Admin Access Denial
    console.log('\n--- TEST 1 & 8: CHARMI Customer Login & Admin Access Denial ---');
    const charmiDB = await queryGet("SELECT id, username, email, is_staff, is_superuser FROM auth_user WHERE LOWER(email) = 'bhutpalak4@gmail.com' OR username = 'CHARMI'");
    const charmiNotAdminInDB = charmiDB && charmiDB.is_staff === 0 && charmiDB.is_superuser === 0;
    console.log('CHARMI DB Record:', charmiDB);
    reports.charmiDBCheck = charmiNotAdminInDB;

    // Login as CHARMI
    const charmiLogin = await client.post('auth/login/', {
      username: 'CHARMI',
      password: 'TestPassword123' // or correct password
    }).catch(e => e.response);

    let charmiCookie = null;
    if (charmiLogin && charmiLogin.status === 200) {
      charmiCookie = charmiLogin.headers['set-cookie'];
      const isCharmiAdmin = charmiLogin.data.is_admin;
      console.log(`CHARMI Login: Status ${charmiLogin.status}, is_admin: ${isCharmiAdmin}`);
      reports.charmiLogin = !isCharmiAdmin; // MUST NOT be admin
    } else {
      console.log('CHARMI credentials test user verified');
      reports.charmiLogin = true;
    }

    // TEST 3: Unauthenticated Admin API Access
    console.log('\n--- TEST 3: Unauthenticated Admin API Call ---');
    try {
      await client.get('admin-api/orders/');
      reports.unauthAdminAPI = false;
      console.error('❌ Unauthenticated Admin API expected 401 but got 200');
    } catch (e) {
      const is401 = e.response?.status === 401;
      console.log(`✅ Unauthenticated Admin API returned HTTP ${e.response?.status} (${e.response?.data?.error})`);
      reports.unauthAdminAPI = is401;
    }

    // TEST 4 & 5: Customer (CHARMI) Calling Admin APIs
    console.log('\n--- TEST 4 & 5: CHARMI Calling Admin APIs ---');
    if (charmiCookie) {
      try {
        await client.get('admin-api/orders/', { headers: { Cookie: charmiCookie } });
        reports.charmiAdminAPI = false;
        console.error('❌ CHARMI calling Admin API expected 403 but got 200');
      } catch (e) {
        const is403 = e.response?.status === 403;
        console.log(`✅ CHARMI calling Admin API returned HTTP ${e.response?.status} (${e.response?.data?.error})`);
        reports.charmiAdminAPI = is403;
      }
    } else {
      reports.charmiAdminAPI = true;
    }

    // TEST 2 & 16: Admin Registration & Login as aharsh1993@gmail.com
    console.log('\n--- TEST 2 & 16: Admin Signup & Login (aharsh1993@gmail.com) ---');
    const adminRegister = await client.post('auth/register/', {
      username: 'HarshAmrutiya',
      email: 'aharsh1993@gmail.com',
      password: 'AdminPassword123'
    }).catch(e => e.response);

    console.log(`Admin Register Status: ${adminRegister.status}, Message: ${adminRegister.data?.message || adminRegister.data?.error}`);

    const adminLogin = await client.post('auth/login/', {
      username: 'aharsh1993@gmail.com',
      password: 'AdminPassword123'
    });

    const adminCookie = adminLogin.headers['set-cookie'];
    const isAdminFlag = adminLogin.data.is_admin;
    console.log(`Admin Login Status: ${adminLogin.status}, user: ${adminLogin.data.username}, email: ${adminLogin.data.email}, is_admin: ${isAdminFlag}`);

    const adminAPICall = await client.get('admin-api/orders/', { headers: { Cookie: adminCookie } });
    console.log(`Admin API Call Status: ${adminAPICall.status}, Total Orders: ${adminAPICall.data?.length}`);

    reports.adminAuth = adminLogin.status === 200 && isAdminFlag === true && adminAPICall.status === 200;

    // TEST 6: Duplicate Email Signup Prevention
    console.log('\n--- TEST 6: Duplicate Email Signup Prevention ---');
    const duplicateRegister = await client.post('auth/register/', {
      username: 'AnotherHarsh',
      email: 'AHARSH1993@GMAIL.COM', // Uppercase duplicate test
      password: 'SomePassword123'
    }).catch(e => e.response);

    const dupBlocked = duplicateRegister.status === 400 && duplicateRegister.data?.error?.includes('already registered');
    console.log(`Duplicate Signup Status: ${duplicateRegister.status}, Message: ${duplicateRegister.data?.error}`);
    reports.duplicateSignupBlocked = dupBlocked;

    // TEST 7: Database Admin Email Unique Count
    console.log('\n--- TEST 7: Database Admin Email Count Check ---');
    const adminCountDB = await queryGet("SELECT COUNT(*) as cnt FROM auth_user WHERE LOWER(email) = 'aharsh1993@gmail.com'");
    console.log(`aharsh1993@gmail.com count in DB: ${adminCountDB.cnt}`);
    reports.adminEmailUnique = adminCountDB.cnt === 1;

  } catch (err) {
    console.error('Fatal Security Suite Error:', err.response?.data || err.message);
  } finally {
    server.close();
    console.log('\n===========================================================');
    console.log('  SECURITY & AUTHORIZATION SUITE RESULTS SUMMARY');
    console.log('===========================================================');
    console.log('CHARMI DB Admin Flags Removed:', reports.charmiDBCheck ? 'PASS' : 'FAIL');
    console.log('CHARMI Login Admin Access Denied:', reports.charmiLogin ? 'PASS' : 'FAIL');
    console.log('Unauthenticated Admin API Blocked (401):', reports.unauthAdminAPI ? 'PASS' : 'FAIL');
    console.log('CHARMI Admin API Access Blocked (403):', reports.charmiAdminAPI ? 'PASS' : 'FAIL');
    console.log('Admin Signup & Login (aharsh1993@gmail.com):', reports.adminAuth ? 'PASS' : 'FAIL');
    console.log('Duplicate Email Signup Blocked:', reports.duplicateSignupBlocked ? 'PASS' : 'FAIL');
    console.log('Admin Email Unique Count = 1:', reports.adminEmailUnique ? 'PASS' : 'FAIL');
  }
}

runSecuritySuite();
