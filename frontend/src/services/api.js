import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const workflowApi = {
  async getWorkflow() {
    const response = await api.get('/workflow')
    return response.data
  },

  async saveWorkflow(data) {
    const response = await api.post('/workflow', data)
    return response.data
  }
}

export default api
