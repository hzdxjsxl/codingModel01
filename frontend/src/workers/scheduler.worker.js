let isRunning = false
let currentTask = null

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

      self.postMessage({
        type: success ? 'NODE_COMPLETE' : 'NODE_ERROR',
        nodeId,
        nodeType,
        timestamp: Date.now(),
        duration: totalTime
      })

      resolve(success)
    }, totalTime)
  })
}

async function processNode(nodeId, nodeType) {
  return await simulateExecution(nodeId, nodeType)
}

async function processLevel(nodes) {
  const promises = nodes.map(node => processNode(node.id, node.nodeType))
  const results = await Promise.allSettled(promises)

  const allSuccessful = results.every(r => r.status === 'fulfilled' && r.value === true)

  self.postMessage({
    type: 'LEVEL_COMPLETE',
    success: allSuccessful,
    timestamp: Date.now()
  })

  return allSuccessful
}

async function runSchedule(levels) {
  if (isRunning) {
    self.postMessage({
      type: 'ERROR',
      message: 'Scheduler is already running'
    })
    return
  }

  isRunning = true

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
    const nodes = level.nodes || []

    self.postMessage({
      type: 'LEVEL_START',
      levelIndex: i,
      nodeCount: nodes.length,
      timestamp: Date.now()
    })

    const success = await processLevel(nodes)

    if (!success) {
      self.postMessage({
        type: 'SCHEDULE_ERROR',
        message: `Level ${i} failed`,
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
  const { type, payload } = e.data

  switch (type) {
    case 'START_SCHEDULE':
      if (payload && payload.levels) {
        runSchedule(payload.levels)
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
  }
}
