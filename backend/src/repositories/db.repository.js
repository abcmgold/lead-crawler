const pool = require('../db/pool');

function rowToLead(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    keyword: row.keyword,
    createdAt: row.created_at.toISOString(),
    emailStatus: row.email_status,
    crawlLogId: row.crawl_log_id
  };
}

function rowToLog(row) {
  return {
    id: row.id,
    keyword: row.keyword,
    timestamp: row.timestamp.toISOString(),
    urlsCount: row.urls_count,
    newLeadsCount: row.new_leads_count
  };
}

async function getLeads() {
  const { rows } = await pool.query('SELECT * FROM leads ORDER BY created_at ASC');
  return rows.map(rowToLead);
}

async function findLeadByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM leads WHERE email = $1', [email]);
  return rows[0] ? rowToLead(rows[0]) : null;
}

async function insertLead(lead) {
  await pool.query(
    `INSERT INTO leads (id, name, email, phone, website, keyword, created_at, email_status, crawl_log_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET
       crawl_log_id = EXCLUDED.crawl_log_id,
       keyword = EXCLUDED.keyword,
       created_at = EXCLUDED.created_at`,
    [lead.id, lead.name, lead.email, lead.phone, lead.website, lead.keyword, lead.createdAt, lead.emailStatus, lead.crawlLogId || null]
  );
}

async function updateLeadPhone(id, phone) {
  await pool.query('UPDATE leads SET phone = $1 WHERE id = $2', [phone, id]);
}

async function updateLeadStatus(id, emailStatus) {
  await pool.query('UPDATE leads SET email_status = $1 WHERE id = $2', [emailStatus, id]);
}

async function clearLeads() {
  await pool.query('DELETE FROM leads');
}

async function getLogs() {
  const { rows } = await pool.query('SELECT * FROM crawl_logs ORDER BY "timestamp" ASC');
  return rows.map(rowToLog);
}

async function addLog(log) {
  await pool.query(
    `INSERT INTO crawl_logs (id, keyword, "timestamp", urls_count, new_leads_count)
     VALUES ($1, $2, $3, $4, $5)`,
    [log.id, log.keyword, log.timestamp, log.urlsCount, log.newLeadsCount]
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
  getLeads,
  findLeadByEmail,
  insertLead,
  updateLeadPhone,
  updateLeadStatus,
  clearLeads,
  getLogs,
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
