-- ==========================================
-- PHẦN SEED DATA (DỮ LIỆU MẪU)
-- ==========================================

-- 1. Seed bảng roles (Giữ nguyên vì ID là INT tự tăng)
INSERT INTO roles (name) VALUES
('admin'),
('analyst'),
('viewer')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed bảng attack_types (Cập nhật cho UUID)
INSERT INTO attack_types (id, name, description) VALUES
(gen_random_uuid(), 'DDoS', 'Distributed Denial of Service'),
(gen_random_uuid(), 'Brute Force', 'Repeated login attempts'),
(gen_random_uuid(), 'SQL Injection', 'Injection attack on database layer'),
(gen_random_uuid(), 'Port Scan', 'Reconnaissance through port scanning')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed bảng assets (Cập nhật cho UUID)
INSERT INTO assets (id, name, ip, lat, lng, description) VALUES
(gen_random_uuid(), 'Main Web Server', '192.168.1.10', 10.776900, 106.700900, 'Primary dashboard backend'),
(gen_random_uuid(), 'Database Server', '192.168.1.20', 10.776900, 106.700900, 'PostgreSQL instance'),
(gen_random_uuid(), 'API Gateway', '192.168.1.30', 10.776900, 106.700900, 'Gateway and routing layer')
ON CONFLICT (name) DO NOTHING;