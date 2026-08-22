-- ============================================
-- Centralised Campus Problem Reporting Platform
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS campus_reporting;
USE campus_reporting;

-- ============================================
-- TABLE: users
-- Stores students, admins, and staff
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'staff') NOT NULL DEFAULT 'student',
    department_id INT NULL,          -- only used when role = 'staff'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: departments
-- Departments that handle complaints
-- ============================================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Now that 'departments' exists, link 'users.department_id' to it
ALTER TABLE users
    ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL;

-- ============================================
-- TABLE: complaints
-- Core table: one row per submitted complaint
-- ============================================
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_code VARCHAR(20) NOT NULL UNIQUE,   -- e.g. CMP001
    
    student_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    image_path VARCHAR(255) NULL,
    status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
    assigned_department_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaints_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_complaints_department
        FOREIGN KEY (assigned_department_id) REFERENCES departments(id)
        ON DELETE SET NULL
);

-- ============================================
-- TABLE: assignments
-- Tracks which staff member is handling which complaint
-- ============================================
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    staff_id INT NOT NULL,
    assigned_by_admin_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_staff
        FOREIGN KEY (staff_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_admin
        FOREIGN KEY (assigned_by_admin_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLE: complaint_updates
-- History log of every status change / remark
-- ============================================
CREATE TABLE complaint_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    old_status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected') NULL,
    new_status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected') NOT NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_updates_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_updates_user
        FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================
-- SEED DATA: default departments
-- ============================================
INSERT INTO departments (name) VALUES
    ('Electrical Department'),
    ('Maintenance Department'),
    ('IT Department'),
    ('Housekeeping Department'),
    ('Security Department');