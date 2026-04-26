import axios from 'axios'
import { getMockWorkflowData } from './mockData'

const MOCK_DELAY_MS = 500

const MOCK_WORKFLOW_DATA = Object.freeze({
  nodes: [
    { id: 1, name: '数据源读取', description: '从MySQL读取原始用户行为数据', nodeType: 'DATA_SOURCE' },
    { id: 2, name: '数据清洗', description: '去除空值、重复数据和异常值', nodeType: 'CLEANING' },
    { id: 3, name: '数据转换', description: '格式转换、字段映射和类型转换', nodeType: 'TRANSFORM' },
    { id: 4, name: '用户行为分析', description: '统计用户点击、浏览、转化等行为指标', nodeType: 'ANALYSIS' },
    { id: 5, name: '画像标签生成', description: '基于行为数据生成用户画像标签', nodeType: 'ANALYSIS' },
    { id: 6, name: '数据合并', description: '合并多个分析结果，生成完整数据集', nodeType: 'MERGE' },
    { id: 7, name: '数据导出', description: '导出结果到数据仓库和报表系统', nodeType: 'EXPORT' }
  ],
  edges: [
    { id: 1, sourceId: 1, targetId: 2 },
    { id: 2, sourceId: 2, targetId: 3 },
    { id: 3, sourceId: 3, targetId: 4 },
    { id: 4, sourceId: 3, targetId: 5 },
    { id: 5, sourceId: 4, targetId: 6 },
    { id: 6, sourceId: 5, targetId: 6 },
    { id: 7, sourceId: 6, targetId: 7 }
  ]
})

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createMockResponse(data) {
  return {
    data,
    status: 200,
    statusText: 'OK (Mock)',
    headers: {},
    config: {}
  }
}

function validateWorkflowData(data) {
  if (!data || typeof data !== 'object') {
    return false
  }
  if (!Array.isArray(data.nodes)) {
    return false
  }
  if (!Array.isArray(data.edges)) {
    return false
  }
  return data.nodes.length > 0
}

function getFallbackMockData() {
  return {
    nodes: [...MOCK_WORKFLOW_DATA.nodes],
    edges: [...MOCK_WORKFLOW_DATA.edges]
  }
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    config._requestStart = Date.now()
    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config._requestStart || 0)
    console.log(`[API] Response: ${response.status} (${duration}ms)`)
    
    if (!validateWorkflowData(response.data)) {
      console.warn('[API] Response data is invalid, falling back to mock')
      return createMockResponse(getFallbackMockData())
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    console.warn(`[API] Request failed: ${error.message}, using fallback Mock data`)

    if (originalRequest) {
      if (originalRequest.url?.includes('/workflow')) {
        await delay(MOCK_DELAY_MS)
        const mockData = getFallbackMockData()
        console.log('[Mock] Returning fallback mock data:', {
          nodeCount: mockData.nodes.length,
          edgeCount: mockData.edges.length
        })
        return createMockResponse(mockData)
      }
    }

    console.error('[API] No fallback available for this request')
    return Promise.reject(error)
  }
)

export const workflowApi = {
  async getWorkflow() {
    console.log('[workflowApi] getWorkflow - attempting to fetch from backend...')
    
    try {
      const response = await api.get('/workflow')
      const data = response.data
      
      if (validateWorkflowData(data)) {
        console.log('[workflowApi] Received valid data from backend')
        return data
      }
      
      console.warn('[workflowApi] Backend returned invalid data, using fallback')
      await delay(MOCK_DELAY_MS)
      return getFallbackMockData()
    } catch (error) {
      console.warn('[workflowApi] Failed to fetch from backend:', error.message)
      console.log('[workflowApi] Using fallback mock data')
      
      await delay(MOCK_DELAY_MS)
      const mockData = getFallbackMockData()
      
      console.log('[workflowApi] Returning mock data:', {
        nodeCount: mockData.nodes.length,
        edgeCount: mockData.edges.length
      })
      
      return mockData
    }
  },

  async saveWorkflow(data) {
    console.log('[workflowApi] saveWorkflow - attempting to save to backend...')
    
    try {
      const response = await api.post('/workflow', data)
      return response.data
    } catch (error) {
      console.warn('[workflowApi] Failed to save to backend:', error.message)
      console.log('[workflowApi] Save operation simulated (mock mode)')
      return data
    }
  }
}

export default api
