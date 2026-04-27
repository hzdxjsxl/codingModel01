<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <div class="time-ruler" ref="timeRuler">
        <div 
          v-for="tick in timeTicks" 
          :key="tick.time"
          class="time-tick"
          :style="{ left: tick.position + 'px' }"
        >
          <div class="tick-label">{{ tick.label }}</div>
        </div>
      </div>
    </div>
    
    <div 
      class="timeline-track" 
      ref="trackRef"
      @mousedown="handleTrackMouseDown"
    >
      <div 
        v-for="subtitle in subtitles" 
        :key="subtitle.id"
        class="subtitle-block"
        :class="{
          'dragging': draggingSubtitle === subtitle.id,
          'dragging-start': draggingEdge === 'start',
          'dragging-end': draggingEdge === 'end'
        }"
        :style="getSubtitleStyle(subtitle)"
        @mousedown="(e) => handleSubtitleMouseDown(e, subtitle, 'move')"
      >
        <div 
          class="drag-handle left-handle"
          @mousedown.stop="(e) => handleSubtitleMouseDown(e, subtitle, 'start')"
        ></div>
        
        <div class="subtitle-content">
          <div class="subtitle-id">##{{ subtitle.id }}</div>
          <div class="subtitle-text-preview">{{ getPreviewText(subtitle.text) }}</div>
        </div>
        
        <div 
          class="drag-handle right-handle"
          @mousedown.stop="(e) => handleSubtitleMouseDown(e, subtitle, 'end')"
        ></div>
      </div>
    </div>
    
    <div class="time-info" v-if="hoverTime !== null">
      时间: {{ formatTime(hoverTime) }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { millisecondsToTime } from '../utils/srtParser.js'

export default {
  name: 'Timeline',
  props: {
    subtitles: {
      type: Array,
      required: true
    }
  },
  emits: ['update-subtitle'],
  setup(props, { emit }) {
    const trackRef = ref(null)
    const timeRuler = ref(null)
    const trackWidth = ref(1000)
    const pixelsPerMillisecond = ref(0.05)
    const hoverTime = ref(null)
    
    const draggingSubtitle = ref(null)
    const draggingEdge = ref(null)
    const dragStartX = ref(0)
    const dragStartTime = ref(0)
    const dragStartEndTime = ref(0)
    const originalSubtitle = ref(null)
    
    const timeTicks = computed(() => {
      const ticks = []
      const totalDuration = getTotalDuration()
      const tickInterval = Math.max(1000, Math.floor(totalDuration / 10))
      
      for (let time = 0; time <= totalDuration + tickInterval; time += tickInterval) {
        ticks.push({
          time,
          position: time * pixelsPerMillisecond.value,
          label: formatShortTime(time)
        })
      }
      
      return ticks
    })
    
    function getTotalDuration() {
      if (props.subtitles.length === 0) return 30000
      
      const maxEndTime = Math.max(...props.subtitles.map(s => s.endTime))
      return Math.max(maxEndTime + 5000, 30000)
    }
    
    function getSubtitleStyle(subtitle) {
      const left = subtitle.startTime * pixelsPerMillisecond.value
      const width = (subtitle.endTime - subtitle.startTime) * pixelsPerMillisecond.value
      
      return {
        left: `${left}px`,
        width: `${width}px`
      }
    }
    
    function getPreviewText(text) {
      const firstLine = text.split('\n')[0]
      return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine
    }
    
    function formatShortTime(milliseconds) {
      const seconds = Math.floor(milliseconds / 1000)
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      
      if (minutes > 0) {
        return `${minutes}:${secs.toString().padStart(2, '0')}`
      }
      return `${secs}s`
    }
    
    function formatTime(milliseconds) {
      return millisecondsToTime(milliseconds)
    }
    
    function handleSubtitleMouseDown(e, subtitle, edge) {
      e.preventDefault()
      e.stopPropagation()
      
      draggingSubtitle.value = subtitle.id
      draggingEdge.value = edge
      dragStartX.value = e.clientX
      originalSubtitle.value = { ...subtitle }
      dragStartTime.value = subtitle.startTime
      dragStartEndTime.value = subtitle.endTime
    }
    
    function handleTrackMouseDown(e) {
      if (e.target === trackRef.value) {
        const rect = trackRef.value.getBoundingClientRect()
        const x = e.clientX - rect.left
        const time = x / pixelsPerMillisecond.value
        hoverTime.value = Math.max(0, time)
      }
    }
    
    function handleMouseMove(e) {
      if (draggingSubtitle.value === null) return
      
      const deltaX = e.clientX - dragStartX.value
      const deltaTime = deltaX / pixelsPerMillisecond.value
      
      const subtitle = props.subtitles.find(s => s.id === draggingSubtitle.value)
      if (!subtitle) return
      
      let newStartTime = subtitle.startTime
      let newEndTime = subtitle.endTime
      
      if (draggingEdge.value === 'start') {
        newStartTime = Math.max(0, dragStartTime.value + deltaTime)
        if (newStartTime >= newEndTime - 100) {
          newStartTime = newEndTime - 100
        }
      } else if (draggingEdge.value === 'end') {
        newEndTime = Math.max(newStartTime + 100, dragStartEndTime.value + deltaTime)
      } else if (draggingEdge.value === 'move') {
        const duration = subtitle.endTime - subtitle.startTime
        newStartTime = Math.max(0, dragStartTime.value + deltaTime)
        newEndTime = newStartTime + duration
      }
      
      if (!checkOverlap(draggingSubtitle.value, newStartTime, newEndTime)) {
        emit('update-subtitle', {
          id: draggingSubtitle.value,
          startTime: newStartTime,
          endTime: newEndTime
        })
      }
    }
    
    function checkOverlap(subtitleId, startTime, endTime) {
      for (const other of props.subtitles) {
        if (other.id === subtitleId) continue
        
        if (
          (startTime < other.endTime && endTime > other.startTime) ||
          (startTime === other.startTime && endTime === other.endTime)
        ) {
          return true
        }
      }
      return false
    }
    
    function handleMouseUp() {
      draggingSubtitle.value = null
      draggingEdge.value = null
      originalSubtitle.value = null
    }
    
    function handleMouseMoveTrack(e) {
      if (trackRef.value && !draggingSubtitle.value) {
        const rect = trackRef.value.getBoundingClientRect()
        const x = e.clientX - rect.left
        const time = x / pixelsPerMillisecond.value
        hoverTime.value = Math.max(0, time)
      }
    }
    
    function handleMouseLeave() {
      if (!draggingSubtitle.value) {
        hoverTime.value = null
      }
    }
    
    onMounted(() => {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      if (trackRef.value) {
        trackRef.value.addEventListener('mousemove', handleMouseMoveTrack)
        trackRef.value.addEventListener('mouseleave', handleMouseLeave)
      }
    })
    
    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      if (trackRef.value) {
        trackRef.value.removeEventListener('mousemove', handleMouseMoveTrack)
        trackRef.value.removeEventListener('mouseleave', handleMouseLeave)
      }
    })
    
    return {
      trackRef,
      timeRuler,
      timeTicks,
      hoverTime,
      draggingSubtitle,
      draggingEdge,
      getSubtitleStyle,
      getPreviewText,
      formatTime,
      handleSubtitleMouseDown,
      handleTrackMouseDown
    }
  }
}
</script>

<style scoped>
.timeline-container {
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 6px;
  overflow: hidden;
}

.timeline-header {
  background-color: #2d2d2d;
  border-bottom: 1px solid #444;
}

.time-ruler {
  height: 30px;
  position: relative;
  overflow: hidden;
}

.time-tick {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 1px solid #555;
}

.tick-label {
  position: absolute;
  bottom: 2px;
  left: 4px;
  font-size: 10px;
  color: #aaa;
  white-space: nowrap;
}

.timeline-track {
  height: 120px;
  background-color: #252525;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: text;
}

.subtitle-block {
  position: absolute;
  top: 20px;
  height: 80px;
  background: linear-gradient(180deg, #4fc3f7 0%, #29b6f6 100%);
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  padding: 0 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.2s;
  min-width: 30px;
}

.subtitle-block:hover {
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
}

.subtitle-block.dragging {
  z-index: 100;
  box-shadow: 0 4px 16px rgba(79, 195, 247, 0.6);
}

.subtitle-block.dragging-start .left-handle,
.subtitle-block.dragging-end .right-handle {
  background-color: #fff;
}

.drag-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  background-color: rgba(255, 255, 255, 0.3);
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  background-color: rgba(255, 255, 255, 0.6);
}

.left-handle {
  left: 0;
  border-radius: 4px 0 0 4px;
}

.right-handle {
  right: 0;
  border-radius: 0 4px 4px 0;
}

.left-handle::before,
.right-handle::before {
  content: '';
  width: 4px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
}

.subtitle-content {
  flex: 1;
  overflow: hidden;
  color: #1a1a1a;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.subtitle-id {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.subtitle-text-preview {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-info {
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-top: 1px solid #444;
  font-size: 12px;
  color: #4fc3f7;
}
</style>