const dbRepo = require('../repositories/db.repository');

async function getLeadSocials(req, res) {
  const { page, limit, search, crawlLogId } = req.query;

  if (page && limit) {
    const result = await dbRepo.getLeadSocialsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || '',
      crawlLogId: crawlLogId || ''
    });
    return res.json(result);
  }

  const result = await dbRepo.getLeadSocialsFiltered({
    search: search || '',
    crawlLogId: crawlLogId || ''
  });
  res.json(result);
}

async function clearLeadSocials(req, res) {
  await dbRepo.clearLeadSocials();
  res.json({ message: 'Đã xóa toàn bộ leads mạng xã hội' });
}

module.exports = { getLeadSocials, clearLeadSocials };
