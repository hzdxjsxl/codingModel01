CREATE DATABASE IF NOT EXISTS simcity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE simcity;

CREATE TABLE IF NOT EXISTS map_tiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    x_coord INT NOT NULL,
    y_coord INT NOT NULL,
    elevation DOUBLE NOT NULL,
    building_type_id INT NOT NULL,
    INDEX idx_xy (x_coord, y_coord)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
