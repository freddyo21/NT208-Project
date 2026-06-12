-- ==========================================
-- Seed data
-- ==========================================

INSERT INTO roles (name) VALUES
('admin'),
('operator')
ON CONFLICT (name) DO NOTHING;

INSERT INTO attack_types (name, description) VALUES
('DDoS', 'Distributed Denial of Service'),
('Brute Force', 'Repeated login attempts'),
('SQL Injection', 'Injection attack on database layer'),
('Port Scan', 'Reconnaissance through port scanning')
ON CONFLICT (name) DO NOTHING;

INSERT INTO assets (name, ip, lat, lng, description)
SELECT v.name, v.ip::INET, v.lat, v.lng, v.description
FROM (
    VALUES
        ('Main Web Server', '192.168.1.10', 10.776900, 106.700900, 'Primary dashboard backend'),
        ('Database Server', '192.168.1.20', 10.776900, 106.700900, 'PostgreSQL instance'),
        ('API Gateway', '192.168.1.30', 10.776900, 106.700900, 'Gateway and routing layer')
) AS v(name, ip, lat, lng, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM assets a
    WHERE a.name = v.name
);
