export const NodeStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error'
}

export function createStateProxy(initialState = {}) {
  const listeners = new Set()

  const state = {
    nodes: {},
    status: NodeStatus.IDLE,
    startTime: null,
    endTime: null,
    currentLevel: -1,
    ...initialState
  }

  function notifyListeners(change) {
    listeners.forEach(listener => {
      try {
        listener(change, state)
      } catch (e) {
        console.error('Listener error:', e)
      }
    })
  }

  const nodeProxies = new Map()

  function createNodeProxy(nodeId, nodeState) {
    return new Proxy(nodeState, {
      set(target, property, value) {
        const oldValue = target[property]
        target[property] = value

        if (oldValue !== value) {
          notifyListeners({
            type: 'NODE_UPDATE',
            nodeId,
            property,
            oldValue,
            newValue: value
          })
        }

        return true
      }
    })
  }

  const proxy = new Proxy(state, {
    set(target, property, value) {
      if (property === 'nodes') {
        Object.keys(value).forEach(nodeId => {
          if (!nodeProxies.has(nodeId)) {
            nodeProxies.set(nodeId, createNodeProxy(nodeId, value[nodeId]))
          }
        })

        target.nodes = {}
        nodeProxies.forEach((proxy, nodeId) => {
          target.nodes[nodeId] = proxy
        })
      } else {
        const oldValue = target[property]
        target[property] = value

        if (oldValue !== value) {
          notifyListeners({
            type: 'STATE_UPDATE',
            property,
            oldValue,
            newValue: value
          })
        }
      }

      return true
    },

    get(target, property) {
      if (property === 'subscribe') {
        return (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        }
      }

      if (property === 'getState') {
        return () => ({ ...target })
      }

      if (property === 'updateNode') {
        return (nodeId, updates) => {
          if (nodeProxies.has(nodeId)) {
            const nodeProxy = nodeProxies.get(nodeId)
            Object.keys(updates).forEach(key => {
              nodeProxy[key] = updates[key]
            })
          }
        }
      }

      if (property === 'reset') {
        return () => {
          Object.keys(target.nodes).forEach(nodeId => {
            target.nodes[nodeId] = {
              status: NodeStatus.IDLE,
              startTime: null,
              endTime: null,
              error: null
            }
          })
          target.status = NodeStatus.IDLE
          target.startTime = null
          target.endTime = null
          target.currentLevel = -1

          notifyListeners({
            type: 'STATE_RESET'
          })
        }
      }

      return target[property]
    }
  })

  return proxy
}

export function createNodeState(nodeId) {
  return {
    id: nodeId,
    status: NodeStatus.IDLE,
    startTime: null,
    endTime: null,
    duration: null,
    error: null
  }
}
