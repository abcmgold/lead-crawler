const authService = require('../services/auth.service');

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000 // 8h
};

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập username và password' });
  }

  const result = await authService.login(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Sai username hoặc password' });
  }

  res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);
  res.json({ user: result.user });
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.json({ message: 'Đã đăng xuất' });
}

function me(req, res) {
  res.json({ user: req.user });
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const result = await authService.changePassword(req.user.username, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Re-sign token since user has changed their password
  const jwt = require('jsonwebtoken');
  const updatedUser = {
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    needsPasswordChange: false
  };
  const token = jwt.sign(updatedUser, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

  res.json({ message: 'Đổi mật khẩu thành công', user: updatedUser });
}

module.exports = { login, logout, me, changePassword };
