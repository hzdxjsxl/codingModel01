import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createActionMiddleware } from './utils/actionMiddleware'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createActionMiddleware())

app.use(pinia)
app.use(router)

app.mount('#app')

console.log('========================================')
console.log('  后悔药系统前端启动成功!')
console.log('  访问地址: http://localhost:8080')
console.log('  功能说明:')
console.log('  - 添加/编辑/删除项目')
console.log('  - 按 Ctrl+Z 撤销操作')
console.log('========================================')
