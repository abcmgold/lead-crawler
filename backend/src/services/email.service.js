const nodemailer = require('nodemailer');
const jsonRepo = require('../repositories/json.repository');
const { logSystem } = require('../utils/logger');

function buildTransporter(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port) || 587,
    secure: smtp.secure || false,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

// Convert Base64 attachments back to Buffer
function buildAttachments(attachments) {
  const result = [];
  if (attachments && Array.isArray(attachments)) {
    attachments.forEach(att => {
      result.push({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType
      });
    });
  }
  return result;
}

// Sends a personalized email to each lead/custom address sequentially, persisting emailStatus
async function sendBulkEmails({ leadIds, customEmails, subject, body, attachments, smtp }) {
  const transporter = buildTransporter(smtp);
  const leads = jsonRepo.getLeads();

  let leadsToSend = [];

  if (leadIds && leadIds.length > 0) {
    leadsToSend = leads.filter(l => leadIds.includes(l.id));
  }

  if (customEmails && customEmails.length > 0) {
    customEmails.forEach(email => {
      leadsToSend.push({
        id: 'custom_' + Math.random().toString(36).substr(2, 9),
        name: 'Khách hàng',
        email: email,
        phone: 'Chưa rõ',
        website: 'Nhập thủ công',
        createdAt: new Date().toISOString(),
        emailStatus: 'Chưa gửi'
      });
    });
  }

  const attachmentsToSend = buildAttachments(attachments);

  logSystem(`Bắt đầu chiến dịch gửi email. Tổng số lượng nhận: ${leadsToSend.length}. Tiêu đề: "${subject}". Người gửi: <${smtp.senderEmail || smtp.user}>. Số tệp đính kèm: ${attachmentsToSend.length}`, 'INFO');

  let successCount = 0;
  let failCount = 0;

  // Send sequentially to avoid spam detection
  for (const lead of leadsToSend) {
    // Replace placeholder variables
    const personalizedBody = body
      .replace(/{{Name}}/g, lead.name)
      .replace(/{{Email}}/g, lead.email)
      .replace(/{{Phone}}/g, lead.phone)
      .replace(/{{Website}}/g, lead.website);

    try {
      await transporter.sendMail({
        from: `"${smtp.senderName || 'Hệ thống gửi Email'}" <${smtp.senderEmail || smtp.user}>`,
        to: lead.email,
        subject: subject,
        text: personalizedBody,
        html: personalizedBody.replace(/\n/g, '<br>'),
        attachments: attachmentsToSend
      });

      lead.emailStatus = 'Gửi thành công';
      successCount++;
      logSystem(`[GỬI OK] ${lead.email}`, 'INFO');
    } catch (error) {
      lead.emailStatus = `Thất bại: ${error.message}`;
      failCount++;
      logSystem(`[GỬI LỖI] ${lead.email} | Chi tiết: ${error.message}`, 'ERROR');
    }

    // Delay slightly between sends
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logSystem(`Chiến dịch hoàn thành. Thành công: ${successCount}, Thất bại: ${failCount}`, 'INFO');

  // Persist updated emailStatus for leads that exist in storage
  jsonRepo.saveLeads(leads);

  return {
    successCount,
    failCount,
    details: leadsToSend.map(l => ({ email: l.email, status: l.emailStatus }))
  };
}

module.exports = { sendBulkEmails };
