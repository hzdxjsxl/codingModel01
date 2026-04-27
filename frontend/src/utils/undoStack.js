class UndoStack {
  constructor(maxSize = 50) {
    this.stack = []
    this.maxSize = maxSize
  }

  push(command) {
    if (this.stack.length >= this.maxSize) {
      this.stack.shift()
    }
    this.stack.push(command)
    console.log('[UndoStack] 推入指令:', command.type, '当前栈大小:', this.stack.length)
  }

  pop() {
    if (this.stack.length === 0) {
      console.log('[UndoStack] 栈为空，无法撤销')
      return null
    }
    const command = this.stack.pop()
    console.log('[UndoStack] 弹出指令:', command.type, '剩余栈大小:', this.stack.length)
    return command
  }

  peek() {
    if (this.stack.length === 0) {
      return null
    }
    return this.stack[this.stack.length - 1]
  }

  clear() {
    this.stack = []
    console.log('[UndoStack] 栈已清空')
  }

  canUndo() {
    return this.stack.length > 0
  }

  size() {
    return this.stack.length
  }
}

export default UndoStack
