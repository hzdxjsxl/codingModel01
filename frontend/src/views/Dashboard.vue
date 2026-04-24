<template>
  <div class="dashboard-container">
    <el-header class="dashboard-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="24" color="#409EFF">
            <Monitor />
          </el-icon>
          <span class="title">用户管理系统</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              {{ currentUser.username }}
              <el-tag :type="isAdmin ? 'danger' : 'primary'" size="small" style="margin-left: 8px">
                {{ isAdmin ? '超级管理员' : '普通用户' }}
              </el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <el-main class="dashboard-main">
      <el-card class="welcome-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>欢迎回来，{{ currentUser.username }}！</h3>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="isAdmin ? 'danger' : 'primary'">
              {{ isAdmin ? '超级管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDate(currentUser.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <el-card v-if="isAdmin" class="users-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>所有注册用户列表</h3>
            <el-button type="primary" :icon="Refresh" @click="loadAllUsers">刷新</el-button>
          </div>
        </template>
        
        <el-table :data="allUsers" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="180" />
          <el-table-column prop="role" label="角色" width="150">
            <template #default="scope">
              <el-tag :type="scope.row.role === 'ADMIN' ? 'danger' : 'primary'" size="small">
                {{ scope.row.role === 'ADMIN' ? '超级管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="200">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="200">
            <template #default="scope">
              {{ formatDate(scope.row.updatedAt) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="user-stats" v-if="allUsers.length > 0">
          <el-statistic title="总用户数" :value="allUsers.length">
            <template #suffix>
              <span class="stat-suffix">人</span>
            </template>
          </el-statistic>
          <el-divider direction="vertical" />
          <el-statistic title="管理员数" :value="adminCount" value-style="color: #F56C6C">
            <template #suffix>
              <span class="stat-suffix">人</span>
            </template>
          </el-statistic>
          <el-divider direction="vertical" />
          <el-statistic title="普通用户" :value="userCount" value-style="color: #409EFF">
            <template #suffix>
              <span class="stat-suffix">人</span>
            </template>
          </el-statistic>
        </div>
      </el-card>
      
      <el-card v-else class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>您的个人信息</h3>
          </div>
        </template>
        <el-alert type="info" show-icon>
          <template #title>
            普通用户权限
          </template>
          您只能查看和编辑自己的个人信息。如需更多权限，请联系超级管理员。
        </el-alert>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const currentUser = computed(() => userStore.currentUser)
const allUsers = computed(() => userStore.allUsers)
const isAdmin = computed(() => userStore.isAdmin)

const adminCount = computed(() => {
  return allUsers.value.filter(u => u.role === 'ADMIN').length
})

const userCount = computed(() => {
  return allUsers.value.filter(u => u.role !== 'ADMIN').length
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function loadAllUsers() {
  if (!isAdmin.value) return
  
  loading.value = true
  try {
    await userStore.getAllUsers()
  } catch (error) {
    ElMessage.error('加载用户列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
    }
  }
}

onMounted(() => {
  if (isAdmin.value) {
    loadAllUsers()
  }
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.dashboard-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.user-dropdown:hover {
  color: #409EFF;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-card,
.users-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.user-stats {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-suffix {
  font-size: 14px;
  color: #909399;
}
</style>
