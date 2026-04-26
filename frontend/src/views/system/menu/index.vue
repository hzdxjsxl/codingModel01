<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" size="small">新增菜单</el-button>
        </div>
      </template>
      
      <el-table :data="menuList" border stripe row-key="id">
        <el-table-column prop="menuName" label="菜单名称" width="180" />
        <el-table-column prop="menuCode" label="菜单编码" width="150" />
        <el-table-column prop="path" label="路由路径" width="180" />
        <el-table-column prop="component" label="组件路径" width="200" />
        <el-table-column prop="icon" label="图标" width="150" />
        <el-table-column prop="menuType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.menuType === 1 ? 'primary' : row.menuType === 2 ? 'success' : 'warning'">
              {{ row.menuType === 1 ? '目录' : row.menuType === 2 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link size="small">编辑</el-button>
            <el-button type="danger" link size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const menuList = ref([
  { id: 1, menuName: '系统管理', menuCode: 'SYSTEM_MANAGE', path: '/system', component: 'Layout', icon: 'el-icon-setting', menuType: 1, sort: 1 },
  { id: 2, menuName: '用户管理', menuCode: 'USER_MANAGE', path: '/system/user', component: 'system/user/index', icon: 'el-icon-user', menuType: 2, sort: 1 },
  { id: 3, menuName: '角色管理', menuCode: 'ROLE_MANAGE', path: '/system/role', component: 'system/role/index', icon: 'el-icon-s-custom', menuType: 2, sort: 2 },
  { id: 4, menuName: '菜单管理', menuCode: 'MENU_MANAGE', path: '/system/menu', component: 'system/menu/index', icon: 'el-icon-menu', menuType: 2, sort: 3 },
  { id: 5, menuName: '首页', menuCode: 'HOME', path: '/home', component: 'home/index', icon: 'el-icon-s-home', menuType: 2, sort: 0 },
  { id: 6, menuName: '数据中心', menuCode: 'DATA_CENTER', path: '/data', component: 'Layout', icon: 'el-icon-s-data', menuType: 1, sort: 2 },
  { id: 7, menuName: '数据统计', menuCode: 'DATA_STATISTICS', path: '/data/statistics', component: 'data/statistics/index', icon: 'el-icon-s-marketing', menuType: 2, sort: 1 },
  { id: 8, menuName: '数据报表', menuCode: 'DATA_REPORT', path: '/data/report', component: 'data/report/index', icon: 'el-icon-s-order', menuType: 2, sort: 2 }
])
</script>

<style scoped>
.page-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>