const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Validate credentials against the single admin account stored in env vars
function login(username, password) {
  const validUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const role = process.env.ADMIN_ROLE || 'ADMIN';

  if (!validUsername || !passwordHash) return null;
  if (username !== validUsername) return null;
  if (!bcrypt.compareSync(password, passwordHash)) return null;

  const user = { username, role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { login, verifyToken };
