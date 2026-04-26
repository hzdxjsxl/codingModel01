<template>
  <div>
    <div class="table-toolbar">
      <div class="type-filter">
        <button 
          class="filter-btn" 
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
        >
          全部
        </button>
        <button 
          class="filter-btn" 
          :class="{ active: currentFilter === 'income' }"
          @click="currentFilter = 'income'"
        >
          仅收入
        </button>
        <button 
          class="filter-btn" 
          :class="{ active: currentFilter === 'expense' }"
          @click="currentFilter = 'expense'"
        >
          仅支出
        </button>
      </div>
      <div class="actions">
        <button class="btn" @click="toggleAllExpand">
          {{ allExpanded ? '全部折叠' : '全部展开' }}
        </button>
      </div>
    </div>

    <div v-if="displayIncome.length > 0">
      <div class="category-header">
        <span class="title">收入类目</span>
        <span class="badge">共 {{ displayIncome.length }} 个类目</span>
      </div>
      <table class="pivot-table">
        <thead>
          <tr>
            <th>类目 / 月份</th>
            <th v-for="month in months" :key="month">{{ formatMonth(month) }}</th>
            <th>总计</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="category in displayIncome" :key="category.category">
            <tr 
              class="category-row" 
              @click="toggleExpand('income', category.category)"
            >
              <td>
                <span 
                  class="expand-icon" 
                  :class="{ expanded: isExpanded('income', category.category) }"
                >
                  ▶
                </span>
                {{ category.category }}
                <span class="type-badge income">收入</span>
              </td>
              <td v-for="month in months" :key="month">
                <span class="positive">+{{ formatAmount(category.monthlyData[month]?.income) }}</span>
              </td>
              <td>
                <span class="positive">+{{ formatAmount(category.monthlyData.total?.income) }}</span>
              </td>
            </tr>
            <template v-if="isExpanded('income', category.category)">
              <tr 
                class="subcategory-row" 
                v-for="sub in category.subCategories" 
                :key="sub.subCategory"
              >
                <td>
                  {{ sub.subCategory }}
                </td>
                <td v-for="month in months" :key="month">
                  <span class="positive">+{{ formatAmount(sub.monthlyData[month]?.income) }}</span>
                </td>
                <td>
                  <span class="positive">+{{ formatAmount(sub.monthlyData.total?.income) }}</span>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="displayExpense.length > 0" style="margin-top: 40px;">
      <div class="category-header">
        <span class="title">支出类目</span>
        <span class="badge">共 {{ displayExpense.length }} 个类目</span>
      </div>
      <table class="pivot-table">
        <thead>
          <tr>
            <th>类目 / 月份</th>
            <th v-for="month in months" :key="month">{{ formatMonth(month) }}</th>
            <th>总计</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="category in displayExpense" :key="category.category">
            <tr 
              class="category-row" 
              @click="toggleExpand('expense', category.category)"
            >
              <td>
                <span 
                  class="expand-icon" 
                  :class="{ expanded: isExpanded('expense', category.category) }"
                >
                  ▶
                </span>
                {{ category.category }}
                <span class="type-badge expense">支出</span>
              </td>
              <td v-for="month in months" :key="month">
                <span class="negative">-{{ formatAmount(category.monthlyData[month]?.expense) }}</span>
              </td>
              <td>
                <span class="negative">-{{ formatAmount(category.monthlyData.total?.expense) }}</span>
              </td>
            </tr>
            <template v-if="isExpanded('expense', category.category)">
              <tr 
                class="subcategory-row" 
                v-for="sub in category.subCategories" 
                :key="sub.subCategory"
              >
                <td>
                  {{ sub.subCategory }}
                </td>
                <td v-for="month in months" :key="month">
                  <span class="negative">-{{ formatAmount(sub.monthlyData[month]?.expense) }}</span>
                </td>
                <td>
                  <span class="negative">-{{ formatAmount(sub.monthlyData.total?.expense) }}</span>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="pivotData && pivotData.grandTotal" style="margin-top: 40px;">
      <div class="category-header">
        <span class="title">数据汇总</span>
      </div>
      <table class="pivot-table">
        <thead>
          <tr>
            <th>汇总 / 月份</th>
            <th v-for="month in months" :key="month">{{ formatMonth(month) }}</th>
            <th>总计</th>
          </tr>
        </thead>
        <tbody>
          <tr class="total-row">
            <td>总收入</td>
            <td v-for="month in months" :key="month">
              <span class="positive">+{{ formatAmount(pivotData.grandTotal.monthlyData[month]?.income) }}</span>
            </td>
            <td>
              <span class="positive">+{{ formatAmount(pivotData.grandTotal.monthlyData.total?.income) }}</span>
            </td>
          </tr>
          <tr class="total-row">
            <td>总支出</td>
            <td v-for="month in months" :key="month">
              <span class="negative">-{{ formatAmount(pivotData.grandTotal.monthlyData[month]?.expense) }}</span>
            </td>
            <td>
              <span class="negative">-{{ formatAmount(pivotData.grandTotal.monthlyData.total?.expense) }}</span>
            </td>
          </tr>
          <tr class="total-row">
            <td>净余额</td>
            <td 
              v-for="month in months" 
              :key="month"
              :class="(pivotData.grandTotal.monthlyData[month]?.net || 0) >= 0 ? 'positive' : 'negative'"
            >
              {{ (pivotData.grandTotal.monthlyData[month]?.net || 0) >= 0 ? '+' : '' }}{{ formatAmount(pivotData.grandTotal.monthlyData[month]?.net) }}
            </td>
            <td 
              :class="(pivotData.grandTotal.monthlyData.total?.net || 0) >= 0 ? 'positive' : 'negative'"
            >
              {{ (pivotData.grandTotal.monthlyData.total?.net || 0) >= 0 ? '+' : '' }}{{ formatAmount(pivotData.grandTotal.monthlyData.total?.net) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  pivotData: {
    type: Object,
    required: true
  },
  months: {
    type: Array,
    required: true
  }
})

const currentFilter = ref('all')
const expandedItems = ref(new Set())
const allExpanded = ref(false)

const displayIncome = computed(() => {
  if (currentFilter.value === 'all' || currentFilter.value === 'income') {
    return props.pivotData?.income || []
  }
  return []
})

const displayExpense = computed(() => {
  if (currentFilter.value === 'all' || currentFilter.value === 'expense') {
    return props.pivotData?.expense || []
  }
  return []
})

const isExpanded = (type, category) => {
  return expandedItems.value.has(`${type}_${category}`)
}

const toggleExpand = (type, category) => {
  const key = `${type}_${category}`
  if (expandedItems.value.has(key)) {
    expandedItems.value.delete(key)
  } else {
    expandedItems.value.add(key)
  }
}

const toggleAllExpand = () => {
  if (allExpanded.value) {
    expandedItems.value.clear()
  } else {
    const items = new Set()
    displayIncome.value.forEach(cat => items.add(`income_${cat.category}`))
    displayExpense.value.forEach(cat => items.add(`expense_${cat.category}`))
    expandedItems.value = items
  }
  allExpanded.value = !allExpanded.value
}

const formatMonth = (month) => {
  if (!month) return ''
  const parts = month.split('-')
  if (parts.length === 2) {
    return `${parts[0]}年${parts[1]}月`
  }
  return month
}

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00'
  }
  return Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

watch(currentFilter, () => {
  expandedItems.value.clear()
  allExpanded.value = false
})
</script>
