const dbRepo = require('../repositories/db.repository');

async function getLeadEmails(req, res) {
  const { page, limit, search, crawlLogId } = req.query;

  if (page && limit) {
    const result = await dbRepo.getLeadEmailsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || '',
      crawlLogId: crawlLogId || ''
    });
    return res.json(result);
  }

  const result = await dbRepo.getLeadEmailsFiltered({
    search: search || '',
    crawlLogId: crawlLogId || ''
  });
  res.json(result);
}

async function clearLeadEmails(req, res) {
  const { ids } = req.body;
  if (ids) {
    await dbRepo.deleteLeadEmails(ids);
    return res.json({ message: 'Đã xóa các leads email được chọn' });
  }
  await dbRepo.clearLeadEmails();
  res.json({ message: 'Đã xóa toàn bộ leads email' });
}

module.exports = { getLeadEmails, clearLeadEmails };
