require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const [, , username, password, role = 'ADMIN'] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/create-admin.js <username> <password> [role]');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    await client.query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      ['_' + Math.random().toString(36).substr(2, 9), username, passwordHash, role]
    );
    console.log(`Admin user "${username}" created/updated.`);

    await client.query('INSERT INTO smtp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
  } finally {
    await client.end();
  }
})();
