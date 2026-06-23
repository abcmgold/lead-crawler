const dbRepo = require('../repositories/db.repository');

async function getQueryUserId(req) {
  if (req.user && req.user.role && req.user.role.toUpperCase() === 'ADMIN') return null;
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function getSummary(req, res) {
  try {
    const userId = await getQueryUserId(req);
    const summary = await dbRepo.getLeadsOverallSummary(userId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function clearAll(req, res) {
  try {
    const userId = await getQueryUserId(req);
    await dbRepo.clearAllLeadData(userId);
    res.json({ message: 'Đã xóa toàn bộ dữ liệu leads, URL đã cào và lịch sử cào của bạn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getSummary, clearAll };

