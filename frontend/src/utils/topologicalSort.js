export function topologicalSort(nodes, edges) {
  if (!Array.isArray(nodes)) {
    console.error('[topologicalSort] nodes is not an array:', nodes)
    return {
      hasCycle: false,
      cycle: null,
      levels: [{ level: 0, nodes: [] }],
      sortedNodes: []
    }
  }

  if (!Array.isArray(edges)) {
    console.error('[topologicalSort] edges is not an array:', edges)
    edges = []
  }

  if (nodes.length === 0) {
    return {
      hasCycle: false,
      cycle: null,
      levels: [{ level: 0, nodes: [] }],
      sortedNodes: []
    }
  }

  const validNodes = nodes.filter(node => node && node.id !== undefined && node.id !== null)

  if (validNodes.length === 0) {
    return {
      hasCycle: false,
      cycle: null,
      levels: [{ level: 0, nodes: [] }],
      sortedNodes: []
    }
  }

  const nodeMap = new Map()
  const inDegree = new Map()
  const adjacencyList = new Map()

  validNodes.forEach(node => {
    nodeMap.set(node.id, node)
    inDegree.set(node.id, 0)
    adjacencyList.set(node.id, [])
  })

  const validEdges = edges.filter(edge =>
    edge && edge.sourceId !== undefined && edge.targetId !== undefined
  )

  validEdges.forEach(edge => {
    const sourceId = edge.sourceId
    const targetId = edge.targetId

    if (adjacencyList.has(sourceId) && adjacencyList.has(targetId)) {
      adjacencyList.get(sourceId).push(targetId)
      inDegree.set(targetId, inDegree.get(targetId) + 1)
    }
  })

  const queue = []
  const levels = new Map()

  validNodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push({ id: node.id, level: 0 })
      levels.set(node.id, 0)
    }
  })

  const result = []
  let processedCount = 0

  while (queue.length > 0) {
    const { id, level } = queue.shift()
    result.push({ node: nodeMap.get(id), level })
    processedCount++

    const neighbors = adjacencyList.get(id) || []
    for (const neighborId of neighbors) {
      inDegree.set(neighborId, inDegree.get(neighborId) - 1)

      if (inDegree.get(neighborId) === 0) {
        const newLevel = level + 1
        queue.push({ id: neighborId, level: newLevel })
        levels.set(neighborId, newLevel)
      }
    }
  }

  if (processedCount !== validNodes.length) {
    const visited = new Set()
    const recStack = new Set()
    let cycle = null

    function dfs(nodeId, path) {
      if (recStack.has(nodeId)) {
        const cycleStartIndex = path.indexOf(nodeId)
        if (cycleStartIndex !== -1) {
          cycle = path.slice(cycleStartIndex).concat(nodeId)
        }
        return true
      }

      if (visited.has(nodeId)) {
        return false
      }

      visited.add(nodeId)
      recStack.add(nodeId)
      path.push(nodeId)

      const neighbors = adjacencyList.get(nodeId) || []
      for (const neighborId of neighbors) {
        if (dfs(neighborId, path)) {
          return true
        }
      }

      recStack.delete(nodeId)
      path.pop()
      return false
    }

    for (const node of validNodes) {
      if (dfs(node.id, [])) {
        break
      }
    }

    return {
      hasCycle: true,
      cycle: cycle || [],
      levels: null,
      sortedNodes: null
    }
  }

  const levelsMap = new Map()
  result.forEach(({ node, level }) => {
    if (!levelsMap.has(level)) {
      levelsMap.set(level, [])
    }
    levelsMap.get(level).push(node)
  })

  const levelsArray = []
  const maxLevel = Math.max(...levelsMap.keys(), 0)
  for (let i = 0; i <= maxLevel; i++) {
    levelsArray.push({
      level: i,
      nodes: levelsMap.get(i) || []
    })
  }

  return {
    hasCycle: false,
    cycle: null,
    levels: levelsArray,
    sortedNodes: result.map(r => r.node)
  }
}
