const crawlService = require('../services/crawl.service');
const { logSystem } = require('../utils/logger');
const dbRepo = require('../repositories/db.repository');

async function getActualUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function crawl(req, res) {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp từ khóa tìm kiếm' });
  }

  try {
    const userId = await getActualUserId(req);
    const result = await crawlService.performCrawl(keyword, userId);
    res.json(result);
  } catch (err) {
    logSystem(`Lỗi trong quá trình cào dữ liệu cho "${keyword}": ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
}

module.exports = { crawl };

