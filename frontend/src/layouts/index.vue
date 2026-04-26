<template>
  <div class="layout-container">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <el-icon v-if="isCollapsed"><Menu /></el-icon>
        <span v-else>RBAC管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <template v-for="menu in visibleMenuTree" :key="menu.id">
          <template v-if="menu.children && menu.children.length > 0">
            <el-sub-menu :index="menu.path">
              <template #title>
                <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
                <span>{{ menu.name }}</span>
              </template>
              <el-menu-item
                v-for="child in menu.children"
                :key="child.id"
                :index="child.path"
              >
                <el-icon v-if="child.icon"><component :is="getIconComponent(child.icon)" /></el-icon>
                <span>{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
            <template #title>{{ menu.name }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>
    <div class="main-container">
      <header class="header">
        <div class="header-left">
          <div class="collapse-btn" @click="toggleCollapse">
            <el-icon v-if="isCollapsed"><Expand /></el-icon>
            <el-icon v-else><Fold /></el-icon>
          </div>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="user-name">{{ userInfo.realName || userInfo.username }}</span>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Menu, Expand, Fold, User,
  Setting, Home, DataAnalysis, 
  Document, UserFilled, Menu as MenuIcon
} from '@element-plus/icons-vue'
import { getPermissions, logout } from '@/api/auth'
import { buildMenuTree, filterVisibleMenus } from '@/utils/permission'
import { resetRouter } from '@/router'

const route = useRoute()
const router = useRouter()

const isCollapsed = ref(false)
const menuTree = ref([])
const userInfo = ref({})

const activeMenu = computed(() => {
  return route.path
})

const visibleMenuTree = computed(() => {
  return filterVisibleMenus(menuTree.value)
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

const getIconComponent = (iconName) => {
  if (!iconName) return 'Document'
  const iconMap = {
    'el-icon-setting': 'Setting',
    'el-icon-s-home': 'Home',
    'el-icon-s-data': 'DataAnalysis',
    'el-icon-user': 'UserFilled',
    'el-icon-s-custom': 'User',
    'el-icon-menu': 'MenuIcon',
    'el-icon-s-marketing': 'DataAnalysis',
    'el-icon-s-order': 'Document'
  }
  return iconMap[iconName] || 'Document'
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const loadUserPermissions = async () => {
  try {
    const res = await getPermissions()
    const flatPermissions = res.data
    menuTree.value = buildMenuTree(flatPermissions)
  } catch (error) {
    console.error('加载权限失败:', error)
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await logout()
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      resetRouter()
      router.push('/login')
      ElMessage.success('退出成功')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('退出失败:', error)
      }
    }
  }
}

onMounted(() => {
  const savedUserInfo = localStorage.getItem('userInfo')
  if (savedUserInfo) {
    userInfo.value = JSON.parse(savedUserInfo)
  }
  loadUserPermissions()
})
</script>

<style scoped>
.layout-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 210px;
  background-color: #304156;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5f;
  overflow: hidden;
  white-space: nowrap;
}

.logo .el-icon {
  font-size: 24px;
}

.sidebar.collapsed .logo span {
  display: none;
}

.sidebar :deep(.el-menu) {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.sidebar :deep(.el-menu--collapse) {
  width: 64px;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow: hidden;
}

.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 15px;
  font-size: 18px;
  color: #606266;
  transition: background-color 0.3s;
}

.collapse-btn:hover {
  background-color: #f5f7fa;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-name {
  margin-right: 15px;
  color: #606266;
  font-size: 14px;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.user-avatar {
  background-color: #409eff;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>