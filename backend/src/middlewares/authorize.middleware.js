// Restricts access to users whose role (set by auth.middleware) is in the allowed list
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này' });
    }
    next();
  };
}

module.exports = authorize;
