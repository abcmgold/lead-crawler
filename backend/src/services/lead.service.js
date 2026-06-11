const dbRepo = require('../repositories/db.repository');

const VALID_PHONE_REGEX = /^0\d{9}$/;

// Normalize phone numbers stored on existing leads (max 2 valid numbers each)
async function cleanPhones() {
  const leads = await dbRepo.getLeads();
  let fixedCount = 0;

  for (const lead of leads) {
    const phones = (lead.phone || '')
      .split(',')
      .map(p => p.trim().replace(/[\s.-]/g, ''))
      .filter(p => VALID_PHONE_REGEX.test(p));

    const cleanPhone = [...new Set(phones)].slice(0, 2).join(', ');
    if (cleanPhone !== lead.phone) {
      await dbRepo.updateLeadPhone(lead.id, cleanPhone);
      fixedCount++;
    }
  }

  return { fixedCount, total: leads.length };
}

// Persist new leads (deduped by email) found from a crawl result. Returns how many were added.
async function addLeadsFromCrawl(crawled, keyword) {
  let newLeadsCount = 0;

  for (const email of crawled.emails) {
    const existing = await dbRepo.findLeadByEmail(email);
    if (!existing) {
      const uniquePhones = [...new Set(crawled.phones)].slice(0, 2);
      await dbRepo.insertLead({
        id: '_' + Math.random().toString(36).substr(2, 9),
        name: crawled.title,
        email,
        phone: uniquePhones.join(', ') || '',
        website: crawled.url,
        keyword,
        createdAt: new Date().toISOString(),
        emailStatus: 'Chưa gửi'
      });
      newLeadsCount++;
    }
  }

  return newLeadsCount;
}

module.exports = { cleanPhones, addLeadsFromCrawl };
