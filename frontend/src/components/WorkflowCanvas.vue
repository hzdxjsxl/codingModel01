<template>
  <div class="workflow-canvas">
    <svg
      ref="svgRef"
      class="connections-svg"
      :width="canvasWidth"
      :height="canvasHeight"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            :fill="currentLineColor"
          />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#4CAF50"
          />
        </marker>
      </defs>

      <g v-for="edge in edges" :key="edge.id">
        <line
          :x1="getConnectionPoint(edge.sourceId, 'right').x"
          :y1="getConnectionPoint(edge.sourceId, 'right').y"
          :x2="getConnectionPoint(edge.targetId, 'left').x"
          :y2="getConnectionPoint(edge.targetId, 'left').y"
          :class="['connection-line', getLineClass(edge)]"
          :marker-end="getLineMarker(edge)"
        />
      </g>
    </svg>

    <div
      ref="nodesContainer"
      class="nodes-container"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    >
      <div
        v-for="node in nodes"
        :key="node.id"
        :class="['node', getNodeClass(node.id)]"
        :style="getNodePosition(node.id)"
      >
        <div class="node-header">
          <span class="node-type" :class="node.nodeType.toLowerCase()">
            {{ getNodeTypeLabel(node.nodeType) }}
          </span>
          <span class="node-status" v-if="nodeStates[node.id]">
            {{ getStatusLabel(nodeStates[node.id].status) }}
          </span>
        </div>
        <div class="node-content">
          <div class="node-name">{{ node.name }}</div>
          <div class="node-desc" v-if="node.description">{{ node.description }}</div>
        </div>
        <div class="node-footer" v-if="nodeStates[node.id] && nodeStates[node.id].duration">
          耗时: {{ formatDuration(nodeStates[node.id].duration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { NodeStatus } from '../utils/stateProxy'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  },
  levels: {
    type: Array,
    default: () => []
  },
  nodeStates: {
    type: Object,
    default: () => ({})
  }
})

const svgRef = ref(null)
const nodesContainer = ref(null)

const LEVEL_SPACING = 200
const NODE_WIDTH = 180
const NODE_HEIGHT = 100
const NODE_SPACING = 40
const PADDING = 50

const nodePositions = ref(new Map())

const canvasWidth = computed(() => {
  const maxLevel = props.levels.length > 0 ? props.levels.length - 1 : 0
  return PADDING * 2 + maxLevel * LEVEL_SPACING + NODE_WIDTH + 100
})

const canvasHeight = computed(() => {
  let maxHeight = 0
  props.levels.forEach(level => {
    const levelHeight = level.nodes.length * NODE_HEIGHT + (level.nodes.length - 1) * NODE_SPACING
    if (levelHeight > maxHeight) {
      maxHeight = levelHeight
    }
  })
  return PADDING * 2 + maxHeight + 100
})

const currentLineColor = computed(() => '#666')

function calculateNodePositions() {
  const positions = new Map()

  props.levels.forEach(level => {
    const levelIndex = level.level
    const nodesInLevel = level.nodes

    const totalHeight = nodesInLevel.length * NODE_HEIGHT + (nodesInLevel.length - 1) * NODE_SPACING
    const startY = PADDING + (canvasHeight.value - PADDING * 2 - totalHeight) / 2

    nodesInLevel.forEach((node, index) => {
      const x = PADDING + levelIndex * LEVEL_SPACING
      const y = startY + index * (NODE_HEIGHT + NODE_SPACING)

      positions.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })
    })
  })

  nodePositions.value = positions
}

function getNodePosition(nodeId) {
  const pos = nodePositions.value.get(nodeId)
  if (pos) {
    return {
      left: pos.x + 'px',
      top: pos.y + 'px',
      width: pos.width + 'px',
      height: pos.height + 'px'
    }
  }
  return {}
}

function getConnectionPoint(nodeId, side) {
  const pos = nodePositions.value.get(nodeId)
  if (!pos) {
    return { x: 0, y: 0 }
  }

  const centerY = pos.y + pos.height / 2

  if (side === 'left') {
    return {
      x: pos.x,
      y: centerY
    }
  }

  if (side === 'right') {
    return {
      x: pos.x + pos.width,
      y: centerY
    }
  }

  return { x: pos.x + pos.width / 2, y: centerY }
}

function getNodeTypeLabel(nodeType) {
  const labels = {
    'DATA_SOURCE': '数据源',
    'CLEANING': '清洗',
    'TRANSFORM': '转换',
    'ANALYSIS': '分析',
    'MERGE': '合并',
    'EXPORT': '导出'
  }
  return labels[nodeType] || nodeType
}

function getStatusLabel(status) {
  const labels = {
    [NodeStatus.IDLE]: '等待',
    [NodeStatus.RUNNING]: '运行中',
    [NodeStatus.COMPLETED]: '完成',
    [NodeStatus.ERROR]: '错误'
  }
  return labels[status] || status
}

function getNodeClass(nodeId) {
  const state = props.nodeStates[nodeId]
  if (!state) return ''

  const classes = []
  switch (state.status) {
    case NodeStatus.RUNNING:
      classes.push('node-running')
      break
    case NodeStatus.COMPLETED:
      classes.push('node-completed')
      break
    case NodeStatus.ERROR:
      classes.push('node-error')
      break
  }
  return classes.join(' ')
}

function getLineClass(edge) {
  const sourceState = props.nodeStates[edge.sourceId]
  const targetState = props.nodeStates[edge.targetId]

  if (targetState && targetState.status === NodeStatus.COMPLETED) {
    return 'line-completed'
  }
  if (targetState && targetState.status === NodeStatus.RUNNING) {
    return 'line-active'
  }
  if (sourceState && sourceState.status === NodeStatus.COMPLETED) {
    return 'line-source-completed'
  }
  return ''
}

function getLineMarker(edge) {
  const targetState = props.nodeStates[edge.targetId]
  if (targetState && targetState.status === NodeStatus.COMPLETED) {
    return 'url(#arrowhead-active)'
  }
  return 'url(#arrowhead)'
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

watch(() => [props.levels, props.nodes], () => {
  calculateNodePositions()
}, { deep: true })

onMounted(() => {
  calculateNodePositions()
})
</script>

<style scoped>
.workflow-canvas {
  position: relative;
  overflow: auto;
  background: #fafbfc;
  border-radius: 8px;
  min-height: 400px;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: #c1c7cd;
  stroke-width: 2;
  fill: none;
  transition: stroke 0.3s ease;
}

.connection-line.line-active {
  stroke: #4CAF50;
  stroke-width: 3;
  animation: pulse 1.5s ease-in-out infinite;
}

.connection-line.line-completed {
  stroke: #4CAF50;
  stroke-width: 2;
}

.connection-line.line-source-completed {
  stroke: #8BC34A;
  stroke-width: 2;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.nodes-container {
  position: relative;
  z-index: 2;
}

.node {
  position: absolute;
  background: white;
  border: 2px solid #dfe3e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.node.node-running {
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);
  animation: nodePulse 1.5s ease-in-out infinite;
}

.node.node-completed {
  border-color: #4CAF50;
  background: #f1f8f1;
}

.node.node-error {
  border-color: #f44336;
  background: #ffebee;
}

@keyframes nodePulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(33, 150, 243, 0.1), 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f7f9fa;
  border-bottom: 1px solid #eaecef;
}

.node-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.node-type.data_source {
  background: #2196F3;
}

.node-type.cleaning {
  background: #FF9800;
}

.node-type.transform {
  background: #9C27B0;
}

.node-type.analysis {
  background: #3F51B5;
}

.node-type.merge {
  background: #009688;
}

.node-type.export {
  background: #795548;
}

.node-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e8eaed;
  color: #5f6368;
}

.node-content {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #202124;
  margin-bottom: 4px;
}

.node-desc {
  font-size: 12px;
  color: #5f6368;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.node-footer {
  font-size: 11px;
  color: #5f6368;
  padding: 4px 12px;
  background: #f7f9fa;
  border-top: 1px solid #eaecef;
  text-align: right;
}
</style>
