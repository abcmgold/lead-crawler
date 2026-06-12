const dbRepo = require('../repositories/db.repository');

async function getHistory(req, res) {
  const { page, limit } = req.query;
  if (page && limit) {
    const result = await dbRepo.getLogsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return res.json(result);
  }
  res.json(await dbRepo.getLogs());
}

async function clearHistory(req, res) {
  await dbRepo.clearLogs();
  res.json({ message: 'Đã xóa lịch sử quét' });
}

module.exports = { getHistory, clearHistory };
