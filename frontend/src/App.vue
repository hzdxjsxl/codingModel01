<template>
  <div class="app-container">
    <header class="app-header">
      <h1>动态表单系统</h1>
      <p class="subtitle">基于 JSON Schema 驱动的动态表单</p>
    </header>
    
    <main class="app-main">
      <div class="template-selector">
        <label for="templateId">表单模板 ID:</label>
        <input 
          id="templateId" 
          v-model.number="templateId" 
          type="number" 
          min="1"
        />
        <button @click="loadFormTemplate" :disabled="loading">
          {{ loading ? '加载中...' : '加载表单' }}
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <DynamicForm 
        v-if="formSchema" 
        :schema="formSchema"
        @submit="handleSubmit"
      />
      
      <div v-if="submittedData" class="result-section">
        <h3>提交的数据:</h3>
        <pre>{{ JSON.stringify(submittedData, null, 2) }}</pre>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import DynamicForm from './components/DynamicForm.vue'

const templateId = ref(1)
const formSchema = ref(null)
const loading = ref(false)
const error = ref(null)
const submittedData = ref(null)

const loadFormTemplate = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(`http://localhost:8081/api/form-templates/${templateId.value}`)
    formSchema.value = response.data
    submittedData.value = null
  } catch (err) {
    error.value = '加载表单模板失败: ' + (err.response?.data || err.message)
    console.error('加载表单模板失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = (data) => {
  submittedData.value = data
  console.log('表单提交数据:', data)
}

loadFormTemplate()
</script>
