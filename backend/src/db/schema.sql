CREATE TABLE IF NOT EXISTS crawl_logs (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  urls_count INTEGER NOT NULL DEFAULT 0,
  new_leads_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS new_emails_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS new_phones_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS new_socials_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS crawled_urls (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  crawl_log_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_emails (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_status TEXT NOT NULL DEFAULT 'Chưa gửi',
  crawl_log_id TEXT,
  url_id TEXT
);

CREATE TABLE IF NOT EXISTS lead_phones (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  crawl_log_id TEXT,
  url_id TEXT
);

CREATE TABLE IF NOT EXISTS lead_socials (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  crawl_log_id TEXT,
  url_id TEXT,
  UNIQUE(platform, url)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  needs_password_change BOOLEAN NOT NULL DEFAULT true
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
