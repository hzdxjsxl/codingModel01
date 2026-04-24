import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const authApi = {
  login(username, password) {
    return api.post('/auth/login', { username, password })
  },
  
  register(username, password) {
    return api.post('/auth/register', { username, password })
  }
}

export const userApi = {
  getAllUsers() {
    return api.get('/users')
  },
  
  getUserById(id) {
    return api.get(`/users/${id}`)
  },
  
  getUserByUsername(username) {
    return api.get(`/users/username/${username}`)
  }
}

export default api
