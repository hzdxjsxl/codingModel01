import axios from 'axios'
import { getMockWorkflowData } from './mockData'

const USE_MOCK = true
const MOCK_DELAY_MS = 500

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

function createMockResponse(data) {
  return {
    data,
    status: 200,
    statusText: 'OK (Mock)',
    headers: {},
    config: {}
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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
    return response
  },
  async (error) => {
    const originalRequest = error.config
    console.warn(`[API] Request failed: ${error.message}, fallback to Mock data`)

    if (originalRequest) {
      if (originalRequest.url?.includes('/workflow')) {
        if (originalRequest.method === 'get') {
          await delay(MOCK_DELAY_MS)
          const mockData = getMockWorkflowData()
          console.log('[Mock] Returning mock workflow data:', mockData)
          return createMockResponse(mockData)
        }
        if (originalRequest.method === 'post') {
          await delay(MOCK_DELAY_MS)
          const savedData = originalRequest.data
          console.log('[Mock] Saved mock workflow data:', savedData)
          return createMockResponse(savedData)
        }
      }
    }

    return Promise.reject(error)
  }
)

export const mockApi = {
  async getWorkflow() {
    await delay(MOCK_DELAY_MS)
    const data = getMockWorkflowData()
    console.log('[Mock API] getWorkflow:', data)
    return data
  },

  async saveWorkflow(data) {
    await delay(MOCK_DELAY_MS)
    console.log('[Mock API] saveWorkflow:', data)
    return data
  }
}

export const workflowApi = {
  async getWorkflow() {
    if (USE_MOCK) {
      return await mockApi.getWorkflow()
    }
    try {
      const response = await api.get('/workflow')
      return response.data
    } catch (error) {
      console.warn('[API] Fallback to mock on error')
      return await mockApi.getWorkflow()
    }
  },

  async saveWorkflow(data) {
    if (USE_MOCK) {
      return await mockApi.saveWorkflow(data)
    }
    try {
      const response = await api.post('/workflow', data)
      return response.data
    } catch (error) {
      console.warn('[API] Fallback to mock on error')
      return await mockApi.saveWorkflow(data)
    }
  }
}

export { USE_MOCK, MOCK_DELAY_MS }
export default api
