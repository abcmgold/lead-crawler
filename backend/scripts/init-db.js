require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function ensureDatabaseExists() {
  const url = new URL(process.env.DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, '');

  const adminUrl = new URL(process.env.DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database "${dbName}"`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }
  } finally {
    await client.end();
  }
}

async function applySchema() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema applied successfully');
  } finally {
    await client.end();
  }
}

(async () => {
  try {
    await ensureDatabaseExists();
    await applySchema();
  } catch (err) {
    console.error('Init DB failed:', err.message);
    process.exit(1);
  }
})();
