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
async function addLeadsFromCrawl(crawled, keyword, crawlLogId, existingEmails = new Set(), addedInSession = new Set()) {
  let newLeadsCount = 0;

  for (const email of crawled.emails) {
    const emailLower = email.toLowerCase().trim();
    const isExisting = existingEmails.has(emailLower);
    const isAlreadyAdded = addedInSession.has(emailLower);
    const uniquePhones = [...new Set(crawled.phones)].slice(0, 2);

    let existing = null;
    if (isExisting) {
      existing = await dbRepo.findLeadByEmail(emailLower);
    }

    await dbRepo.insertLead({
      id: existing ? existing.id : '_' + Math.random().toString(36).substr(2, 9),
      name: crawled.title || (existing ? existing.name : ''),
      email: emailLower,
      phone: uniquePhones.length > 0 ? uniquePhones.join(', ') : (existing ? existing.phone : ''),
      website: crawled.url || (existing ? existing.website : ''),
      keyword: existing ? existing.keyword : keyword,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      emailStatus: existing ? existing.emailStatus : 'Chưa gửi',
      crawlLogId: existing ? existing.crawlLogId : crawlLogId
    });

    if (!isExisting && !isAlreadyAdded) {
      addedInSession.add(emailLower);
      newLeadsCount++;
    }
  }

  return newLeadsCount;
}

module.exports = { cleanPhones, addLeadsFromCrawl };
