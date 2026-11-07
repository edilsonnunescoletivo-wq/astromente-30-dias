-- AstroMente v3 — banco exclusivo do app, nunca executar em bases de outros projetos.
CREATE TABLE IF NOT EXISTS astro_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS astro_sessions (
  token_hash text PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES astro_families(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS astro_sessions_family_idx ON astro_sessions(family_id);
CREATE TABLE IF NOT EXISTS astro_family_games (
  family_id uuid PRIMARY KEY REFERENCES astro_families(id) ON DELETE CASCADE,
  state jsonb,
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS astro_auth_limits (
  email_hash text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  window_started timestamptz NOT NULL DEFAULT NOW()
);
