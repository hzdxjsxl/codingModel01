<template>
  <div class="container">
    <header class="header">
      <h1>📝 CRDT 协同文档编辑器</h1>
      <div class="status-bar">
        <div class="status-item">
          <span class="status-indicator" :class="getStatusClass()"></span>
          <span>{{ getStatusText() }}</span>
        </div>
        <div class="status-item" v-if="unsyncedCount > 0">
          <span>📤</span>
          <span>待同步: {{ unsyncedCount }}</span>
        </div>
      </div>
    </header>

    <TextEditor
      ref="editorRef"
      :client-id="clientId"
      :ws-url="wsUrl"
      @status-change="handleStatusChange"
      @operation="handleOperation"
      @remote-operation="handleRemoteOperation"
    />

    <div class="debug-panel">
      <div class="debug-header" @click="showDebug = !showDebug">
        <h3>{{ showDebug ? '▼ 隐藏调试信息' : '▶ 显示调试信息' }}</h3>
      </div>
      <div class="debug-content" v-if="showDebug">
        <div class="debug-section">
          <h4>客户端信息</h4>
          <pre>{{ JSON.stringify(clientInfo, null, 2) }}</pre>
        </div>

        <div class="stats-panel">
          <div class="stat-item">
            <span class="label">总操作数:</span>
            <span class="value">{{ operationLog.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">本地操作:</span>
            <span class="value">{{ localOperations }}</span>
          </div>
          <div class="stat-item">
            <span class="label">远程操作:</span>
            <span class="value">{{ remoteOperations }}</span>
          </div>
        </div>

        <div class="debug-section" v-if="operationLog.length > 0">
          <h4>最近操作日志 (最多显示 20 条)</h4>
          <div class="operation-log">
            <div 
              v-for="(log, index) in recentOperationLog" 
              :key="index"
              class="operation-item"
              :class="log.source === 'local' ? 'local' : 'remote'"
            >
              <span class="time">{{ formatTime(log.timestamp) }}</span>
              <span class="type" :class="log.operation?.type">{{ log.operation?.type?.toUpperCase() }}</span>
              <span class="pos">@{{ log.operation?.position }}</span>
              <span v-if="log.operation?.type === 'insert'" class="char">"{{ log.operation?.character }}"</span>
              <span v-if="log.operation?.type === 'delete'" class="len">len:{{ log.operation?.length }}</span>
              <span class="client">{{ log.source === 'local' ? '(本地)' : `(来自: ${log.from?.substring(0, 8)})` }}</span>
            </div>
          </div>
        </div>

        <div class="debug-section" v-if="vectorClock">
          <h4>向量时钟 (Vector Clock)</h4>
          <pre>{{ JSON.stringify(vectorClock, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import TextEditor from './components/TextEditor.vue';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'App',
  components: {
    TextEditor
  },
  setup() {
    const editorRef = ref(null);
    const showDebug = ref(false);
    const isOnline = ref(false);
    const isSyncing = ref(false);
    const unsyncedCount = ref(0);
    const operationLog = ref([]);
    const localOperations = ref(0);
    const remoteOperations = ref(0);
    const vectorClock = ref({});

    function getOrCreateClientId() {
      const stored = localStorage.getItem('client_id');
      if (stored) {
        return stored;
      }
      const newId = uuidv4();
      localStorage.setItem('client_id', newId);
      return newId;
    }

    const clientId = ref(getOrCreateClientId());

    const wsUrl = ref('ws://localhost:8081/ws/document');

    const clientInfo = computed(() => ({
      clientId: clientId.value,
      shortId: clientId.value.substring(0, 8),
      isOnline: isOnline.value,
      isSyncing: isSyncing.value,
      unsyncedCount: unsyncedCount.value
    }));

    const recentOperationLog = computed(() => {
      return operationLog.value.slice(-20).reverse();
    });

    onMounted(() => {
      console.log('CRDT Collaborative Editor initialized');
      console.log('Client ID:', clientId.value);
    });

    function getStatusClass() {
      if (isSyncing.value) return 'syncing';
      if (isOnline.value) return 'online';
      return 'offline';
    }

    function getStatusText() {
      if (isSyncing.value) return '同步中...';
      if (isOnline.value) return '已连接';
      return '已断开 (离线模式)';
    }

    function handleStatusChange(status) {
      if (status.type === 'connection') {
        isOnline.value = status.isOnline;
      } else if (status.type === 'syncing') {
        isSyncing.value = true;
        unsyncedCount.value = status.count || 0;
        setTimeout(() => {
          isSyncing.value = false;
        }, 500);
      }
    }

    function handleOperation(event) {
      operationLog.value.push({
        ...event,
        timestamp: Date.now()
      });
      localOperations.value++;
      
      if (editorRef.value?.crdtDoc) {
        vectorClock.value = editorRef.value.crdtDoc.getVectorClock().toJSON();
      }
    }

    function handleRemoteOperation(event) {
      operationLog.value.push({
        ...event,
        source: 'remote',
        timestamp: Date.now()
      });
      remoteOperations.value++;
      
      if (editorRef.value?.crdtDoc) {
        vectorClock.value = editorRef.value.crdtDoc.getVectorClock().toJSON();
      }
    }

    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      });
    }

    return {
      editorRef,
      showDebug,
      clientId,
      wsUrl,
      isOnline,
      isSyncing,
      unsyncedCount,
      operationLog,
      localOperations,
      remoteOperations,
      vectorClock,
      clientInfo,
      recentOperationLog,
      getStatusClass,
      getStatusText,
      handleStatusChange,
      handleOperation,
      handleRemoteOperation,
      formatTime
    };
  }
};
</script>

<style scoped>
.operation-item .time {
  color: #888;
  margin-right: 8px;
}

.operation-item .type {
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
  margin-right: 8px;
}

.operation-item .type.insert {
  background: #d4edda;
  color: #155724;
}

.operation-item .type.delete {
  background: #f8d7da;
  color: #721c24;
}

.operation-item .pos {
  color: #0066cc;
  margin-right: 8px;
}

.operation-item .char,
.operation-item .len {
  color: #666;
  margin-right: 8px;
}

.operation-item .client {
  color: #999;
  font-size: 0.9em;
}
</style>
