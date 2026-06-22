const pool = require('../db/pool');

function rowToLeadEmail(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    website: row.website,
    keyword: row.keyword,
    createdAt: row.created_at.toISOString(),
    emailStatus: row.email_status,
    crawlLogId: row.crawl_log_id,
    urlId: row.url_id
  };
}

function rowToLeadPhone(row) {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    website: row.website,
    keyword: row.keyword,
    createdAt: row.created_at.toISOString(),
    crawlLogId: row.crawl_log_id,
    urlId: row.url_id
  };
}

function rowToLeadSocial(row) {
  return {
    id: row.id,
    platform: row.platform,
    url: row.url,
    name: row.name,
    website: row.website,
    keyword: row.keyword,
    createdAt: row.created_at.toISOString(),
    crawlLogId: row.crawl_log_id,
    urlId: row.url_id
  };
}

function rowToLog(row) {
  return {
    id: row.id,
    keyword: row.keyword,
    timestamp: row.timestamp.toISOString(),
    urlsCount: row.urls_count,
    newEmailsCount: row.new_emails_count,
    newPhonesCount: row.new_phones_count,
    newSocialsCount: row.new_socials_count
  };
}

async function getLeadEmailsPaginated({ page = 1, limit = 25, search = '', crawlLogId = '' }) {
  const offset = (page - 1) * limit;
  const params = [];
  let query = 'SELECT * FROM lead_emails';
  let countQuery = 'SELECT COUNT(*) FROM lead_emails';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR email ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

  const countParams = [...params];
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  const countRes = await pool.query(countQuery, countParams);

  return {
    leads: rows.map(rowToLeadEmail),
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function getLeadEmailsFiltered({ search = '', crawlLogId = '' } = {}) {
  const params = [];
  let query = 'SELECT * FROM lead_emails';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR email ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadEmail);
}

async function getLeadPhonesPaginated({ page = 1, limit = 25, search = '', crawlLogId = '' }) {
  const offset = (page - 1) * limit;
  const params = [];
  let query = 'SELECT * FROM lead_phones';
  let countQuery = 'SELECT COUNT(*) FROM lead_phones';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR phone ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

  const countParams = [...params];
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  const countRes = await pool.query(countQuery, countParams);

  return {
    leads: rows.map(rowToLeadPhone),
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function getLeadPhonesFiltered({ search = '', crawlLogId = '' } = {}) {
  const params = [];
  let query = 'SELECT * FROM lead_phones';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR phone ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadPhone);
}

async function getLeadSocialsPaginated({ page = 1, limit = 25, search = '', crawlLogId = '' }) {
  const offset = (page - 1) * limit;
  const params = [];
  let query = 'SELECT * FROM lead_socials';
  let countQuery = 'SELECT COUNT(*) FROM lead_socials';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR platform ILIKE $${searchIdx} OR url ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

  const countParams = [...params];
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  const countRes = await pool.query(countQuery, countParams);

  return {
    leads: rows.map(rowToLeadSocial),
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function getLeadSocialsFiltered({ search = '', crawlLogId = '' } = {}) {
  const params = [];
  let query = 'SELECT * FROM lead_socials';
  let conditions = [];

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR platform ILIKE $${searchIdx} OR url ILIKE $${searchIdx} OR website ILIKE $${searchIdx})`);
  }

  if (crawlLogId) {
    params.push(crawlLogId);
    const logIdx = params.length;
    conditions.push(`crawl_log_id = $${logIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadSocial);
}

async function getAllLeadEmails() {
  const { rows } = await pool.query('SELECT * FROM lead_emails ORDER BY created_at ASC');
  return rows.map(rowToLeadEmail);
}

async function getAllLeadEmailAddresses() {
  const { rows } = await pool.query('SELECT email FROM lead_emails');
  return new Set(rows.map(r => r.email.toLowerCase()));
}

async function getAllLeadPhoneNumbers() {
  const { rows } = await pool.query('SELECT phone FROM lead_phones');
  return new Set(rows.map(r => r.phone));
}

async function getAllLeadSocialKeys() {
  const { rows } = await pool.query('SELECT platform, url FROM lead_socials');
  return new Set(rows.map(r => `${r.platform}|${r.url}`));
}

async function upsertLeadEmail(lead) {
  await pool.query(
    `INSERT INTO lead_emails (id, email, name, website, keyword, created_at, email_status, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_emails.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_emails.website)`,
    [lead.id, lead.email, lead.name, lead.website, lead.keyword, lead.createdAt, lead.emailStatus, lead.crawlLogId || null, lead.urlId || null]
  );
}

async function upsertLeadPhone(lead) {
  await pool.query(
    `INSERT INTO lead_phones (id, phone, name, website, keyword, created_at, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (phone) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_phones.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_phones.website)`,
    [lead.id, lead.phone, lead.name, lead.website, lead.keyword, lead.createdAt, lead.crawlLogId || null, lead.urlId || null]
  );
}

async function upsertLeadSocial(social) {
  await pool.query(
    `INSERT INTO lead_socials (id, platform, url, name, website, keyword, created_at, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (platform, url) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_socials.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_socials.website)`,
    [social.id, social.platform, social.url, social.name, social.website, social.keyword, social.createdAt, social.crawlLogId || null, social.urlId || null]
  );
}

async function updateLeadEmailStatus(id, emailStatus) {
  await pool.query('UPDATE lead_emails SET email_status = $1 WHERE id = $2', [emailStatus, id]);
}

async function clearLeadEmails() {
  await pool.query('DELETE FROM lead_emails');
}

async function deleteLeadEmails(ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  await pool.query('DELETE FROM lead_emails WHERE id = ANY($1)', [ids]);
}

async function clearLeadPhones() {
  await pool.query('DELETE FROM lead_phones');
}

async function deleteLeadPhones(ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  await pool.query('DELETE FROM lead_phones WHERE id = ANY($1)', [ids]);
}

async function clearLeadSocials() {
  await pool.query('DELETE FROM lead_socials');
}

async function deleteLeadSocials(ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  await pool.query('DELETE FROM lead_socials WHERE id = ANY($1)', [ids]);
}

async function clearCrawledUrls() {
  await pool.query('DELETE FROM crawled_urls');
}

// Resets all crawl-derived data in one transaction: leads, crawled URLs, and crawl history
async function clearAllLeadData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM lead_emails');
    await client.query('DELETE FROM lead_phones');
    await client.query('DELETE FROM lead_socials');
    await client.query('DELETE FROM crawled_urls');
    await client.query('DELETE FROM crawl_logs');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getLeadsOverallSummary() {
  const urlsRes = await pool.query('SELECT COUNT(*) FROM crawled_urls');
  const emailsRes = await pool.query('SELECT COUNT(*) FROM lead_emails');
  const phonesRes = await pool.query('SELECT COUNT(*) FROM lead_phones');
  const socialsRes = await pool.query('SELECT COUNT(*) FROM lead_socials');

  return {
    totalUrls: parseInt(urlsRes.rows[0].count, 10),
    totalEmails: parseInt(emailsRes.rows[0].count, 10),
    totalPhones: parseInt(phonesRes.rows[0].count, 10),
    totalSocials: parseInt(socialsRes.rows[0].count, 10)
  };
}

async function insertCrawledUrl(crawledUrl) {
  await pool.query(
    `INSERT INTO crawled_urls (id, url, title, status, message, keyword, crawl_log_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [crawledUrl.id, crawledUrl.url, crawledUrl.title, crawledUrl.status, crawledUrl.message, crawledUrl.keyword, crawledUrl.crawlLogId || null, crawledUrl.createdAt]
  );
}

async function getLogs() {
  const { rows } = await pool.query('SELECT * FROM crawl_logs ORDER BY "timestamp" ASC');
  return rows.map(rowToLog);
}

async function getLogsPaginated({ page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    'SELECT * FROM crawl_logs ORDER BY "timestamp" DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  const countRes = await pool.query('SELECT COUNT(*) FROM crawl_logs');
  return {
    logs: rows.map(rowToLog),
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function addLog(log) {
  await pool.query(
    `INSERT INTO crawl_logs (id, keyword, "timestamp", urls_count, new_emails_count, new_phones_count, new_socials_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [log.id, log.keyword, log.timestamp, log.urlsCount, log.newEmailsCount, log.newPhonesCount, log.newSocialsCount]
  );
}

async function clearLogs() {
  await pool.query('DELETE FROM crawl_logs');
}

function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role
  };
}

async function findUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

async function updateUserPassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

function rowToSmtpSettings(row) {
  return {
    host: row.host,
    port: row.port,
    user: row.smtp_user,
    pass: row.smtp_pass,
    secure: row.secure,
    senderName: row.sender_name,
    senderEmail: row.sender_email
  };
}

async function getSmtpSettings() {
  const { rows } = await pool.query('SELECT * FROM smtp_settings WHERE id = 1');
  return rows[0] ? rowToSmtpSettings(rows[0]) : null;
}

async function saveSmtpSettings(settings) {
  await pool.query(
    `INSERT INTO smtp_settings (id, host, port, smtp_user, smtp_pass, secure, sender_name, sender_email)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       host = EXCLUDED.host,
       port = EXCLUDED.port,
       smtp_user = EXCLUDED.smtp_user,
       smtp_pass = EXCLUDED.smtp_pass,
       secure = EXCLUDED.secure,
       sender_name = EXCLUDED.sender_name,
       sender_email = EXCLUDED.sender_email`,
    [settings.host, settings.port, settings.user, settings.pass, settings.secure, settings.senderName, settings.senderEmail]
  );
}

function rowToTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    createdAt: row.created_at.toISOString()
  };
}

async function getTemplates() {
  const { rows } = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
  return rows.map(rowToTemplate);
}

async function insertTemplate(template) {
  await pool.query(
    `INSERT INTO email_templates (id, name, subject, body, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [template.id, template.name, template.subject, template.body, template.createdAt || new Date().toISOString()]
  );
}

async function updateTemplate(id, template) {
  await pool.query(
    `UPDATE email_templates
     SET name = $1, subject = $2, body = $3
     WHERE id = $4`,
    [template.name, template.subject, template.body, id]
  );
}

async function deleteTemplate(id) {
  await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);
}

module.exports = {
  getLeadEmailsPaginated,
  getLeadEmailsFiltered,
  getLeadPhonesPaginated,
  getLeadPhonesFiltered,
  getLeadSocialsPaginated,
  getLeadSocialsFiltered,
  getAllLeadEmails,
  getAllLeadEmailAddresses,
  getAllLeadPhoneNumbers,
  getAllLeadSocialKeys,
  upsertLeadEmail,
  upsertLeadPhone,
  upsertLeadSocial,
  updateLeadEmailStatus,
  clearLeadEmails,
  deleteLeadEmails,
  clearLeadPhones,
  deleteLeadPhones,
  clearLeadSocials,
  deleteLeadSocials,
  clearCrawledUrls,
  clearAllLeadData,
  getLeadsOverallSummary,
  insertCrawledUrl,
  getLogs,
  getLogsPaginated,
  addLog,
  clearLogs,
  findUserByUsername,
  updateUserPassword,
  getSmtpSettings,
  saveSmtpSettings,
  getTemplates,
  insertTemplate,
  updateTemplate,
  deleteTemplate
};
