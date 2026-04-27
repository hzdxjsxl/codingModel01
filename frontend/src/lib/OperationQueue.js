export class OperationQueue {
  constructor(storageKey = 'operation_queue') {
    this.storageKey = storageKey;
    this.queue = this.loadFromStorage();
  }

  enqueue(operation) {
    const queueItem = {
      ...operation,
      id: operation.id || this.generateId(),
      timestamp: operation.timestamp || Date.now(),
      synced: false
    };
    this.queue.push(queueItem);
    this.saveToStorage();
    return queueItem;
  }

  dequeue() {
    if (this.queue.length === 0) return null;
    const item = this.queue.shift();
    this.saveToStorage();
    return item;
  }

  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  getAll() {
    return [...this.queue];
  }

  getUnsynced() {
    return this.queue.filter(op => !op.synced);
  }

  markAsSynced(operationId) {
    const index = this.queue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.queue[index].synced = true;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  removeSynced() {
    this.queue = this.queue.filter(op => !op.synced);
    this.saveToStorage();
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  size() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to save operation queue to localStorage:', e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load operation queue from localStorage:', e);
      return [];
    }
  }

  generateId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default OperationQueue;
