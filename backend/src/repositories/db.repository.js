const pool = require('../db/pool');

function rowToLeadEmail(row) {
  return {
    id: row.id,
    userId: row.user_id,
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
    userId: row.user_id,
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
    userId: row.user_id,
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
    userId: row.user_id,
    keyword: row.keyword,
    timestamp: row.timestamp.toISOString(),
    urlsCount: row.urls_count,
    newEmailsCount: row.new_emails_count,
    newPhonesCount: row.new_phones_count,
    newSocialsCount: row.new_socials_count
  };
}

async function getLeadEmailsPaginated({ page = 1, limit = 25, search = '', crawlLogId = '', userId = null }) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
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

async function getLeadEmailsFiltered({ search = '', crawlLogId = '', userId = null } = {}) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadEmail);
}

async function getLeadPhonesPaginated({ page = 1, limit = 25, search = '', crawlLogId = '', userId = null }) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
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

async function getLeadPhonesFiltered({ search = '', crawlLogId = '', userId = null } = {}) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadPhone);
}

async function getLeadSocialsPaginated({ page = 1, limit = 25, search = '', crawlLogId = '', userId = null }) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
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

async function getLeadSocialsFiltered({ search = '', crawlLogId = '', userId = null } = {}) {
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

  if (userId) {
    params.push(userId);
    const userIdx = params.length;
    conditions.push(`user_id = $${userIdx}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadSocial);
}

async function getAllLeadEmails(userId = null) {
  const query = userId 
    ? 'SELECT * FROM lead_emails WHERE user_id = $1 ORDER BY created_at ASC'
    : 'SELECT * FROM lead_emails ORDER BY created_at ASC';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(query, params);
  return rows.map(rowToLeadEmail);
}

async function getAllLeadEmailAddresses(userId = null) {
  const query = userId 
    ? 'SELECT email FROM lead_emails WHERE user_id = $1'
    : 'SELECT email FROM lead_emails';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(query, params);
  return new Set(rows.map(r => r.email.toLowerCase()));
}

async function getAllLeadPhoneNumbers(userId = null) {
  const query = userId 
    ? 'SELECT phone FROM lead_phones WHERE user_id = $1'
    : 'SELECT phone FROM lead_phones';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(query, params);
  return new Set(rows.map(r => r.phone));
}

async function getAllLeadSocialKeys(userId = null) {
  const query = userId 
    ? 'SELECT platform, url FROM lead_socials WHERE user_id = $1'
    : 'SELECT platform, url FROM lead_socials';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(query, params);
  return new Set(rows.map(r => `${r.platform}|${r.url}`));
}

async function upsertLeadEmail(userId, lead) {
  await pool.query(
    `INSERT INTO lead_emails (id, user_id, email, name, website, keyword, created_at, email_status, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id, email) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_emails.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_emails.website)`,
    [lead.id, userId, lead.email, lead.name, lead.website, lead.keyword, lead.createdAt, lead.emailStatus, lead.crawlLogId || null, lead.urlId || null]
  );
}

async function upsertLeadPhone(userId, lead) {
  await pool.query(
    `INSERT INTO lead_phones (id, user_id, phone, name, website, keyword, created_at, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, phone) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_phones.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_phones.website)`,
    [lead.id, userId, lead.phone, lead.name, lead.website, lead.keyword, lead.createdAt, lead.crawlLogId || null, lead.urlId || null]
  );
}

async function upsertLeadSocial(userId, social) {
  await pool.query(
    `INSERT INTO lead_socials (id, user_id, platform, url, name, website, keyword, created_at, crawl_log_id, url_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id, platform, url) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), lead_socials.name),
       website = COALESCE(NULLIF(EXCLUDED.website, ''), lead_socials.website)`,
    [social.id, userId, social.platform, social.url, social.name, social.website, social.keyword, social.createdAt, social.crawlLogId || null, social.urlId || null]
  );
}

async function updateLeadEmailStatus(id, emailStatus) {
  await pool.query('UPDATE lead_emails SET email_status = $1 WHERE id = $2', [emailStatus, id]);
}

async function clearLeadEmails(userId = null) {
  if (userId) {
    await pool.query('DELETE FROM lead_emails WHERE user_id = $1', [userId]);
  } else {
    await pool.query('DELETE FROM lead_emails');
  }
}

async function deleteLeadEmails(userId, ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  if (userId) {
    await pool.query('DELETE FROM lead_emails WHERE id = ANY($1) AND user_id = $2', [ids, userId]);
  } else {
    await pool.query('DELETE FROM lead_emails WHERE id = ANY($1)', [ids]);
  }
}

async function clearLeadPhones(userId = null) {
  if (userId) {
    await pool.query('DELETE FROM lead_phones WHERE user_id = $1', [userId]);
  } else {
    await pool.query('DELETE FROM lead_phones');
  }
}

async function deleteLeadPhones(userId, ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  if (userId) {
    await pool.query('DELETE FROM lead_phones WHERE id = ANY($1) AND user_id = $2', [ids, userId]);
  } else {
    await pool.query('DELETE FROM lead_phones WHERE id = ANY($1)', [ids]);
  }
}

async function clearLeadSocials(userId = null) {
  if (userId) {
    await pool.query('DELETE FROM lead_socials WHERE user_id = $1', [userId]);
  } else {
    await pool.query('DELETE FROM lead_socials');
  }
}

async function deleteLeadSocials(userId, ids) {
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length === 0) return;
  if (userId) {
    await pool.query('DELETE FROM lead_socials WHERE id = ANY($1) AND user_id = $2', [ids, userId]);
  } else {
    await pool.query('DELETE FROM lead_socials WHERE id = ANY($1)', [ids]);
  }
}

async function clearCrawledUrls(userId = null) {
  if (userId) {
    await pool.query('DELETE FROM crawled_urls WHERE user_id = $1', [userId]);
  } else {
    await pool.query('DELETE FROM crawled_urls');
  }
}

// Resets all crawl-derived data in one transaction: leads, crawled URLs, and crawl history
async function clearAllLeadData(userId = null) {
  const client = pool; // use global pool pool.query since nested transactions are not used here
  if (userId) {
    await client.query('DELETE FROM lead_emails WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM lead_phones WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM lead_socials WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM crawled_urls WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM crawl_logs WHERE user_id = $1', [userId]);
  } else {
    await client.query('DELETE FROM lead_emails');
    await client.query('DELETE FROM lead_phones');
    await client.query('DELETE FROM lead_socials');
    await client.query('DELETE FROM crawled_urls');
    await client.query('DELETE FROM crawl_logs');
  }
}

async function getLeadsOverallSummary(userId = null) {
  const params = userId ? [userId] : [];
  const whereClause = userId ? ' WHERE user_id = $1' : '';

  const urlsRes = await pool.query('SELECT COUNT(*) FROM crawled_urls' + whereClause, params);
  const emailsRes = await pool.query('SELECT COUNT(*) FROM lead_emails' + whereClause, params);
  const phonesRes = await pool.query('SELECT COUNT(*) FROM lead_phones' + whereClause, params);
  const socialsRes = await pool.query('SELECT COUNT(*) FROM lead_socials' + whereClause, params);

  return {
    totalUrls: parseInt(urlsRes.rows[0].count, 10),
    totalEmails: parseInt(emailsRes.rows[0].count, 10),
    totalPhones: parseInt(phonesRes.rows[0].count, 10),
    totalSocials: parseInt(socialsRes.rows[0].count, 10)
  };
}

async function insertCrawledUrl(userId, crawledUrl) {
  await pool.query(
    `INSERT INTO crawled_urls (id, user_id, url, title, status, message, keyword, crawl_log_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [crawledUrl.id, userId, crawledUrl.url, crawledUrl.title, crawledUrl.status, crawledUrl.message, crawledUrl.keyword, crawledUrl.crawlLogId || null, crawledUrl.createdAt]
  );
}

async function getLogs(userId = null) {
  const query = userId 
    ? 'SELECT * FROM crawl_logs WHERE user_id = $1 ORDER BY "timestamp" ASC'
    : 'SELECT * FROM crawl_logs ORDER BY "timestamp" ASC';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(query, params);
  return rows.map(rowToLog);
}

async function getLogsPaginated({ page = 1, limit = 10, userId = null }) {
  const offset = (page - 1) * limit;
  const params = [];
  let query = 'SELECT * FROM crawl_logs';
  let countQuery = 'SELECT COUNT(*) FROM crawl_logs';

  if (userId) {
    params.push(userId);
    const userClause = ' WHERE user_id = $1';
    query += userClause;
    countQuery += userClause;
  }

  query += ' ORDER BY "timestamp" DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  const countParams = [...params];
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  const countRes = await pool.query(countQuery, countParams);
  return {
    logs: rows.map(rowToLog),
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function addLog(userId, log) {
  await pool.query(
    `INSERT INTO crawl_logs (id, user_id, keyword, "timestamp", urls_count, new_emails_count, new_phones_count, new_socials_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [log.id, userId, log.keyword, log.timestamp, log.urlsCount, log.newEmailsCount, log.newPhonesCount, log.newSocialsCount]
  );
}

async function clearLogs(userId = null) {
  if (userId) {
    await pool.query('DELETE FROM crawl_logs WHERE user_id = $1', [userId]);
  } else {
    await pool.query('DELETE FROM crawl_logs');
  }
}

function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    needsPasswordChange: row.needs_password_change
  };
}

async function findUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

async function updateUserPassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1, needs_password_change = false WHERE id = $2', [passwordHash, id]);
}

function rowToSmtpSettings(row) {
  return {
    id: row.id,
    userId: row.user_id,
    host: row.host,
    port: row.port,
    user: row.smtp_user,
    pass: row.smtp_pass,
    secure: row.secure,
    senderName: row.sender_name,
    senderEmail: row.sender_email
  };
}

async function getSmtpSettings(userId) {
  if (!userId) return null;
  const { rows } = await pool.query('SELECT * FROM smtp_settings WHERE user_id = $1', [userId]);
  return rows[0] ? rowToSmtpSettings(rows[0]) : null;
}

async function saveSmtpSettings(userId, settings) {
  if (!userId) return;
  await pool.query(
    `INSERT INTO smtp_settings (user_id, host, port, smtp_user, smtp_pass, secure, sender_name, sender_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id) DO UPDATE SET
       host = EXCLUDED.host,
       port = EXCLUDED.port,
       smtp_user = EXCLUDED.smtp_user,
       smtp_pass = EXCLUDED.smtp_pass,
       secure = EXCLUDED.secure,
       sender_name = EXCLUDED.sender_name,
       sender_email = EXCLUDED.sender_email`,
    [userId, settings.host, settings.port, settings.user, settings.pass, settings.secure, settings.senderName, settings.senderEmail]
  );
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
  saveSmtpSettings
};
