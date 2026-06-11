const { verifyToken } = require('../services/auth.service');

// Verifies the JWT stored in the httpOnly cookie and attaches the user to req
function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = authenticate;
