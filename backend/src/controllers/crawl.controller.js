const crawlService = require('../services/crawl.service');
const { logSystem } = require('../utils/logger');

async function crawl(req, res) {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp từ khóa tìm kiếm' });
  }

  try {
    const result = await crawlService.performCrawl(keyword);
    res.json(result);
  } catch (err) {
    logSystem(`Lỗi trong quá trình cào dữ liệu cho "${keyword}": ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
}

module.exports = { crawl };
