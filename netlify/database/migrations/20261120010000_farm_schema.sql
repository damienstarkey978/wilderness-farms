CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS signups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  address_flag TEXT NOT NULL,
  address_note TEXT NOT NULL,
  dozens INTEGER NOT NULL,
  cadence TEXT NOT NULL,
  weekday TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_cents INTEGER,
  stripe_session_id TEXT,
  pending_expires_at TEXT,
  fulfilled_at TEXT,
  canceled_at TEXT,
  zip TEXT NOT NULL DEFAULT '',
  consent INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS signups_weekday_status ON signups (weekday, status);

CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  occurred_on TEXT NOT NULL,
  direction TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  payee TEXT,
  week_start TEXT
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  signup_id TEXT NOT NULL,
  delivered_on TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (signup_id, delivered_on)
);

CREATE TABLE IF NOT EXISTS route_order (
  weekday TEXT NOT NULL,
  signup_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (weekday, signup_id)
);

CREATE TABLE IF NOT EXISTS day_tasks (
  work_date TEXT NOT NULL,
  task TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  PRIMARY KEY (work_date, task)
);

CREATE TABLE IF NOT EXISTS stop_progress (
  work_date TEXT NOT NULL,
  signup_id TEXT NOT NULL,
  state TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (work_date, signup_id)
);

GRANT USAGE ON SCHEMA public TO netlifydb_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO netlifydb_readonly;
