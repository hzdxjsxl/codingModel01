import UndoStack from './undoStack'
import api from './api'

const undoStack = new UndoStack(50)

function createReverseCommand(actionType, payload, result) {
  switch (actionType) {
    case 'addItem':
      return {
        type: 'deleteItem',
        payload: {
          id: result.data.id
        },
        description: `撤销添加: ${result.data.name || '新项'}`
      }

    case 'deleteItem':
      return {
        type: 'restoreItem',
        payload: {
          item: result.data
        },
        description: `撤销删除: ${result.data.name || '项'}`
      }

    case 'updateItem':
      return {
        type: 'revertUpdate',
        payload: {
          id: result.data.originalData.id,
          originalData: result.data.originalData
        },
        description: `撤销更新: ${result.data.after.name || '项'}`
      }

    default:
      console.warn(`[ActionMiddleware] 未知的操作类型: ${actionType}`)
      return null
  }
}

function createActionMiddleware() {
  return (context) => {
    const { store } = context
    
    store.$onAction(({ name, args, after, onError }) => {
      console.log(`[ActionMiddleware] 拦截操作: ${name}`, args)

      after((result) => {
        console.log(`[ActionMiddleware] 操作执行结果:`, result)
        
        if (['addItem', 'deleteItem', 'updateItem'].includes(name)) {
          const reverseCommand = createReverseCommand(name, args[0], result)
          
          if (reverseCommand) {
            undoStack.push({
              actionType: name,
              reverseCommand,
              payload: args[0],
              result,
              timestamp: Date.now()
            })
          }
        }
      })

      onError((error) => {
        console.error(`[ActionMiddleware] 操作执行失败: ${name}`, error)
      })
    })
  }
}

async function executeUndo() {
  const command = undoStack.pop()
  
  if (!command) {
    console.log('[UndoManager] 没有可撤销的操作')
    return null
  }

  console.log('[UndoManager] 执行撤销:', command.reverseCommand)

  try {
    const { reverseCommand } = command
    
    switch (reverseCommand.type) {
      case 'deleteItem':
        await api.delete(`/items/${reverseCommand.payload.id}`)
        break

      case 'restoreItem':
        await api.post('/items/restore', reverseCommand.payload.item)
        break

      case 'revertUpdate':
        await api.put(`/items/${reverseCommand.payload.id}`, reverseCommand.payload.originalData)
        break

      default:
        console.warn(`[UndoManager] 未知的逆向操作类型: ${reverseCommand.type}`)
    }

    console.log('[UndoManager] 撤销执行成功')
    return command
  } catch (error) {
    console.error('[UndoManager] 撤销执行失败:', error)
    throw error
  }
}

export {
  undoStack,
  createActionMiddleware,
  executeUndo
}
