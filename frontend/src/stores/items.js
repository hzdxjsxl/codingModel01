import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useItemsStore = defineStore('items', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const itemCount = computed(() => items.value.length)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/items')
      items.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addItem(itemData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/items', itemData)
      items.value.push(response.data)
      return { data: response.data }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteItem(id) {
    loading.value = true
    error.value = null
    try {
      const index = items.value.findIndex(item => item.id === id)
      if (index === -1) {
        throw new Error(`未找到ID为 ${id} 的项`)
      }
      
      const deletedItem = { ...items.value[index] }
      
      await api.delete(`/items/${id}`)
      
      if (index !== -1) {
        items.value.splice(index, 1)
      }
      
      return { data: deletedItem }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateItem(id, updateData) {
    loading.value = true
    error.value = null
    try {
      const index = items.value.findIndex(item => item.id === id)
      if (index === -1) {
        throw new Error(`未找到ID为 ${id} 的项`)
      }
      
      const originalData = { ...items.value[index] }
      
      const response = await api.put(`/items/${id}`, updateData)
      
      items.value[index] = { ...items.value[index], ...response.data }
      
      return { 
        data: {
          originalData,
          after: response.data
        }
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateItemsList(newItems) {
    items.value = newItems
  }

  return {
    items,
    loading,
    error,
    itemCount,
    fetchItems,
    addItem,
    deleteItem,
    updateItem,
    updateItemsList
  }
})
