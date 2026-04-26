<template>
  <div class="home-container">
    <el-card>
      <template #header>
        <span>欢迎使用 RBAC 权限管理系统</span>
      </template>
      <div class="welcome-content">
        <h3>当前登录用户：{{ userInfo.realName || userInfo.username }}</h3>
        <p>这是一个基于 RBAC 权限模型的后台管理系统演示。</p>
      </div>
    </el-card>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">2</div>
            <div class="stat-label">用户数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon stat-icon-green">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">2</div>
            <div class="stat-label">角色数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon stat-icon-orange">
            <el-icon><Menu /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">8</div>
            <div class="stat-label">菜单数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">100%</div>
            <div class="stat-label">系统状态</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="info-card">
      <template #header>
        <span>功能说明</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="权限模型">
          采用标准的 RBAC（Role-Based Access Control）权限模型，包含用户、角色、菜单、用户角色关联、角色菜单关联五张核心表。
        </el-descriptions-item>
        <el-descriptions-item label="后端实现">
          使用 Spring Boot + MyBatis Plus 实现，仅返回扁平化的权限列表，不进行树状结构组装。
        </el-descriptions-item>
        <el-descriptions-item label="前端实现">
          使用 Vue 3 + Vue Router + Element Plus，通过递归算法将扁平化数据组装成无限层级的路由树，并动态挂载到路由系统。
        </el-descriptions-item>
        <el-descriptions-item label="测试账号">
          <p>超级管理员：admin / 123456（拥有所有权限）</p>
          <p>普通用户：user / 123456（只有首页和数据中心权限）</p>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, UserFilled, Menu, DataAnalysis } from '@element-plus/icons-vue'

const userInfo = ref({})

onMounted(() => {
  const savedUserInfo = localStorage.getItem('userInfo')
  if (savedUserInfo) {
    userInfo.value = JSON.parse(savedUserInfo)
  }
})
</script>

<style scoped>
.home-container {
  width: 100%;
}

.welcome-content {
  padding: 20px 0;
}

.welcome-content h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.welcome-content p {
  margin: 0;
  color: #909399;
}

.stats-row {
  margin: 20px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon-blue {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon-green {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon-orange {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-icon-purple {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.info-card {
  margin-top: 20px;
}
</style>