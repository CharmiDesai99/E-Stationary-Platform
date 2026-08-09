const { queryGet, queryAll, queryRun } = require('./database');
const fs = require('fs');

const path = require('path');
const dbPath = path.join(__dirname, 'db.sqlite3');
const bakPath = path.join(__dirname, 'db.sqlite3.bak');

async function cleanDatabase() {
  console.log('--- DATABASE CLEANUP & PROTECTION ---');

  // 1. Ensure backup exists
  if (!fs.existsSync(bakPath)) {
    fs.copyFileSync(dbPath, bakPath);
    console.log('✅ Created backup at backend/db.sqlite3.bak');
  } else {
    console.log('✅ Backup backend/db.sqlite3.bak already exists');
  }

  // 2. Remove admin privileges from CHARMI and all non-aharsh1993@gmail.com users
  await queryRun(
    "UPDATE auth_user SET is_staff = 0, is_superuser = 0 WHERE LOWER(email) != 'aharsh1993@gmail.com'"
  );
  console.log('✅ Revoked admin flags (is_staff=0, is_superuser=0) for CHARMI and all non-admin users');

  // 3. Delete existing aharsh1993@gmail.com account so it can be cleanly registered again
  const existingAdmin = await queryGet("SELECT * FROM auth_user WHERE LOWER(email) = 'aharsh1993@gmail.com'");
  if (existingAdmin) {
    await queryRun("DELETE FROM accounts_customerprofile WHERE user_id = ?", [existingAdmin.id]);
    await queryRun("DELETE FROM auth_user WHERE id = ?", [existingAdmin.id]);
    console.log(`✅ Deleted old admin user ID ${existingAdmin.id} (${existingAdmin.username} / ${existingAdmin.email}) to allow fresh registration`);
  } else {
    console.log('ℹ️ No existing user found for aharsh1993@gmail.com');
  }

  // 4. Verify CHARMI status
  const charmi = await queryGet("SELECT id, username, email, is_staff, is_superuser FROM auth_user WHERE LOWER(email) = 'bhutpalak4@gmail.com' OR username = 'CHARMI'");
  if (charmi) {
    console.log('✅ CHARMI Account Status:', charmi);
  }

  // 5. Verify admin account count
  const adminCount = await queryGet("SELECT COUNT(*) as cnt FROM auth_user WHERE LOWER(email) = 'aharsh1993@gmail.com'");
  console.log('✅ aharsh1993@gmail.com count in DB:', adminCount.cnt);

  console.log('--- DB CLEANUP COMPLETE ---');
}

cleanDatabase().catch(console.error);
