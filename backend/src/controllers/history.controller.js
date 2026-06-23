const dbRepo = require('../repositories/db.repository');

async function getQueryUserId(req) {
  if (req.user && req.user.role && req.user.role.toUpperCase() === 'ADMIN') return null;
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function getHistory(req, res) {
  const { page, limit } = req.query;
  const userId = await getQueryUserId(req);

  if (page && limit) {
    const result = await dbRepo.getLogsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      userId
    });
    return res.json(result);
  }
  res.json(await dbRepo.getLogs(userId));
}

async function clearHistory(req, res) {
  const userId = await getQueryUserId(req);
  await dbRepo.clearLogs(userId);
  res.json({ message: 'Đã xóa lịch sử quét của bạn' });
}

module.exports = { getHistory, clearHistory };

