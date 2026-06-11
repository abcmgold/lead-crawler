require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  const dataFile = path.join(__dirname, '..', 'data.json');
  if (!fs.existsSync(dataFile)) {
    console.log('No data.json found, nothing to migrate.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const leads = data.leads || [];
  const logs = data.logs || [];

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    let leadsInserted = 0;
    for (const lead of leads) {
      const result = await client.query(
        `INSERT INTO leads (id, name, email, phone, website, keyword, created_at, email_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [lead.id, lead.name || '', lead.email, lead.phone || '', lead.website || '', lead.keyword || '', lead.createdAt, lead.emailStatus || 'Chưa gửi']
      );
      leadsInserted += result.rowCount;
    }

    let logsInserted = 0;
    for (const log of logs) {
      const result = await client.query(
        `INSERT INTO crawl_logs (id, keyword, "timestamp", urls_count, new_leads_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.keyword, log.timestamp, log.urlsCount || 0, log.newLeadsCount || 0]
      );
      logsInserted += result.rowCount;
    }

    console.log(`Migrated ${leadsInserted}/${leads.length} leads and ${logsInserted}/${logs.length} logs.`);
  } finally {
    await client.end();
  }
})();
