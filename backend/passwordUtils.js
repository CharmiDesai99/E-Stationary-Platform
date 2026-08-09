const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Verify raw password against stored hash.
 * Supports Django PBKDF2_SHA256 hashes and bcrypt hashes.
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;

  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const hash = parts[3];

    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
    return derivedKey === hash;
  }

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, storedHash);
  }

  // Fallback direct check (if plain text was used in legacy testing)
  return password === storedHash;
}

/**
 * Hash new password using Django-compatible PBKDF2 SHA256 or bcrypt.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const iterations = 1000000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

module.exports = {
  verifyPassword,
  hashPassword
};
