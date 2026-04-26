USE workflow_db;

INSERT INTO workflow_nodes (id, name, description, node_type) VALUES
(1, '数据源读取', '从MySQL读取原始数据', 'DATA_SOURCE'),
(2, '数据清洗', '去除空值和重复数据', 'CLEANING'),
(3, '数据转换', '格式转换和字段映射', 'TRANSFORM'),
(4, '数据分析A', '统计分析模块A', 'ANALYSIS'),
(5, '数据分析B', '统计分析模块B', 'ANALYSIS'),
(6, '数据合并', '合并多个分析结果', 'MERGE'),
(7, '数据导出', '导出结果到目标位置', 'EXPORT');

INSERT INTO workflow_edges (id, source_id, target_id) VALUES
(1, 1, 2),
(2, 2, 3),
(3, 3, 4),
(4, 3, 5),
(5, 4, 6),
(6, 5, 6),
(7, 6, 7);
