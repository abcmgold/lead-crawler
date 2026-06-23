const dbRepo = require('../repositories/db.repository');

async function getQueryUserId(req) {
  if (req.user && req.user.role && req.user.role.toUpperCase() === 'ADMIN') return null;
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function getLeadSocials(req, res) {
  const { page, limit, search, crawlLogId } = req.query;
  const userId = await getQueryUserId(req);

  if (page && limit) {
    const result = await dbRepo.getLeadSocialsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || '',
      crawlLogId: crawlLogId || '',
      userId
    });
    return res.json(result);
  }

  const result = await dbRepo.getLeadSocialsFiltered({
    search: search || '',
    crawlLogId: crawlLogId || '',
    userId
  });
  res.json(result);
}

async function clearLeadSocials(req, res) {
  const { ids } = req.body;
  const userId = await getQueryUserId(req);

  if (ids) {
    // For non-admin, validate deletion by supplying their userId. Admins bypass by having userId=null.
    await dbRepo.deleteLeadSocials(userId, ids);
    return res.json({ message: 'Đã xóa các leads mạng xã hội được chọn' });
  }
  await dbRepo.clearLeadSocials(userId);
  res.json({ message: 'Đã xóa toàn bộ leads mạng xã hội của bạn' });
}

module.exports = { getLeadSocials, clearLeadSocials };

