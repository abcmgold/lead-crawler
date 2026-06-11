const emailService = require('../services/email.service');
const settingsService = require('../services/settings.service');
const { logSystem } = require('../utils/logger');

async function sendEmails(req, res) {
  const { leadIds, customEmails, subject, body, attachments } = req.body;

  const hasLeads = leadIds && leadIds.length > 0;
  const hasCustom = customEmails && customEmails.length > 0;

  if (!hasLeads && !hasCustom) {
    return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 lead hoặc nhập email thủ công.' });
  }
  if (!subject || !body) {
    return res.status(400).json({ error: 'Tiêu đề và nội dung email không được bỏ trống' });
  }

  const smtp = settingsService.getSettings();
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return res.status(400).json({ error: 'SMTP chưa được cấu hình trên server (.env)' });
  }

  try {
    const result = await emailService.sendBulkEmails({ leadIds, customEmails, subject, body, attachments, smtp });
    res.json({
      success: true,
      message: `Đã gửi xong. Thành công: ${result.successCount}, Thất bại: ${result.failCount}`,
      successCount: result.successCount,
      failCount: result.failCount,
      details: result.details
    });
  } catch (err) {
    logSystem(`Lỗi gửi email: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
}

module.exports = { sendEmails };
