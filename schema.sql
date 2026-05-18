-- Vercel Postgres > Query editor'a yapıştır ve çalıştır

CREATE TABLE IF NOT EXISTS invitees (
  token         TEXT        PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  salutation    TEXT        NOT NULL,
  phone         TEXT,
  status        TEXT,                        -- NULL | 'accepted' | 'declined'
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id            SERIAL      PRIMARY KEY,
  invitee_token TEXT        NOT NULL REFERENCES invitees(token) ON DELETE CASCADE,
  full_name     TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guests_token_idx ON guests (invitee_token);
CREATE INDEX IF NOT EXISTS invitees_status_idx ON invitees (status);

-- Yüklenen anılar (opsiyonel - sadece log amaçlı; gerçek dosyalar Drive'da)
CREATE TABLE IF NOT EXISTS memories (
  id            SERIAL      PRIMARY KEY,
  invitee_token TEXT        REFERENCES invitees(token) ON DELETE SET NULL,
  uploader_name TEXT        NOT NULL,
  drive_file_id TEXT        NOT NULL,
  drive_url     TEXT        NOT NULL,
  file_name     TEXT,
  file_type     TEXT,
  file_size     BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
