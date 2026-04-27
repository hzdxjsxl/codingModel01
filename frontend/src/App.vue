<template>
  <div class="subtitle-editor">
    <h1>在线字幕编辑与时间戳校准系统</h1>
    
    <div class="controls">
      <button @click="loadSubtitles" :disabled="loading">
        {{ loading ? '加载中...' : '加载字幕' }}
      </button>
      <button @click="saveSubtitles" :disabled="subtitles.length === 0 || saving">
        {{ saving ? '保存中...' : '保存字幕' }}
      </button>
    </div>

    <div class="subtitle-list" v-if="subtitles.length > 0">
      <h3>字幕列表 (点击编辑文本)</h3>
      <div 
        v-for="subtitle in subtitles" 
        :key="subtitle.id" 
        class="subtitle-item"
      >
        <div class="subtitle-info">
          <span class="subtitle-id">#{{ subtitle.id }}</span>
          <span class="subtitle-time">
            {{ formatTime(subtitle.startTime) }} → {{ formatTime(subtitle.endTime) }}
          </span>
        </div>
        <textarea 
          v-model="subtitle.text" 
          class="subtitle-text"
          placeholder="字幕内容"
          rows="2"
        ></textarea>
      </div>
    </div>

    <div class="timeline-section" v-if="subtitles.length > 0">
      <h3>时间轴 (拖拽边缘调整持续时间)</h3>
      <Timeline 
        :subtitles="subtitles"
        @update-subtitle="updateSubtitle"
      />
    </div>

    <div class="srt-preview" v-if="subtitles.length > 0">
      <h3>SRT 预览</h3>
      <pre>{{ serializedSrt }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Timeline from './components/Timeline.vue'
import { parseSrt, serializeSrt, timeToMilliseconds, millisecondsToTime } from './utils/srtParser.js'

export default {
  name: 'App',
  components: {
    Timeline
  },
  setup() {
    const subtitles = ref([])
    const loading = ref(false)
    const saving = ref(false)

    const serializedSrt = computed(() => {
      return serializeSrt(subtitles.value)
    })

    const loadSubtitles = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/subtitle/raw')
        const rawSrt = await response.text()
        subtitles.value = parseSrt(rawSrt)
      } catch (error) {
        console.error('加载字幕失败:', error)
        alert('加载字幕失败，请检查后端服务是否启动')
      } finally {
        loading.value = false
      }
    }

    const saveSubtitles = async () => {
      saving.value = true
      try {
        const srtText = serializeSrt(subtitles.value)
        console.log('序列化后的 SRT 文本:', srtText)
        
        const response = await fetch('/api/subtitle/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          },
          body: srtText
        })
        const result = await response.json()
        if (result.success) {
          alert('字幕保存成功！')
        }
      } catch (error) {
        console.error('保存字幕失败:', error)
        alert('保存字幕失败，请检查后端服务是否启动')
      } finally {
        saving.value = false
      }
    }

    const updateSubtitle = (updatedSubtitle) => {
      const index = subtitles.value.findIndex(s => s.id === updatedSubtitle.id)
      if (index !== -1) {
        subtitles.value[index] = { ...subtitles.value[index], ...updatedSubtitle }
      }
    }

    const formatTime = (milliseconds) => {
      return millisecondsToTime(milliseconds)
    }

    return {
      subtitles,
      loading,
      saving,
      serializedSrt,
      loadSubtitles,
      saveSubtitles,
      updateSubtitle,
      formatTime
    }
  }
}
</script>

<style scoped>
.subtitle-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  gap: 10px;
}

.subtitle-list {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
}

.subtitle-list h3 {
  margin-bottom: 15px;
  color: #4fc3f7;
}

.subtitle-item {
  background-color: #3d3d3d;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.subtitle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subtitle-id {
  font-weight: bold;
  color: #4fc3f7;
}

.subtitle-time {
  font-size: 12px;
  color: #aaa;
}

.subtitle-text {
  width: 100%;
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  resize: vertical;
}

.timeline-section {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
}

.timeline-section h3 {
  margin-bottom: 15px;
  color: #4fc3f7;
}

.srt-preview {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
}

.srt-preview h3 {
  margin-bottom: 15px;
  color: #4fc3f7;
}

.srt-preview pre {
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.6;
  border: 1px solid #555;
}
</style>