require('dotenv').config();

const { Client } = require('pg');

const VALID_PHONE_REGEX = /^0\d{9}$/;

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'leads'`
    );
    if (tableCheck.rowCount === 0) {
      console.log('No "leads" table found, nothing to migrate.');
      return;
    }

    const { rows: leads } = await client.query('SELECT * FROM leads');

    let emailsInserted = 0;
    let phonesInserted = 0;

    for (const lead of leads) {
      const emailResult = await client.query(
        `INSERT INTO lead_emails (id, email, name, website, keyword, created_at, email_status, crawl_log_id, url_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
         ON CONFLICT (email) DO NOTHING`,
        [lead.id, lead.email, lead.name || '', lead.website || '', lead.keyword || '', lead.created_at, lead.email_status || 'Chưa gửi', lead.crawl_log_id]
      );
      emailsInserted += emailResult.rowCount;

      const phones = [...new Set(
        (lead.phone || '')
          .split(',')
          .map(p => p.trim().replace(/[\s.-]/g, ''))
          .filter(p => VALID_PHONE_REGEX.test(p))
      )];

      for (const phone of phones) {
        const phoneResult = await client.query(
          `INSERT INTO lead_phones (id, phone, name, website, keyword, created_at, crawl_log_id, url_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
           ON CONFLICT (phone) DO NOTHING`,
          ['_' + Math.random().toString(36).substr(2, 9), phone, lead.name || '', lead.website || '', lead.keyword || '', lead.created_at, lead.crawl_log_id]
        );
        phonesInserted += phoneResult.rowCount;
      }
    }

    await client.query('DROP TABLE leads');

    console.log(`Migrated ${emailsInserted}/${leads.length} emails and ${phonesInserted} phones. Dropped "leads" table.`);
  } finally {
    await client.end();
  }
})();
