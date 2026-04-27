<template>
  <div class="home-container">
    <header class="header">
      <h1>后悔药系统演示</h1>
      <div class="header-info">
        <span class="undo-count">可撤销操作: {{ undoCount }}</span>
        <span class="shortcut-hint">按 Ctrl+Z 撤销</span>
      </div>
    </header>

    <main class="main-content">
      <section class="add-section">
        <h2>添加新项目</h2>
        <div class="input-group">
          <input 
            v-model="newItemName" 
            type="text" 
            placeholder="输入项目名称"
            @keyup.enter="handleAddItem"
          />
          <select v-model="newItemCategory">
            <option value="工作">工作</option>
            <option value="生活">生活</option>
            <option value="学习">学习</option>
          </select>
          <button class="btn-add" @click="handleAddItem" :disabled="!newItemName.trim()">
            添加
          </button>
        </div>
      </section>

      <section class="items-section">
        <h2>项目列表 (共 {{ items.length }} 项)</h2>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="items.length === 0" class="empty-state">
          暂无项目，请添加
        </div>
        <div v-else class="items-list">
          <div 
            v-for="item in items" 
            :key="item.id" 
            class="item-card"
          >
            <div class="item-content" v-if="!editingId || editingId !== item.id">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-category">{{ item.category }}</span>
              <div class="item-actions">
                <button class="btn-edit" @click="startEdit(item)">编辑</button>
                <button class="btn-delete" @click="handleDeleteItem(item.id)">删除</button>
              </div>
            </div>
            <div class="item-edit" v-else>
              <input 
                v-model="editName" 
                type="text" 
                class="edit-input"
              />
              <select v-model="editCategory" class="edit-select">
                <option value="工作">工作</option>
                <option value="生活">生活</option>
                <option value="学习">学习</option>
              </select>
              <button class="btn-save" @click="handleSaveEdit">保存</button>
              <button class="btn-cancel" @click="cancelEdit">取消</button>
            </div>
          </div>
        </div>
      </section>

      <section class="history-section">
        <h2>操作历史 (最近10条)</h2>
        <div v-if="historyList.length === 0" class="empty-history">
          暂无操作历史
        </div>
        <div v-else class="history-list">
          <div 
            v-for="(item, index) in historyList" 
            :key="index"
            class="history-item"
          >
            <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            <span class="history-action">{{ item.reverseCommand.description }}</span>
          </div>
        </div>
      </section>
    </main>

    <div v-if="notification.show" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useItemsStore } from '../stores/items'
import keyboardManager from '../utils/keyboardManager'
import { undoStack } from '../utils/actionMiddleware'

export default {
  name: 'HomeView',
  setup() {
    const itemsStore = useItemsStore()
    
    const newItemName = ref('')
    const newItemCategory = ref('工作')
    const editingId = ref(null)
    const editName = ref('')
    const editCategory = ref('工作')
    
    const notification = ref({
      show: false,
      message: '',
      type: 'success'
    })
    
    const historyList = ref([])
    const undoCount = computed(() => keyboardManager.getUndoCount())
    const items = computed(() => itemsStore.items)
    const loading = computed(() => itemsStore.loading)

    function showNotification(message, type = 'success') {
      notification.value = {
        show: true,
        message,
        type
      }
      setTimeout(() => {
        notification.value.show = false
      }, 3000)
    }

    function updateHistoryList() {
      historyList.value = undoStack.stack.slice().reverse().slice(0, 10)
    }

    async function handleAddItem() {
      if (!newItemName.value.trim()) {
        showNotification('请输入项目名称', 'error')
        return
      }

      try {
        await itemsStore.addItem({
          name: newItemName.value.trim(),
          category: newItemCategory.value
        })
        newItemName.value = ''
        newItemCategory.value = '工作'
        showNotification('添加成功', 'success')
        updateHistoryList()
      } catch (error) {
        showNotification('添加失败: ' + error.message, 'error')
      }
    }

    async function handleDeleteItem(id) {
      try {
        await itemsStore.deleteItem(id)
        showNotification('删除成功', 'success')
        updateHistoryList()
      } catch (error) {
        showNotification('删除失败: ' + error.message, 'error')
      }
    }

    function startEdit(item) {
      editingId.value = item.id
      editName.value = item.name
      editCategory.value = item.category
    }

    function cancelEdit() {
      editingId.value = null
      editName.value = ''
      editCategory.value = '工作'
    }

    async function handleSaveEdit() {
      if (!editName.value.trim()) {
        showNotification('项目名称不能为空', 'error')
        return
      }

      try {
        await itemsStore.updateItem(editingId.value, {
          name: editName.value.trim(),
          category: editCategory.value
        })
        editingId.value = null
        showNotification('更新成功', 'success')
        updateHistoryList()
      } catch (error) {
        showNotification('更新失败: ' + error.message, 'error')
      }
    }

    function formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    }

    function handleUndo(result) {
      if (result) {
        showNotification('撤销成功: ' + result.reverseCommand.description, 'success')
        itemsStore.fetchItems()
        updateHistoryList()
      }
    }

    onMounted(async () => {
      try {
        await itemsStore.fetchItems()
      } catch (error) {
        console.error('加载数据失败:', error)
      }

      keyboardManager.setUndoCallback(handleUndo)
      keyboardManager.startListening()
      updateHistoryList()
    })

    onUnmounted(() => {
      keyboardManager.stopListening()
    })

    return {
      items,
      loading,
      newItemName,
      newItemCategory,
      editingId,
      editName,
      editCategory,
      notification,
      historyList,
      undoCount,
      handleAddItem,
      handleDeleteItem,
      startEdit,
      cancelEdit,
      handleSaveEdit,
      formatTime
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-info {
  display: flex;
  gap: 20px;
}

.undo-count {
  padding: 5px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  font-size: 14px;
}

.shortcut-hint {
  padding: 5px 12px;
  background: #fff3e0;
  color: #f57c00;
  border-radius: 16px;
  font-size: 14px;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.add-section,
.items-section,
.history-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-section {
  grid-column: 1 / -1;
}

.add-section h2,
.items-section h2,
.history-section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input,
.input-group select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: #1976d2;
}

.input-group input {
  flex: 1;
  min-width: 200px;
}

.btn-add,
.btn-edit,
.btn-delete,
.btn-save,
.btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add {
  background: #1976d2;
  color: white;
}

.btn-add:hover:not(:disabled) {
  background: #1565c0;
}

.btn-add:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-edit {
  background: #4caf50;
  color: white;
}

.btn-edit:hover {
  background: #43a047;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #e53935;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover {
  background: #43a047;
}

.btn-cancel {
  background: #9e9e9e;
  color: white;
}

.btn-cancel:hover {
  background: #757575;
}

.items-section {
  grid-column: 1;
}

.loading,
.empty-state,
.empty-history {
  text-align: center;
  padding: 40px;
  color: #999;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.item-card:hover {
  background: #f5f5f5;
  border-color: #ddd;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-name {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.item-category {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-edit {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-input,
.edit-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.edit-input {
  flex: 1;
}

.history-section {
  grid-column: 2;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #1976d2;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-action {
  font-size: 14px;
  color: #333;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #4caf50;
}

.notification.error {
  background: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .history-section {
    grid-column: 1;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .item-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .item-actions {
    width: 100%;
    margin-top: 10px;
  }
  
  .item-edit {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
