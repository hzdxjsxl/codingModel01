import { createRouter, createWebHistory } from 'vue-router'
import { getPermissions } from '@/api/auth'
import { buildMenuTree, buildAsyncRoutes } from '@/utils/permission'

const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

let asyncRoutesAdded = false

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    if (token) {
      next({ path: '/' })
    } else {
      next()
    }
    return
  }
  
  if (!token) {
    next({ path: '/login' })
    return
  }
  
  if (!asyncRoutesAdded) {
    try {
      const res = await getPermissions()
      const flatPermissions = res.data
      
      const menuTree = buildMenuTree(flatPermissions)
      const asyncRoutes = buildAsyncRoutes(menuTree)
      
      asyncRoutes.forEach(route => {
        router.addRoute(route)
      })
      
      router.addRoute({
        path: '/:pathMatch(.*)*',
        redirect: '/404'
      })
      
      asyncRoutesAdded = true
      
      next({ ...to, replace: true })
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      next({ path: '/login' })
    }
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title + ' - RBAC权限管理系统'
  } else {
    document.title = 'RBAC权限管理系统'
  }
})

export function resetRouter() {
  asyncRoutesAdded = false
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })
  router.matcher = newRouter.matcher
  asyncRoutesAdded = false
}

export default router