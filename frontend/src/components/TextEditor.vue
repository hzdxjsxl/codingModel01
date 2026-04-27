<template>
  <div class="editor-container">
    <div class="editor-toolbar">
      <div class="client-info">
        客户端 ID: <span class="client-id">{{ shortClientId }}</span>
      </div>
      <div class="stats">
        <span>文档长度: {{ content.length }} 字符</span>
      </div>
    </div>
    <textarea
      ref="textareaRef"
      class="text-editor"
      v-model="content"
      @input="handleInput"
      @keydown="handleKeyDown"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      :disabled="false"
      placeholder="开始输入文本..."
    ></textarea>
  </div>
</template>

<script>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { CRDTDocument } from '../lib/CRDTDocument.js';
import { CharacterId } from '../lib/Character.js';
import { OperationQueue } from '../lib/OperationQueue.js';
import { WebSocketManager } from '../lib/WebSocketManager.js';

export default {
  name: 'TextEditor',
  props: {
    clientId: {
      type: String,
      required: true
    },
    wsUrl: {
      type: String,
      default: 'ws://localhost:8081/ws/document'
    }
  },
  emits: ['status-change', 'operation', 'remote-operation'],
  setup(props, { emit }) {
    const textareaRef = ref(null);
    const content = ref('');
    const isComposing = ref(false);
    const operationQueue = ref(null);
    const wsManager = ref(null);
    const crdtDoc = ref(null);
    const isOnline = ref(false);
    const isSyncing = ref(false);
    const unsyncedCount = ref(0);

    const shortClientId = computed(() => {
      return props.clientId ? props.clientId.substring(0, 8) : 'unknown';
    });

    onMounted(() => {
      initializeEditor();
    });

    function initializeEditor() {
      crdtDoc.value = new CRDTDocument(props.clientId);
      operationQueue.value = new OperationQueue(`crdt_queue_${props.clientId}`);
      
      const unsynced = operationQueue.value.getUnsynced();
      unsyncedCount.value = unsynced.length;
      
      if (unsynced.length > 0) {
        for (const opData of unsynced) {
          crdtDoc.value.applyRemoteOperation(opData);
        }
        content.value = crdtDoc.value.getContent();
      }
      
      connectWebSocket();
      emit('status-change', { type: 'initialized', clientId: props.clientId });
    }

    function connectWebSocket() {
      wsManager.value = new WebSocketManager(props.wsUrl, {
        reconnectAttempts: 10,
        reconnectDelay: 2000
      });

      wsManager.value.onConnectionChange((connected) => {
        isOnline.value = connected;
        emit('status-change', { type: 'connection', isOnline: connected });
        
        if (connected) {
          sendJoinMessage();
          syncUnsyncedOperations();
        }
      });

      wsManager.value.onMessage((message) => {
        handleWebSocketMessage(message);
      });

      wsManager.value.connect();
    }

    function sendJoinMessage() {
      const joinMsg = {
        type: 'join',
        clientId: props.clientId,
        timestamp: Date.now()
      };
      wsManager.value.send(joinMsg);
    }

    function syncUnsyncedOperations() {
      if (!operationQueue.value || operationQueue.value.isEmpty()) return;

      const unsynced = operationQueue.value.getUnsynced();
      if (unsynced.length === 0) return;

      isSyncing.value = true;
      emit('status-change', { type: 'syncing', count: unsynced.length });

      for (const opData of unsynced) {
        const message = {
          type: 'operation',
          clientId: props.clientId,
          operation: opData
        };
        
        const sent = wsManager.value.send(message);
        if (sent) {
          operationQueue.value.markAsSynced(opData.id);
        }
      }

      operationQueue.value.removeSynced();
      unsyncedCount.value = operationQueue.value.getUnsynced().length;
      isSyncing.value = false;
    }

    function handleWebSocketMessage(message) {
      if (message.type === 'operation' && message.clientId !== props.clientId) {
        handleRemoteOperation(message);
      } else if (message.type === 'welcome') {
        console.log('Joined as:', message.clientId);
      }
    }

    function handleRemoteOperation(message) {
      const opData = message.operation;
      const currentCursor = getCursorPosition();

      const result = crdtDoc.value.applyRemoteOperation(opData);

      if (result) {
        let newCursor = currentCursor;

        if (opData.type === 'crdt-insert') {
          const charId = CharacterId.fromJSON(opData.id);
          newCursor = crdtDoc.value.getCursorAdjustmentForInsert(charId, currentCursor);
        } else if (opData.type === 'crdt-delete') {
          const charId = CharacterId.fromJSON(opData.id);
          newCursor = crdtDoc.value.getCursorAdjustmentForDelete(charId, currentCursor);
        }

        content.value = crdtDoc.value.getContent();

        nextTick(() => {
          setCursorPosition(Math.min(newCursor, content.value.length));
        });
      }

      emit('remote-operation', {
        operation: opData,
        result: result,
        from: message.clientId
      });
    }

    function handleInput(event) {
      if (isComposing.value) return;
      
      const target = event.target;
      const newText = target.value;
      const oldText = content.value;
      const cursorPos = target.selectionStart;
      
      const diff = computeDiff(oldText, newText, cursorPos);
      
      if (diff) {
        if (diff.type === 'insert') {
          handleLocalInsert(diff.position, diff.text);
        } else if (diff.type === 'delete') {
          handleLocalDelete(diff.position, diff.length);
        }
      }
      
      content.value = newText;
    }

    function computeDiff(oldText, newText, cursorPos) {
      const oldLen = oldText.length;
      const newLen = newText.length;
      
      if (newLen > oldLen) {
        const insertLength = newLen - oldLen;
        const insertPosition = cursorPos - insertLength;
        const insertedText = newText.substring(insertPosition, cursorPos);
        
        return {
          type: 'insert',
          position: insertPosition,
          text: insertedText,
          length: insertLength
        };
      } else if (newLen < oldLen) {
        const deleteLength = oldLen - newLen;
        let deletePosition = cursorPos;
        
        if (deletePosition + deleteLength > oldLen) {
          deletePosition = oldLen - deleteLength;
        }
        
        return {
          type: 'delete',
          position: deletePosition,
          length: deleteLength
        };
      }
      
      return null;
    }

    function handleLocalInsert(position, text) {
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charPos = position + i;
        
        const crdtOp = crdtDoc.value.localInsert(charPos, char);
        
        if (crdtOp) {
          operationQueue.value.enqueue({
            ...crdtOp,
            synced: false
          });
          
          sendCRDTOperation(crdtOp);
          
          emit('operation', {
            type: 'local',
            operation: crdtOp,
            source: 'input'
          });
        }
      }
      
      unsyncedCount.value = operationQueue.value.getUnsynced().length;
      content.value = crdtDoc.value.getContent();
    }

    function handleLocalDelete(position, length) {
      for (let i = 0; i < length; i++) {
        const crdtOp = crdtDoc.value.localDelete(position);
        
        if (crdtOp) {
          operationQueue.value.enqueue({
            ...crdtOp,
            synced: false
          });
          
          sendCRDTOperation(crdtOp);
          
          emit('operation', {
            type: 'local',
            operation: crdtOp,
            source: 'delete'
          });
        }
      }
      
      unsyncedCount.value = operationQueue.value.getUnsynced().length;
      content.value = crdtDoc.value.getContent();
    }

    function handleKeyDown(event) {
      const target = event.target;
      
      if (event.key === 'Backspace' || event.key === 'Delete') {
        const cursorPos = target.selectionStart;
        const cursorEnd = target.selectionEnd;
        
        if (cursorPos !== cursorEnd) {
          event.preventDefault();
          const deleteLength = cursorEnd - cursorPos;
          handleLocalDelete(cursorPos, deleteLength);
          
          nextTick(() => {
            setCursorPosition(cursorPos);
          });
        }
      }
    }

    function handleCompositionStart() {
      isComposing.value = true;
    }

    function handleCompositionEnd(event) {
      isComposing.value = false;
      handleInput(event);
    }

    function sendCRDTOperation(crdtOp) {
      if (!wsManager.value || !isOnline.value) return;
      
      const message = {
        type: 'operation',
        clientId: props.clientId,
        operation: crdtOp
      };
      
      const sent = wsManager.value.send(message);
      if (sent) {
        operationQueue.value.markAsSynced(crdtOp.id);
      }
    }

    function getCursorPosition() {
      if (textareaRef.value) {
        return textareaRef.value.selectionStart;
      }
      return 0;
    }

    function setCursorPosition(pos) {
      if (textareaRef.value) {
        const maxPos = content.value.length;
        const safePos = Math.max(0, Math.min(pos, maxPos));
        textareaRef.value.setSelectionRange(safePos, safePos);
      }
    }

    return {
      textareaRef,
      content,
      shortClientId,
      isOnline,
      isSyncing,
      unsyncedCount,
      operationQueue,
      crdtDoc,
      handleInput,
      handleKeyDown,
      handleCompositionStart,
      handleCompositionEnd,
      getCursorPosition,
      setCursorPosition,
      connectWebSocket,
      syncUnsyncedOperations
    };
  }
};
</script>
