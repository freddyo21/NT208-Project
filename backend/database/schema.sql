CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuidv7()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    unix_ts_ms BIGINT;
    rand BYTEA;
    rand_hex TEXT;
    variant_nibble TEXT;
BEGIN
    unix_ts_ms := FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    rand := gen_random_bytes(10);
    rand_hex := encode(rand, 'hex');
    variant_nibble := substr('89ab', (get_byte(rand, 2) & 3) + 1, 1);

    RETURN (
        lpad(to_hex(unix_ts_ms), 12, '0') ||
        '7' || substr(rand_hex, 1, 3) ||
        variant_nibble || substr(rand_hex, 4, 3) ||
        substr(rand_hex, 7, 12)
    )::UUID;
END;
$$;

DO $$
BEGIN
    CREATE TYPE attack_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS roles (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES
('admin'),
('operator')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION default_user_role_id()
RETURNS INT
LANGUAGE sql
STABLE
AS $$
    SELECT id
    FROM roles
    WHERE name = 'operator'
    LIMIT 1
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL DEFAULT default_user_role_id(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS assets (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip INET NOT NULL,
    lat DECIMAL(9,6) NOT NULL,
    lng DECIMAL(9,6) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attack_types (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS attack_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    source_ip INET NOT NULL,
    dest_ip INET NOT NULL,
    dest_asset_id INT NOT NULL,
    attack_type_id INT NOT NULL,
    severity attack_severity NOT NULL,
    lat DECIMAL(9,6),
    lng DECIMAL(9,6),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_attack_events_asset
        FOREIGN KEY (dest_asset_id) REFERENCES assets(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_attack_events_type
        FOREIGN KEY (attack_type_id) REFERENCES attack_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_attack_timestamp
    ON attack_events ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_attack_severity
    ON attack_events (severity);

CREATE TABLE IF NOT EXISTS attack_logs (
    event_id UUID PRIMARY KEY,
    payload TEXT,
    protocol VARCHAR(20),
    CONSTRAINT fk_attack_logs_event
        FOREIGN KEY (event_id) REFERENCES attack_events(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
