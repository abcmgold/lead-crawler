const jsonRepo = require('../repositories/json.repository');
const leadService = require('../services/lead.service');
const { logSystem } = require('../utils/logger');

function getLeads(req, res) {
  res.json(jsonRepo.getLeads());
}

function clearLeads(req, res) {
  jsonRepo.saveLeads([]);
  res.json({ message: 'Đã xóa toàn bộ leads' });
}

function cleanPhones(req, res) {
  const { fixedCount, total } = leadService.cleanPhones();
  logSystem(`Clean phone data: đã sửa ${fixedCount}/${total} leads`, 'INFO');
  res.json({ success: true, fixedCount, total });
}

module.exports = { getLeads, clearLeads, cleanPhones };
