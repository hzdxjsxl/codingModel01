<template>
  <div class="container">
    <div class="header">
      <h1>财务收支大屏</h1>
      <p class="subtitle">实时数据聚合分析 - 按月 × 类目交叉统计</p>
      <div style="margin-top: 15px;">
        <button class="btn" :class="{ active: !useMockData }" @click="useMockData = false; loadData()">
          连接后端API
        </button>
        <button class="btn" :class="{ active: useMockData }" @click="useMockData = true; loadMockData()">
          使用模拟数据 (测试)
        </button>
      </div>
    </div>

    <div class="stats-bar" v-if="!loading && summary">
      <div class="stat-card count">
        <div class="label">数据条数</div>
        <div class="value animated-number">{{ summary.totalCount.toLocaleString() }}</div>
      </div>
      <div class="stat-card income">
        <div class="label">总收入</div>
        <div class="value animated-number">¥{{ formatNumber(summary.totalIncome) }}</div>
      </div>
      <div class="stat-card expense">
        <div class="label">总支出</div>
        <div class="value animated-number">¥{{ formatNumber(summary.totalExpense) }}</div>
      </div>
      <div class="stat-card balance">
        <div class="label">净余额</div>
        <div class="value animated-number" :class="summary.netBalance >= 0 ? 'positive' : 'negative'">
          ¥{{ formatNumber(summary.netBalance) }}
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else-if="error" class="loading">
      <p style="color: #ef4444;">{{ error }}</p>
      <div style="margin-top: 20px;">
        <button class="btn" @click="loadData">重新连接后端</button>
        <button class="btn" style="margin-left: 10px;" @click="useMockData = true; loadMockData()">
          使用模拟数据测试
        </button>
      </div>
    </div>

    <div v-else class="table-container">
      <PivotTable :pivotData="pivotData" :months="months" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PivotTable from './components/PivotTable.vue'

const loading = ref(true)
const loadingMessage = ref('正在连接后端服务...')
const error = ref(null)
const summary = ref(null)
const pivotData = ref(null)
const months = ref([])
const useMockData = ref(false)

let worker = null

const incomeCategories = ['工资收入', '投资收益', '奖金', '兼职收入', '其他收入']
const incomeSubCategories = [
  ['基本工资', '绩效工资', '补贴'],
  ['股票收益', '基金收益', '理财收益'],
  ['年终奖', '季度奖', '项目奖金'],
  ['副业收入', '临时工作'],
  ['礼金', '红包', '其他']
]

const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '其他支出']
const expenseSubCategories = [
  ['午餐', '晚餐', '早餐', '外卖', '聚餐'],
  ['公交', '地铁', '打车', '加油', '停车费'],
  ['衣服', '鞋子', '化妆品', '电子产品', '日用品'],
  ['电影', '游戏', '旅游', '运动', '会员'],
  ['房租', '水电', '物业费', '装修'],
  ['药品', '体检', '治疗'],
  ['学费', '书籍', '培训'],
  ['礼金', '红包', '罚款', '其他']
]

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00'
  return Math.abs(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const generateMockData = (count) => {
  const records = []
  const random = new Date().getTime()
  
  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() < 0.3
    let category, subCategory, type, amount
    
    if (isIncome) {
      const catIndex = Math.floor(Math.random() * incomeCategories.length)
      category = incomeCategories[catIndex]
      const subIndex = Math.floor(Math.random() * incomeSubCategories[catIndex].length)
      subCategory = incomeSubCategories[catIndex][subIndex]
      type = '收入'
      
      const randType = Math.floor(Math.random() * 10)
      if (randType < 5) {
        amount = 5000 + Math.random() * 15000
      } else if (randType < 8) {
        amount = 1000 + Math.random() * 5000
      } else {
        amount = 100 + Math.random() * 1000
      }
    } else {
      const catIndex = Math.floor(Math.random() * expenseCategories.length)
      category = expenseCategories[catIndex]
      const subIndex = Math.floor(Math.random() * expenseSubCategories[catIndex].length)
      subCategory = expenseSubCategories[catIndex][subIndex]
      type = '支出'
      
      const randType = Math.floor(Math.random() * 10)
      if (randType < 3) {
        amount = 10 + Math.random() * 100
      } else if (randType < 7) {
        amount = 100 + Math.random() * 500
      } else if (randType < 9) {
        amount = 500 + Math.random() * 2000
      } else {
        amount = 2000 + Math.random() * 5000
      }
    }
    
    const year = 2024 + Math.floor(Math.random() * 2)
    const month = 1 + Math.floor(Math.random() * 12)
    const day = 1 + Math.floor(Math.random() * 28)
    const hour = 8 + Math.floor(Math.random() * 14)
    const minute = Math.floor(Math.random() * 60)
    const second = Math.floor(Math.random() * 60)
    
    const transactionTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    
    records.push({
      id: i + 1,
      amount: Math.round(amount * 100) / 100,
      transactionTime,
      category,
      subCategory,
      type
    })
  }
  
  return records
}

const processDataWithWorker = (data) => {
  if (worker) {
    worker.terminate()
  }

  worker = new Worker(new URL('./workers/dataAggregator.js', import.meta.url), { type: 'module' })

  worker.onmessage = (e) => {
    const { type, data: resultData, message } = e.data
    
    if (type === 'progress') {
      loadingMessage.value = message
    } else if (type === 'result') {
      summary.value = resultData.summary
      pivotData.value = resultData.pivotData
      months.value = resultData.months
      loading.value = false
      worker.terminate()
      worker = null
    } else if (type === 'error') {
      error.value = message
      loading.value = false
    }
  }

  worker.onerror = (e) => {
    error.value = `Worker错误: ${e.message}`
    loading.value = false
  }

  worker.postMessage({
    type: 'process',
    data
  })
}

const loadMockData = () => {
  loading.value = true
  error.value = null
  loadingMessage.value = '正在生成10000条模拟数据...'
  
  setTimeout(() => {
    const mockData = generateMockData(10000)
    loadingMessage.value = `已生成 ${mockData.length} 条数据，正在WebWorker中进行聚合计算...`
    processDataWithWorker(mockData)
  }, 500)
}

const loadData = async () => {
  loading.value = true
  error.value = null
  loadingMessage.value = '正在连接后端服务...'

  try {
    loadingMessage.value = '正在从后端获取数据...'
    
    const response = await axios.get('/api/finance/records', {
      timeout: 30000
    })
    
    if (!response.data || response.data.length === 0) {
      error.value = '后端没有返回数据，请确保数据库已初始化'
      loading.value = false
      return
    }

    loadingMessage.value = `已获取 ${response.data.length} 条数据，正在WebWorker中进行聚合计算...`
    processDataWithWorker(response.data)

  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = `加载数据失败: ${err.message}。请确保后端服务已启动 (http://localhost:8080)`
    loading.value = false
  }
}

onMounted(() => {
  useMockData.value = true
  loadMockData()
})
</script>
