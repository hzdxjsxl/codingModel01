CREATE DATABASE IF NOT EXISTS workflow_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE workflow_db;

CREATE TABLE IF NOT EXISTS workflow_nodes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    node_type VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_edges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_id BIGINT NOT NULL,
    target_id BIGINT NOT NULL,
    INDEX idx_source (source_id),
    INDEX idx_target (target_id)
);
