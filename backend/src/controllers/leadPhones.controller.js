const dbRepo = require('../repositories/db.repository');

async function getLeadPhones(req, res) {
  const { page, limit, search, crawlLogId } = req.query;

  if (page && limit) {
    const result = await dbRepo.getLeadPhonesPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || '',
      crawlLogId: crawlLogId || ''
    });
    return res.json(result);
  }

  const result = await dbRepo.getLeadPhonesFiltered({
    search: search || '',
    crawlLogId: crawlLogId || ''
  });
  res.json(result);
}

async function clearLeadPhones(req, res) {
  await dbRepo.clearLeadPhones();
  res.json({ message: 'Đã xóa toàn bộ leads số điện thoại' });
}

module.exports = { getLeadPhones, clearLeadPhones };
