-- Migration 001: Create clips table
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  password TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_id ON clips(user_id);
