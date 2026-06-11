require('dotenv').config();

const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const username = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const role = process.env.ADMIN_ROLE || 'ADMIN';

    if (username && passwordHash) {
      const result = await client.query(
        `INSERT INTO users (id, username, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING`,
        ['_' + Math.random().toString(36).substr(2, 9), username, passwordHash, role]
      );
      console.log(result.rowCount > 0
        ? `Seeded admin user "${username}".`
        : `User "${username}" already exists, skipped.`);
    } else {
      console.log('No ADMIN_USERNAME/ADMIN_PASSWORD_HASH found in .env, skipping user seed.');
    }

    const result = await client.query(
      `INSERT INTO smtp_settings (id, host, port, smtp_user, smtp_pass, secure, sender_name, sender_email)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        process.env.SMTP_HOST || '',
        process.env.SMTP_PORT || '',
        process.env.SMTP_USER || '',
        process.env.SMTP_PASS || '',
        process.env.SMTP_SECURE === 'true',
        process.env.SMTP_SENDER_NAME || '',
        process.env.SMTP_SENDER_EMAIL || ''
      ]
    );
    console.log(result.rowCount > 0
      ? 'Seeded SMTP settings.'
      : 'SMTP settings already exist, skipped.');
  } finally {
    await client.end();
  }
})();
