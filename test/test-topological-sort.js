import { topologicalSort } from '../frontend/src/utils/topologicalSort.js';

const testNodes = [
  { id: 1, name: '数据源读取', description: '从MySQL读取原始数据', nodeType: 'DATA_SOURCE' },
  { id: 2, name: '数据清洗', description: '去除空值和重复数据', nodeType: 'CLEANING' },
  { id: 3, name: '数据转换', description: '格式转换和字段映射', nodeType: 'TRANSFORM' },
  { id: 4, name: '数据分析A', description: '统计分析模块A', nodeType: 'ANALYSIS' },
  { id: 5, name: '数据分析B', description: '统计分析模块B', nodeType: 'ANALYSIS' },
  { id: 6, name: '数据合并', description: '合并多个分析结果', nodeType: 'MERGE' },
  { id: 7, name: '数据导出', description: '导出结果到目标位置', nodeType: 'EXPORT' }
];

const testEdges = [
  { id: 1, sourceId: 1, targetId: 2 },
  { id: 2, sourceId: 2, targetId: 3 },
  { id: 3, sourceId: 3, targetId: 4 },
  { id: 4, sourceId: 3, targetId: 5 },
  { id: 5, sourceId: 4, targetId: 6 },
  { id: 6, sourceId: 5, targetId: 6 },
  { id: 7, sourceId: 6, targetId: 7 }
];

console.log('=== 测试1: 正常DAG拓扑排序 ===');
const result1 = topologicalSort(testNodes, testEdges);
console.log('是否有环:', result1.hasCycle);
if (!result1.hasCycle) {
  console.log('执行层级:');
  result1.levels.forEach(level => {
    console.log(`  层级 ${level.level}: ${level.nodes.map(n => n.name).join(', ')}`);
  });
}

console.log('\n=== 测试2: 有环的图 ===');
const cyclicEdges = [
  ...testEdges,
  { id: 100, sourceId: 7, targetId: 1 }
];
const result2 = topologicalSort(testNodes, cyclicEdges);
console.log('是否有环:', result2.hasCycle);
if (result2.hasCycle) {
  console.log('检测到的循环路径:', result2.cycle.map(id => testNodes.find(n => n.id === id)?.name || id).join(' → '));
}

console.log('\n=== 测试3: 空图 ===');
const result3 = topologicalSort([], []);
console.log('是否有环:', result3.hasCycle);
console.log('层级数:', result3.levels?.length || 0);

console.log('\n=== 所有测试完成 ===');
