const dbRepo = require('../repositories/db.repository');

// Persists a single crawled URL's results: the crawled_urls row plus any
// emails/phones/socials found on it, each deduped independently.
// `dedupeSets` tracks existing + session-added keys across the whole crawl run.
async function recordCrawlResult(crawled, keyword, crawlLogId, dedupeSets) {
  const urlId = '_' + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  await dbRepo.insertCrawledUrl({
    id: urlId,
    url: crawled.url,
    title: crawled.title,
    status: crawled.status,
    message: crawled.message,
    keyword,
    crawlLogId,
    createdAt: now
  });

  let newEmails = 0;
  let newPhones = 0;
  let newSocials = 0;

  for (const email of crawled.emails) {
    const emailLower = email.toLowerCase().trim();
    await dbRepo.upsertLeadEmail({
      id: '_' + Math.random().toString(36).substr(2, 9),
      email: emailLower,
      name: crawled.title,
      website: crawled.url,
      keyword,
      createdAt: now,
      emailStatus: 'Chưa gửi',
      crawlLogId,
      urlId
    });

    if (!dedupeSets.existingEmails.has(emailLower) && !dedupeSets.addedEmails.has(emailLower)) {
      dedupeSets.addedEmails.add(emailLower);
      newEmails++;
    }
  }

  for (const phone of [...new Set(crawled.phones)]) {
    await dbRepo.upsertLeadPhone({
      id: '_' + Math.random().toString(36).substr(2, 9),
      phone,
      name: crawled.title,
      website: crawled.url,
      keyword,
      createdAt: now,
      crawlLogId,
      urlId
    });

    if (!dedupeSets.existingPhones.has(phone) && !dedupeSets.addedPhones.has(phone)) {
      dedupeSets.addedPhones.add(phone);
      newPhones++;
    }
  }

  for (const social of crawled.socials) {
    const key = `${social.platform}|${social.url}`;
    await dbRepo.upsertLeadSocial({
      id: '_' + Math.random().toString(36).substr(2, 9),
      platform: social.platform,
      url: social.url,
      name: crawled.title,
      website: crawled.url,
      keyword,
      createdAt: now,
      crawlLogId,
      urlId
    });

    if (!dedupeSets.existingSocials.has(key) && !dedupeSets.addedSocials.has(key)) {
      dedupeSets.addedSocials.add(key);
      newSocials++;
    }
  }

  return { newEmails, newPhones, newSocials };
}

module.exports = { recordCrawlResult };
