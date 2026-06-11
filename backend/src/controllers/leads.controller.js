const dbRepo = require('../repositories/db.repository');
const leadService = require('../services/lead.service');
const { logSystem } = require('../utils/logger');

async function getLeads(req, res) {
  res.json(await dbRepo.getLeads());
}

async function clearLeads(req, res) {
  await dbRepo.clearLeads();
  res.json({ message: 'Đã xóa toàn bộ leads' });
}

async function cleanPhones(req, res) {
  const { fixedCount, total } = await leadService.cleanPhones();
  logSystem(`Clean phone data: đã sửa ${fixedCount}/${total} leads`, 'INFO');
  res.json({ success: true, fixedCount, total });
}

module.exports = { getLeads, clearLeads, cleanPhones };
