CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    CREATE TYPE attack_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS roles (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Đổi id thành UUID theo ERD
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    ip INET NOT NULL,
    lat DECIMAL(9,6) NOT NULL,
    lng DECIMAL(9,6) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Đổi id thành UUID theo ERD
CREATE TABLE IF NOT EXISTS attack_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS attack_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ip INET NOT NULL,
    dest_ip INET NOT NULL,
    dest_asset_id UUID NOT NULL, -- Đổi sang UUID để khớp với assets.id
    attack_type_id UUID NOT NULL, -- Đổi sang UUID để khớp với attack_types.id
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

CREATE TABLE IF NOT EXISTS attack_logs (
    event_id UUID PRIMARY KEY,
    payload TEXT,
    protocol VARCHAR(20),
    CONSTRAINT fk_attack_logs_event
        FOREIGN KEY (event_id) REFERENCES attack_events(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Seed data mẫu (Vẫn giữ nguyên vì UUID sẽ được tự động generate)
INSERT INTO roles (name) VALUES
('admin'),
('analyst'),
('viewer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO attack_types (name, description) VALUES
('DDoS', 'Distributed Denial of Service'),
('Brute Force', 'Repeated login attempts'),
('SQL Injection', 'Injection attack on database layer'),
('Port Scan', 'Reconnaissance through port scanning')
ON CONFLICT (name) DO NOTHING;

INSERT INTO assets (name, ip, lat, lng, description) VALUES
('Main Web Server', '192.168.1.10', 10.776900, 106.700900, 'Primary dashboard backend'),
('Database Server', '192.168.1.20', 10.776900, 106.700900, 'PostgreSQL instance'),
('API Gateway', '192.168.1.30', 10.776900, 106.700900, 'Gateway and routing layer');