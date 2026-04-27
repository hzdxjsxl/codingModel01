export class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 3000,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.messageListeners = new Set();
    this.connectionListeners = new Set();
    this.messageQueue = [];
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectCount = 0;
          this.notifyConnectionChange(true);
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.notifyMessage(message);
          } catch (e) {
            console.warn('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.notifyConnectionChange(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (e) {
        console.error('Failed to create WebSocket:', e);
        reject(e);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  reconnect() {
    this.disconnect();
    this.reconnectCount = 0;
    return this.connect();
  }

  attemptReconnect() {
    if (this.reconnectCount < this.options.reconnectAttempts) {
      this.reconnectCount++;
      const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectCount - 1);
      
      console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectCount})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch(() => {
          this.attemptReconnect();
        });
      }, delay);
    } else {
      console.warn('Max reconnect attempts reached');
    }
  }

  send(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(messageStr);
        return true;
      } catch (e) {
        console.warn('Failed to send message, queuing:', e);
        this.messageQueue.push(messageStr);
        return false;
      }
    } else {
      this.messageQueue.push(messageStr);
      return false;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  onMessage(listener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onConnectionChange(listener) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  notifyMessage(message) {
    for (const listener of this.messageListeners) {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in message listener:', e);
      }
    }
  }

  notifyConnectionChange(isConnected) {
    for (const listener of this.connectionListeners) {
      try {
        listener(isConnected);
      } catch (e) {
        console.error('Error in connection listener:', e);
      }
    }
  }

  isOnline() {
    return this.isConnected;
  }
}

export default WebSocketManager;
