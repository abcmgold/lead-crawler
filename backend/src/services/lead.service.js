const jsonRepo = require('../repositories/json.repository');

const VALID_PHONE_REGEX = /^0\d{9}$/;

// Normalize phone numbers stored on existing leads (max 2 valid numbers each)
function cleanPhones() {
  const leads = jsonRepo.getLeads();
  let fixedCount = 0;

  const cleanedLeads = leads.map(lead => {
    const phones = (lead.phone || '')
      .split(',')
      .map(p => p.trim().replace(/[\s.-]/g, ''))
      .filter(p => VALID_PHONE_REGEX.test(p));

    const cleanPhone = [...new Set(phones)].slice(0, 2).join(', ');
    if (cleanPhone !== lead.phone) fixedCount++;
    return { ...lead, phone: cleanPhone };
  });

  jsonRepo.saveLeads(cleanedLeads);
  return { fixedCount, total: cleanedLeads.length };
}

// Append new leads (deduped by email) found from a crawl result. Returns how many were added.
function addLeadsFromCrawl(leads, crawled, keyword) {
  let newLeadsCount = 0;

  crawled.emails.forEach(email => {
    const exists = leads.some(l => l.email === email);
    if (!exists) {
      const uniquePhones = [...new Set(crawled.phones)].slice(0, 2);
      leads.push({
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
  });

  return newLeadsCount;
}

module.exports = { cleanPhones, addLeadsFromCrawl };
