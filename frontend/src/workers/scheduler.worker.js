let isRunning = false
let failedNodes = []

function simulateExecution(nodeId, nodeType) {
  return new Promise((resolve) => {
    const baseTime = 1000
    const randomTime = Math.random() * 2000
    const totalTime = baseTime + randomTime

    self.postMessage({
      type: 'NODE_START',
      nodeId,
      nodeType,
      timestamp: Date.now()
    })

    setTimeout(() => {
      const success = Math.random() > 0.1

      if (success) {
        self.postMessage({
          type: 'NODE_COMPLETE',
          nodeId,
          nodeType,
          timestamp: Date.now(),
          duration: totalTime
        })
        resolve({ success: true, nodeId, nodeType })
      } else {
        self.postMessage({
          type: 'NODE_ERROR',
          nodeId,
          nodeType,
          timestamp: Date.now(),
          duration: totalTime,
          error: '模拟执行失败（10%失败率）'
        })
        resolve({ success: false, nodeId, nodeType, error: '模拟执行失败' })
      }
    }, totalTime)
  })
}

async function processNode(nodeId, nodeType) {
  try {
    return await simulateExecution(nodeId, nodeType)
  } catch (error) {
    self.postMessage({
      type: 'NODE_ERROR',
      nodeId,
      nodeType,
      timestamp: Date.now(),
      error: error.message || '未知错误'
    })
    return { success: false, nodeId, nodeType, error: error.message }
  }
}

async function processLevel(nodes, levelIndex) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    self.postMessage({
      type: 'LEVEL_COMPLETE',
      levelIndex,
      success: true,
      nodeCount: 0,
      timestamp: Date.now()
    })
    return { success: true, failedNodes: [] }
  }

  const promises = nodes.map(node => processNode(node.id, node.nodeType))
  const results = await Promise.allSettled(promises)

  const failed = []
  const allSuccessful = results.every(r => {
    if (r.status === 'fulfilled') {
      if (!r.value.success) {
        failed.push(r.value)
        return false
      }
      return true
    }
    return false
  })

  self.postMessage({
    type: 'LEVEL_COMPLETE',
    levelIndex,
    success: allSuccessful,
    nodeCount: nodes.length,
    failedNodes: failed,
    timestamp: Date.now()
  })

  return { success: allSuccessful, failedNodes: failed }
}

async function runSchedule(levels) {
  if (isRunning) {
    self.postMessage({
      type: 'ERROR',
      message: 'Scheduler is already running',
      timestamp: Date.now()
    })
    return
  }

  if (!Array.isArray(levels) || levels.length === 0) {
    self.postMessage({
      type: 'SCHEDULE_ERROR',
      message: 'Invalid levels data: not an array or empty',
      levelIndex: 0,
      timestamp: Date.now()
    })
    return
  }

  isRunning = true
  failedNodes = []

  self.postMessage({
    type: 'SCHEDULE_START',
    timestamp: Date.now(),
    totalLevels: levels.length
  })

  for (let i = 0; i < levels.length; i++) {
    if (!isRunning) {
      break
    }

    const level = levels[i]
    const nodes = level?.nodes || []

    if (!Array.isArray(nodes)) {
      self.postMessage({
        type: 'SCHEDULE_ERROR',
        message: `Level ${i} nodes is not an array`,
        levelIndex: i,
        timestamp: Date.now()
      })
      isRunning = false
      return
    }

    self.postMessage({
      type: 'LEVEL_START',
      levelIndex: i,
      nodeCount: nodes.length,
      timestamp: Date.now()
    })

    const result = await processLevel(nodes, i)

    if (!result.success) {
      failedNodes = result.failedNodes
      self.postMessage({
        type: 'SCHEDULE_ERROR',
        message: `Level ${i} failed`,
        levelIndex: i,
        failedNodes: result.failedNodes,
        timestamp: Date.now()
      })
      isRunning = false
      return
    }
  }

  if (isRunning) {
    self.postMessage({
      type: 'SCHEDULE_COMPLETE',
      timestamp: Date.now()
    })
  }

  isRunning = false
}

self.onmessage = function(e) {
  try {
    const { type, payload } = e.data

    switch (type) {
      case 'START_SCHEDULE':
        if (payload && payload.levels) {
          runSchedule(payload.levels)
        } else {
          self.postMessage({
            type: 'ERROR',
            message: 'Invalid payload: levels is required',
            timestamp: Date.now()
          })
        }
        break

      case 'STOP_SCHEDULE':
        isRunning = false
        self.postMessage({
          type: 'SCHEDULE_STOPPED',
          timestamp: Date.now()
        })
        break

      case 'PING':
        self.postMessage({
          type: 'PONG',
          timestamp: Date.now()
        })
        break

      default:
        self.postMessage({
          type: 'ERROR',
          message: `Unknown message type: ${type}`,
          timestamp: Date.now()
        })
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      message: `Worker error: ${error.message}`,
      timestamp: Date.now()
    })
  }
}
