-- Seed script for roles and admin user
-- Run this script to set up the initial admin role and user

-- Insert admin role if it doesn't exist
INSERT INTO roles (name, created_at, updated_at)
VALUES ('admin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create default admin user if it doesn't exist
-- Password: admin123 (hashed with sha256)
INSERT INTO users (username, password_hash, status, created_at, updated_at)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ACTIVE', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Create a sample employee linked to admin user (optional)
INSERT INTO employees (code, name, designation, status, user_id, created_at, updated_at)
SELECT 'EMP-ADMIN', 'System Administrator', 'OFFICE_STAFF', 'ACTIVE', u.id, NOW(), NOW()
FROM users u
WHERE u.username = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = u.id
);

-- Output for verification
\echo 'Admin setup completed!'
\echo 'Default admin credentials:'
\echo 'Username: admin'
\echo 'Password: admin123'
\echo 'IMPORTANT: Change the default password after first login!'
