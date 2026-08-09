const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const validator = require('email-validator');
const { queryGet, queryAll, queryRun } = require('../database');
const { verifyPassword, hashPassword } = require('../passwordUtils');
const { sendMail } = require('../emailUtils');

const ADMIN_EMAIL = 'aharsh1993@gmail.com';

// Initialize password reset tokens table if not exists
(async () => {
  try {
    await queryRun(`
      CREATE TABLE IF NOT EXISTS auth_passwordresettoken (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES auth_user(id)
      )
    `);
  } catch (err) {
    console.error('Error ensuring auth_passwordresettoken table:', err.message);
  }
})();

// Helper to check authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// Strict backend middleware for admin access (ONLY aharsh1993@gmail.com)
async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userEmail = (req.session.user.email || '').toLowerCase().trim();
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const dbUser = await queryGet('SELECT email FROM auth_user WHERE id = ?', [req.session.user.id]);
  if (!dbUser || (dbUser.email || '').toLowerCase().trim() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  return next();
}

// REGISTER POST /api/auth/register/
router.post('/register/', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validator.validate(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const hasLetter = /[A-Za-z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (password.length < 8 || !hasLetter || !hasDigit) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long and contain both letters and numbers' });
    }

    // Check duplicate username
    const existingUsername = await queryGet('SELECT id FROM auth_user WHERE LOWER(username) = LOWER(?)', [cleanUsername]);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check duplicate email (case-insensitive)
    const existingEmail = await queryGet('SELECT id FROM auth_user WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    // Admin role strictly determined by backend email matching
    const isSystemAdmin = cleanEmail === ADMIN_EMAIL;
    const isStaff = isSystemAdmin ? 1 : 0;
    const isSuperuser = isSystemAdmin ? 1 : 0;

    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();

    const userResult = await queryRun(
      `INSERT INTO auth_user (username, email, password, is_superuser, is_staff, is_active, date_joined, first_name, last_name)
       VALUES (?, ?, ?, ?, ?, 1, ?, '', '')`,
      [cleanUsername, cleanEmail, hashedPassword, isSuperuser, isStaff, now]
    );

    const userId = userResult.lastID;

    // Create CustomerProfile
    await queryRun(
      `INSERT INTO accounts_customerprofile (user_id, full_name, address, pincode, mobile)
       VALUES (?, '', '', '', '')`,
      [userId]
    );

    // Send admin notification
    sendMail({
      subject: 'NEW USER REGISTERED - Shree Sales',
      text: `A new user has registered:\nUsername: ${cleanUsername}\nEmail: ${cleanEmail}`,
      to: ADMIN_EMAIL
    });

    return res.json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// LOGIN POST /api/auth/login/
router.post('/login/', async (req, res) => {
  try {
    const { username, password } = req.body;

    const inputIdentifier = (username || '').trim();
    if (!inputIdentifier || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await queryGet(
      'SELECT * FROM auth_user WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [inputIdentifier, inputIdentifier]
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Single Source of Truth for Admin Access: ONLY aharsh1993@gmail.com
    const isAdminUser = (user.email || '').toLowerCase().trim() === ADMIN_EMAIL;

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: isAdminUser
    };

    return res.json({
      message: 'Login successful',
      username: user.username,
      email: user.email,
      is_admin: isAdminUser
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// LOGOUT POST /api/auth/logout/
router.post('/logout/', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out successfully' });
    });
  } else {
    return res.json({ message: 'Logged out successfully' });
  }
});

// PROFILE GET & PUT /api/auth/profile/
router.route('/profile/')
  .get(async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.session.user.id;
      const user = await queryGet('SELECT * FROM auth_user WHERE id = ?', [userId]);
      if (!user) {
        return res.status(401).json({ error: 'User account not found' });
      }

      let profile = await queryGet('SELECT * FROM accounts_customerprofile WHERE user_id = ?', [userId]);

      if (!profile) {
        await queryRun('INSERT INTO accounts_customerprofile (user_id, full_name, address, pincode, mobile) VALUES (?, "", "", "", "")', [userId]);
        profile = { full_name: '', address: '', pincode: '', mobile: '' };
      }

      const orders = await queryAll('SELECT id, total_amount, status, created_at FROM products_order WHERE user_id = ? ORDER BY id DESC', [userId]);
      const orderData = orders.map(o => ({
        id: o.id,
        total: String(o.total_amount),
        status: o.status,
        date: o.created_at
      }));

      // Single Source of Truth for Admin Access: ONLY aharsh1993@gmail.com
      const isAdminUser = (user.email || '').toLowerCase().trim() === ADMIN_EMAIL;

      return res.json({
        username: user.username,
        email: user.email,
        full_name: profile.full_name || '',
        address: profile.address || '',
        pincode: profile.pincode || '',
        mobile: profile.mobile || '',
        is_admin: isAdminUser,
        orders: orderData
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })
  .put(async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.session.user.id;
      const user = await queryGet('SELECT * FROM auth_user WHERE id = ?', [userId]);
      let profile = await queryGet('SELECT * FROM accounts_customerprofile WHERE user_id = ?', [userId]);

      const fullName = req.body.full_name !== undefined ? req.body.full_name : (profile ? profile.full_name : '');
      const address = req.body.address !== undefined ? req.body.address : (profile ? profile.address : '');
      const pincode = req.body.pincode !== undefined ? req.body.pincode : (profile ? profile.pincode : '');
      const mobile = req.body.mobile !== undefined ? req.body.mobile : (profile ? profile.mobile : '');

      if (!profile) {
        await queryRun(
          'INSERT INTO accounts_customerprofile (user_id, full_name, address, pincode, mobile) VALUES (?, ?, ?, ?, ?)',
          [userId, fullName, address, pincode, mobile]
        );
      } else {
        await queryRun(
          'UPDATE accounts_customerprofile SET full_name = ?, address = ?, pincode = ?, mobile = ? WHERE user_id = ?',
          [fullName, address, pincode, mobile, userId]
        );
      }

      return res.json({
        message: 'Profile updated successfully!',
        username: user.username,
        email: user.email,
        full_name: fullName,
        address: address,
        pincode: pincode,
        mobile: mobile
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

// FORGOT PASSWORD POST /api/auth/forgot-password/
router.post('/forgot-password/', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email || !validator.validate(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const user = await queryGet('SELECT * FROM auth_user WHERE LOWER(email) = LOWER(?)', [email]);
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email address.' });
    }

    // Generate secure password reset token
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour expiry

    // Invalidate previous tokens for this user
    await queryRun('UPDATE auth_passwordresettoken SET used = 1 WHERE user_id = ?', [user.id]);

    // Insert new reset token
    await queryRun(
      `INSERT INTO auth_passwordresettoken (user_id, token, created_at, expires_at, used)
       VALUES (?, ?, ?, ?, 0)`,
      [user.id, token, createdAt, expiresAt]
    );

    const host = req.headers.origin || 'http://localhost:3000';
    const resetLink = `${host}/reset-password?token=${token}`;
    
    sendMail({
      to: user.email,
      subject: 'Password Reset Request - Shree Sales',
      text: `Hello ${user.username},\n\nYou requested a password reset for your Shree Sales account.\n\nPlease click the link below to set a new password:\n${resetLink}\n\nNote: This link is valid for 1 hour.\nIf you did not request this change, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #06275c;">Shree Sales - Password Reset</h2>
          <p>Hello <b>${user.username}</b>,</p>
          <p>You requested a password reset for your Shree Sales account.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #f9a825; color: #1a237e; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>
          <p style="font-size: 0.85rem; color: #666;">Or copy and paste this URL into your browser:<br>${resetLink}</p>
          <p style="font-size: 0.85rem; color: #888;">This link expires in 1 hour.</p>
        </div>
      `
    });

    return res.json({ message: 'Password reset link sent to your email. Please check your inbox.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD POST /api/auth/reset-password/
router.post('/reset-password/', async (req, res) => {
  try {
    const { token, username, new_password } = req.body;

    const hasLetter = /[A-Za-z]/.test(new_password || '');
    const hasDigit = /\d/.test(new_password || '');
    if (!new_password || new_password.length < 8 || !hasLetter || !hasDigit) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    }

    let user = null;
    let resetRecord = null;

    if (token) {
      resetRecord = await queryGet('SELECT * FROM auth_passwordresettoken WHERE token = ? AND used = 0', [token]);
      if (!resetRecord) {
        return res.status(400).json({ message: 'Invalid or already used password reset link.' });
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        return res.status(400).json({ message: 'Password reset link has expired. Please request a new one.' });
      }

      user = await queryGet('SELECT * FROM auth_user WHERE id = ?', [resetRecord.user_id]);
    } else if (username) {
      user = await queryGet('SELECT * FROM auth_user WHERE LOWER(username) = LOWER(?)', [(username || '').trim()]);
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found or link is invalid.' });
    }

    const hashedPassword = hashPassword(new_password);
    await queryRun('UPDATE auth_user SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    if (resetRecord) {
      await queryRun('UPDATE auth_passwordresettoken SET used = 1 WHERE id = ?', [resetRecord.id]);
    }

    return res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ADMIN GET USERS GET /api/auth/admin/users/ (Protected by requireAdmin)
router.get('/admin/users/', requireAdmin, async (req, res) => {
  try {
    const users = await queryAll('SELECT id, username, email, date_joined FROM auth_user ORDER BY id ASC');
    const userList = [];
    for (const u of users) {
      let p = await queryGet('SELECT * FROM accounts_customerprofile WHERE user_id = ?', [u.id]);
      userList.push({
        id: u.id,
        username: u.username,
        email: u.email,
        full_name: p ? p.full_name : '',
        mobile: p ? p.mobile : '',
        date_joined: u.date_joined
      });
    }
    return res.json(userList);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.requireAdmin = requireAdmin;
module.exports = router;

