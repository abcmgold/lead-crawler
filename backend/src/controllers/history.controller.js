const jsonRepo = require('../repositories/json.repository');

function getHistory(req, res) {
  res.json(jsonRepo.getLogs());
}

function clearHistory(req, res) {
  jsonRepo.saveLogs([]);
  res.json({ message: 'Đã xóa lịch sử quét' });
}

module.exports = { getHistory, clearHistory };
