const dbRepo = require('../repositories/db.repository');
const bcrypt = require('bcryptjs');

async function getUsers(req, res) {
  const { page, limit } = req.query;
  try {
    if (page && limit) {
      const result = await dbRepo.getUsersPaginated({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });
      return res.json(result);
    }
    const users = await dbRepo.getAllUsers();
    res.json({ users, total: users.length, page: 1, limit: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Vui lòng cung cấp username, password và role' });
  }

  const cleanRole = role.toUpperCase();
  if (cleanRole !== 'ADMIN' && cleanRole !== 'USER') {
    return res.status(400).json({ error: 'Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc USER' });
  }

  try {
    const existing = await dbRepo.findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
    }

    const id = '_' + Math.random().toString(36).substr(2, 9);
    const passwordHash = bcrypt.hashSync(password, 10);

    await dbRepo.createUser({
      id,
      username,
      passwordHash,
      role: cleanRole,
      needsPasswordChange: true
    });

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      user: {
        id,
        username,
        role: cleanRole,
        needsPasswordChange: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { username, password, role, needsPasswordChange } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'Vui lòng cung cấp username và role' });
  }

  const cleanRole = role.toUpperCase();
  if (cleanRole !== 'ADMIN' && cleanRole !== 'USER') {
    return res.status(400).json({ error: 'Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc USER' });
  }

  try {
    const existing = await dbRepo.findUserByUsername(username);
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
    }

    const userObj = {
      username,
      role: cleanRole,
      needsPasswordChange: needsPasswordChange ?? false
    };

    if (password && password.trim() !== '') {
      userObj.passwordHash = bcrypt.hashSync(password, 10);
      userObj.needsPasswordChange = true; // reset needs password change if new password is set
    }

    await dbRepo.updateUser(id, userObj);
    res.json({ message: 'Cập nhật người dùng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình' });
    }

    await dbRepo.deleteUser(id);
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
