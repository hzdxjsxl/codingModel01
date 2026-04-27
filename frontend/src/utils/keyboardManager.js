import { executeUndo, undoStack } from './actionMiddleware'

class KeyboardManager {
  constructor() {
    this.isListening = false
    this.onUndoCallback = null
    this.boundHandler = null
  }

  startListening() {
    if (this.isListening) {
      console.log('[KeyboardManager] 键盘监听已在运行')
      return
    }

    this.boundHandler = this.handleKeyDown.bind(this)
    document.addEventListener('keydown', this.boundHandler)
    this.isListening = true
    console.log('[KeyboardManager] 键盘监听已启动 (Ctrl+Z 撤销)')
  }

  stopListening() {
    if (!this.isListening) {
      return
    }

    document.removeEventListener('keydown', this.boundHandler)
    this.isListening = false
    this.boundHandler = null
    console.log('[KeyboardManager] 键盘监听已停止')
  }

  setUndoCallback(callback) {
    this.onUndoCallback = callback
  }

  async handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault()
      
      if (!undoStack.canUndo()) {
        console.log('[KeyboardManager] 没有可撤销的操作')
        return
      }

      try {
        console.log('[KeyboardManager] 检测到 Ctrl+Z，执行撤销...')
        const result = await executeUndo()
        
        if (this.onUndoCallback) {
          this.onUndoCallback(result)
        }
      } catch (error) {
        console.error('[KeyboardManager] 撤销操作失败:', error)
      }
    }
  }

  canUndo() {
    return undoStack.canUndo()
  }

  getUndoCount() {
    return undoStack.size()
  }
}

export default new KeyboardManager()
