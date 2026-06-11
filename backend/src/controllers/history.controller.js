const dbRepo = require('../repositories/db.repository');

async function getHistory(req, res) {
  res.json(await dbRepo.getLogs());
}

async function clearHistory(req, res) {
  await dbRepo.clearLogs();
  res.json({ message: 'Đã xóa lịch sử quét' });
}

module.exports = { getHistory, clearHistory };
