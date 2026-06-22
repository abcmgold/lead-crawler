const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbRepo = require('../repositories/db.repository');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Validate credentials against the admin account stored in the users table
async function login(username, password) {
  const account = await dbRepo.findUserByUsername(username);
  if (!account) return null;
  if (!bcrypt.compareSync(password, account.passwordHash)) return null;

  const user = {
    username: account.username,
    role: account.role,
    needsPasswordChange: account.needsPasswordChange
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Verifies the current password and updates the stored hash
async function changePassword(username, oldPassword, newPassword) {
  const account = await dbRepo.findUserByUsername(username);
  if (!account) return { success: false, error: 'Tài khoản không tồn tại' };
  if (!bcrypt.compareSync(oldPassword, account.passwordHash)) {
    return { success: false, error: 'Mật khẩu hiện tại không đúng' };
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await dbRepo.updateUserPassword(account.id, newHash);
  return { success: true };
}

module.exports = { login, verifyToken, changePassword };
