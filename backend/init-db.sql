-- 创建数据库
CREATE DATABASE IF NOT EXISTS undo_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE undo_system;

-- 创建items表（JPA会自动创建，此脚本作为备用）
CREATE TABLE IF NOT EXISTS items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入一些测试数据
INSERT INTO items (name, category, is_deleted, created_at, updated_at)
VALUES 
('项目一', '工作', FALSE, NOW(), NOW()),
('项目二', '生活', FALSE, NOW(), NOW()),
('项目三', '学习', FALSE, NOW(), NOW());
