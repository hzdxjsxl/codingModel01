export const mockNodes = [
  {
    id: 1,
    name: '数据源读取',
    description: '从MySQL读取原始用户行为数据',
    nodeType: 'DATA_SOURCE'
  },
  {
    id: 2,
    name: '数据清洗',
    description: '去除空值、重复数据和异常值',
    nodeType: 'CLEANING'
  },
  {
    id: 3,
    name: '数据转换',
    description: '格式转换、字段映射和类型转换',
    nodeType: 'TRANSFORM'
  },
  {
    id: 4,
    name: '用户行为分析',
    description: '统计用户点击、浏览、转化等行为指标',
    nodeType: 'ANALYSIS'
  },
  {
    id: 5,
    name: '画像标签生成',
    description: '基于行为数据生成用户画像标签',
    nodeType: 'ANALYSIS'
  },
  {
    id: 6,
    name: '数据合并',
    description: '合并多个分析结果，生成完整数据集',
    nodeType: 'MERGE'
  },
  {
    id: 7,
    name: '数据导出',
    description: '导出结果到数据仓库和报表系统',
    nodeType: 'EXPORT'
  }
]

export const mockEdges = [
  { id: 1, sourceId: 1, targetId: 2 },
  { id: 2, sourceId: 2, targetId: 3 },
  { id: 3, sourceId: 3, targetId: 4 },
  { id: 4, sourceId: 3, targetId: 5 },
  { id: 5, sourceId: 4, targetId: 6 },
  { id: 6, sourceId: 5, targetId: 6 },
  { id: 7, sourceId: 6, targetId: 7 }
]

export const cyclicNodes = [
  { id: 1, name: '节点A', description: '测试节点', nodeType: 'DATA_SOURCE' },
  { id: 2, name: '节点B', description: '测试节点', nodeType: 'CLEANING' },
  { id: 3, name: '节点C', description: '测试节点', nodeType: 'TRANSFORM' }
]

export const cyclicEdges = [
  { id: 1, sourceId: 1, targetId: 2 },
  { id: 2, sourceId: 2, targetId: 3 },
  { id: 3, sourceId: 3, targetId: 1 }
]

export const mockWorkflowData = {
  nodes: mockNodes,
  edges: mockEdges
}

export const cyclicWorkflowData = {
  nodes: cyclicNodes,
  edges: cyclicEdges
}

export const getMockWorkflowData = () => {
  return {
    nodes: [...mockNodes],
    edges: [...mockEdges]
  }
}

export const getCyclicWorkflowData = () => {
  return {
    nodes: [...cyclicNodes],
    edges: [...cyclicEdges]
  }
}
