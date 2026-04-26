<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="title">数据清洗编排系统</h1>
        <div class="header-actions">
          <button
            class="btn btn-secondary"
            @click="loadWorkflow"
            :disabled="isLoading"
          >
            {{ isLoading ? '加载中...' : '刷新数据' }}
          </button>
          <button
            class="btn"
            :class="isRunning ? 'btn-danger' : 'btn-primary'"
            @click="toggleExecution"
            :disabled="isLoading || hasCycle || !topoResult"
          >
            {{ isRunning ? '停止执行' : '开始执行' }}
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="info-panel" v-if="hasCycle">
        <div class="alert alert-error">
          <strong>错误：</strong>检测到循环依赖！无法执行工作流。
          <br>
          <span class="cycle-path">循环路径: {{ cyclePath }}</span>
        </div>
      </div>

      <div class="info-panel" v-else-if="topoResult">
        <div class="workflow-stats">
          <div class="stat-item">
            <span class="stat-label">总节点数</span>
            <span class="stat-value">{{ nodes.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总边数</span>
            <span class="stat-value">{{ edges.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">执行层级</span>
            <span class="stat-value">{{ topoResult.levels.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">执行状态</span>
            <span class="stat-value" :class="executionStatusClass">
              {{ executionStatusLabel }}
            </span>
          </div>
        </div>
      </div>

      <div class="canvas-container">
        <WorkflowCanvas
          v-if="topoResult && !hasCycle"
          :nodes="nodes"
          :edges="edges"
          :levels="topoResult.levels"
          :nodeStates="nodeStates"
        />
        <div class="loading-placeholder" v-else-if="isLoading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        <div class="empty-placeholder" v-else>
          <span>暂无工作流数据</span>
        </div>
      </div>

      <div class="log-panel" v-if="executionLogs.length > 0">
        <div class="log-header">
          <span class="log-title">执行日志</span>
          <button class="btn btn-text" @click="clearLogs">清空</button>
        </div>
        <div class="log-content">
          <div
            v-for="(log, index) in executionLogs"
            :key="index"
            :class="['log-item', log.type.toLowerCase()]"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { workflowApi } from './services/api'
import { topologicalSort } from './utils/topologicalSort'
import { createStateProxy, NodeStatus, createNodeState } from './utils/stateProxy'
import WorkflowCanvas from './components/WorkflowCanvas.vue'

const nodes = ref([])
const edges = ref([])
const topoResult = ref(null)
const isLoading = ref(false)
const isRunning = ref(false)
const executionLogs = ref([])
const stateProxy = ref(null)
const worker = ref(null)

const hasCycle = computed(() => topoResult.value?.hasCycle || false)

const cyclePath = computed(() => {
  if (topoResult.value?.cycle) {
    return topoResult.value.cycle.map(id => `节点${id}`).join(' → ')
  }
  return ''
})

const nodeStates = computed(() => {
  return stateProxy.value?.nodes || {}
})

const executionStatusClass = computed(() => {
  const status = stateProxy.value?.status
  switch (status) {
    case NodeStatus.RUNNING:
      return 'status-running'
    case NodeStatus.COMPLETED:
      return 'status-completed'
    case NodeStatus.ERROR:
      return 'status-error'
    default:
      return 'status-idle'
  }
})

const executionStatusLabel = computed(() => {
  const status = stateProxy.value?.status
  switch (status) {
    case NodeStatus.IDLE:
      return '待执行'
    case NodeStatus.RUNNING:
      return '执行中'
    case NodeStatus.COMPLETED:
      return '已完成'
    case NodeStatus.ERROR:
      return '执行失败'
    default:
      return '未知'
  }
})

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function addLog(type, message, timestamp = Date.now()) {
  executionLogs.value.push({
    type,
    message,
    timestamp
  })
}

function clearLogs() {
  executionLogs.value = []
}

async function loadWorkflow() {
  isLoading.value = true
  try {
    const data = await workflowApi.getWorkflow()
    nodes.value = data.nodes || []
    edges.value = data.edges || []

    if (nodes.value.length > 0) {
      topoResult.value = topologicalSort(nodes.value, edges.value)

      const nodeStates = {}
      nodes.value.forEach(node => {
        nodeStates[node.id] = createNodeState(node.id)
      })

      stateProxy.value = createStateProxy({
        nodes: nodeStates,
        status: NodeStatus.IDLE
      })

      stateProxy.value.subscribe((change) => {
        console.log('State change:', change)
      })

      if (topoResult.value.hasCycle) {
        addLog('ERROR', `检测到循环依赖: ${cyclePath.value}`)
      } else {
        addLog('INFO', `拓扑排序完成，共 ${topoResult.value.levels.length} 个执行层级`)
      }
    } else {
      topoResult.value = null
      addLog('WARN', '工作流数据为空')
    }
  } catch (error) {
    console.error('Failed to load workflow:', error)
    addLog('ERROR', `加载工作流失败: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

function initWorker() {
  if (typeof Worker !== 'undefined') {
    worker.value = new Worker(new URL('./workers/scheduler.worker.js', import.meta.url), {
      type: 'module'
    })

    worker.value.onmessage = (e) => {
      const { type, nodeId, nodeType, timestamp, levelIndex, duration, success, message } = e.data

      switch (type) {
        case 'SCHEDULE_START':
          addLog('INFO', '调度器启动，开始执行工作流', timestamp)
          if (stateProxy.value) {
            stateProxy.value.status = NodeStatus.RUNNING
            stateProxy.value.startTime = timestamp
          }
          break

        case 'LEVEL_START':
          addLog('INFO', `开始执行层级 ${levelIndex}`, timestamp)
          if (stateProxy.value) {
            stateProxy.value.currentLevel = levelIndex
          }
          break

        case 'NODE_START':
          addLog('INFO', `节点 ${nodeId} (${nodeType}) 开始执行`, timestamp)
          if (stateProxy.value) {
            stateProxy.value.updateNode(nodeId, {
              status: NodeStatus.RUNNING,
              startTime: timestamp
            })
          }
          break

        case 'NODE_COMPLETE':
          addLog('SUCCESS', `节点 ${nodeId} 执行完成，耗时 ${(duration / 1000).toFixed(2)}s`, timestamp)
          if (stateProxy.value) {
            stateProxy.value.updateNode(nodeId, {
              status: NodeStatus.COMPLETED,
              endTime: timestamp,
              duration
            })
          }
          break

        case 'NODE_ERROR':
          addLog('ERROR', `节点 ${nodeId} 执行失败`, timestamp)
          if (stateProxy.value) {
            stateProxy.value.updateNode(nodeId, {
              status: NodeStatus.ERROR,
              endTime: timestamp,
              error: '执行失败'
            })
          }
          break

        case 'LEVEL_COMPLETE':
          addLog('INFO', `层级 ${levelIndex} 执行${success ? '成功' : '失败'}`, timestamp)
          break

        case 'SCHEDULE_COMPLETE':
          addLog('SUCCESS', '工作流执行完成', timestamp)
          isRunning.value = false
          if (stateProxy.value) {
            stateProxy.value.status = NodeStatus.COMPLETED
            stateProxy.value.endTime = timestamp
          }
          break

        case 'SCHEDULE_ERROR':
          addLog('ERROR', `工作流执行失败: ${message}`, timestamp)
          isRunning.value = false
          if (stateProxy.value) {
            stateProxy.value.status = NodeStatus.ERROR
            stateProxy.value.endTime = timestamp
          }
          break

        case 'SCHEDULE_STOPPED':
          addLog('INFO', '工作流执行已停止', timestamp)
          isRunning.value = false
          break
      }
    }

    worker.value.onerror = (error) => {
      addLog('ERROR', `Worker 错误: ${error.message}`)
      console.error('Worker error:', error)
    }
  } else {
    addLog('ERROR', '当前浏览器不支持 Web Worker')
  }
}

function toggleExecution() {
  if (isRunning.value) {
    stopExecution()
  } else {
    startExecution()
  }
}

function startExecution() {
  if (!topoResult.value || topoResult.value.hasCycle) {
    return
  }

  if (stateProxy.value) {
    stateProxy.value.reset()
  }

  if (!worker.value) {
    initWorker()
  }

  isRunning.value = true

  const serializableLevels = JSON.parse(JSON.stringify(topoResult.value.levels))

  worker.value.postMessage({
    type: 'START_SCHEDULE',
    payload: {
      levels: serializableLevels
    }
  })
}

function stopExecution() {
  if (worker.value) {
    worker.value.postMessage({
      type: 'STOP_SCHEDULE'
    })
  }
}

onMounted(() => {
  initWorker()
  loadWorkflow()
})

onUnmounted(() => {
  if (worker.value) {
    worker.value.terminate()
    worker.value = null
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #202124;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-secondary {
  background: #f5f7fa;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-secondary:hover:not(:disabled) {
  background: #e8eaed;
}

.btn-text {
  background: transparent;
  color: #2196F3;
  padding: 4px 8px;
}

.btn-text:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.08);
}

.main {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

.info-panel {
  margin-bottom: 24px;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-error {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color: #c62828;
}

.cycle-path {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 8px;
  display: inline-block;
}

.workflow-stats {
  display: flex;
  gap: 32px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #5f6368;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #202124;
}

.stat-value.status-running {
  color: #2196F3;
}

.stat-value.status-completed {
  color: #4CAF50;
}

.stat-value.status-error {
  color: #f44336;
}

.canvas-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  margin-bottom: 24px;
}

.loading-placeholder,
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #5f6368;
  font-size: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8eaed;
  border-top-color: #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.log-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f7f9fa;
  border-bottom: 1px solid #eaecef;
}

.log-title {
  font-weight: 600;
  color: #202124;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-item.info {
  background: #e3f2fd;
  color: #1565c0;
}

.log-item.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.log-item.error {
  background: #ffebee;
  color: #c62828;
}

.log-item.warn {
  background: #fff3e0;
  color: #ef6c00;
}

.log-time {
  color: #5f6368;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
}
</style>
