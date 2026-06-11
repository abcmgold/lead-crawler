CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_status TEXT NOT NULL DEFAULT 'Chưa gửi',
  crawl_log_id TEXT
);

CREATE TABLE IF NOT EXISTS crawl_logs (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  urls_count INTEGER NOT NULL DEFAULT 0,
  new_leads_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN'
);

CREATE TABLE IF NOT EXISTS smtp_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  host TEXT NOT NULL DEFAULT '',
  port TEXT NOT NULL DEFAULT '',
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_pass TEXT NOT NULL DEFAULT '',
  secure BOOLEAN NOT NULL DEFAULT false,
  sender_name TEXT NOT NULL DEFAULT '',
  sender_email TEXT NOT NULL DEFAULT '',
  CONSTRAINT smtp_settings_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
