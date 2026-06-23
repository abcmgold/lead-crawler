const dbRepo = require('../repositories/db.repository');

async function getQueryUserId(req) {
  if (req.user && req.user.role && req.user.role.toUpperCase() === 'ADMIN') return null;
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function getLeadEmails(req, res) {
  const { page, limit, search, crawlLogId } = req.query;
  const userId = await getQueryUserId(req);

  if (page && limit) {
    const result = await dbRepo.getLeadEmailsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || '',
      crawlLogId: crawlLogId || '',
      userId
    });
    return res.json(result);
  }

  const result = await dbRepo.getLeadEmailsFiltered({
    search: search || '',
    crawlLogId: crawlLogId || '',
    userId
  });
  res.json(result);
}

async function clearLeadEmails(req, res) {
  const { ids } = req.body;
  const userId = await getQueryUserId(req);

  if (ids) {
    // For non-admin, validate deletion by supplying their userId. Admins bypass by having userId=null.
    await dbRepo.deleteLeadEmails(userId, ids);
    return res.json({ message: 'Đã xóa các leads email được chọn' });
  }
  await dbRepo.clearLeadEmails(userId);
  res.json({ message: 'Đã xóa toàn bộ leads email của bạn' });
}

module.exports = { getLeadEmails, clearLeadEmails };

