import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '../api'

const LOGIN_ATTEMPTS_KEY = 'login_attempts'
const LOGIN_LOCK_TIME_KEY = 'login_lock_time'
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION = 15 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const allUsers = ref([])
  const isAuthenticated = ref(false)
  
  const loginAttempts = ref(parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0'))
  const loginLockTime = ref(parseInt(localStorage.getItem(LOGIN_LOCK_TIME_KEY) || '0'))
  
  const isLocked = computed(() => {
    if (loginLockTime.value === 0) return false
    const currentTime = Date.now()
    const isStillLocked = (currentTime - loginLockTime.value) < LOCK_DURATION
    
    if (!isStillLocked) {
      resetLoginAttempts()
    }
    
    return isStillLocked
  })
  
  const remainingLockTime = computed(() => {
    if (!isLocked.value) return 0
    const elapsed = Date.now() - loginLockTime.value
    return Math.max(0, LOCK_DURATION - elapsed)
  })
  
  const remainingAttempts = computed(() => {
    return Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts.value)
  })
  
  const isAdmin = computed(() => {
    return currentUser.value?.role === 'ADMIN'
  })
  
  async function login(username, password) {
    if (isLocked.value) {
      throw new Error(`账号已被锁定，请在 ${Math.ceil(remainingLockTime.value / 1000)} 秒后重试`)
    }
    
    const response = await authApi.login(username, password)
    const data = response.data
    
    if (data.success) {
      currentUser.value = data.user
      isAuthenticated.value = true
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      resetLoginAttempts()
      return data
    } else {
      incrementLoginAttempts()
      throw new Error(data.message || '登录失败')
    }
  }
  
  async function register(username, password) {
    const response = await authApi.register(username, password)
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.message || '注册失败')
    }
    
    return data
  }
  
  async function getAllUsers() {
    const response = await userApi.getAllUsers()
    const data = response.data
    
    if (data.success) {
      allUsers.value = data.users
      return data.users
    } else {
      throw new Error(data.message || '获取用户列表失败')
    }
  }
  
  async function getUserById(id) {
    const response = await userApi.getUserById(id)
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.message || '获取用户信息失败')
    }
    
    return data.user
  }
  
  function logout() {
    currentUser.value = null
    isAuthenticated.value = false
    allUsers.value = []
    localStorage.removeItem('currentUser')
  }
  
  function incrementLoginAttempts() {
    loginAttempts.value++
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, loginAttempts.value.toString())
    
    if (loginAttempts.value >= MAX_LOGIN_ATTEMPTS) {
      loginLockTime.value = Date.now()
      localStorage.setItem(LOGIN_LOCK_TIME_KEY, loginLockTime.value.toString())
    }
  }
  
  function resetLoginAttempts() {
    loginAttempts.value = 0
    loginLockTime.value = 0
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
    localStorage.removeItem(LOGIN_LOCK_TIME_KEY)
  }
  
  function restoreSession() {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser)
        isAuthenticated.value = true
      } catch (e) {
        localStorage.removeItem('currentUser')
      }
    }
  }
  
  return {
    currentUser,
    allUsers,
    isAuthenticated,
    loginAttempts,
    loginLockTime,
    isLocked,
    remainingLockTime,
    remainingAttempts,
    isAdmin,
    login,
    register,
    getAllUsers,
    getUserById,
    logout,
    resetLoginAttempts,
    restoreSession
  }
})
