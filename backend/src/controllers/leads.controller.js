const dbRepo = require('../repositories/db.repository');

async function getSummary(req, res) {
  try {
    const summary = await dbRepo.getLeadsOverallSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function clearAll(req, res) {
  try {
    await dbRepo.clearAllLeadData();
    res.json({ message: 'Đã xóa toàn bộ dữ liệu leads, URL đã cào và lịch sử cào' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getSummary, clearAll };
