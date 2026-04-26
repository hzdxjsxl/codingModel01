import request from './request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function getUserInfo() {
  return request({
    url: '/auth/user-info',
    method: 'get'
  })
}

export function getPermissions() {
  return request({
    url: '/auth/permissions',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}