<template>
  <div class="dynamic-form">
    <h2 v-if="schema.title" class="form-title">{{ schema.title }}</h2>
    
    <form @submit.prevent="handleSubmit" class="form-content">
      <TransitionGroup name="form-field" tag="div">
        <div 
          v-for="field in visibleFields" 
          :key="field.name"
          class="form-field-wrapper"
          :class="{ 'field-required': getFieldState(field.name).required }"
        >
          <label :for="field.name" class="field-label">
            {{ field.label }}
            <span v-if="getFieldState(field.name).required" class="required-mark">*</span>
          </label>
          
          <div class="field-input-wrapper">
            <template v-if="field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'password'">
              <input
                :type="field.type"
                :id="field.name"
                :name="field.name"
                :value="formData[field.name]"
                @input="handleFieldChange(field.name, $event)"
                :class="{ 'field-error': fieldErrors[field.name]?.length }"
                class="field-input"
              />
            </template>
            
            <template v-else-if="field.type === 'textarea'">
              <textarea
                :id="field.name"
                :name="field.name"
                :value="formData[field.name]"
                @input="handleFieldChange(field.name, $event)"
                :class="{ 'field-error': fieldErrors[field.name]?.length }"
                class="field-textarea"
              ></textarea>
            </template>
            
            <template v-else-if="field.type === 'select'">
              <select
                :id="field.name"
                :name="field.name"
                :value="formData[field.name] || ''"
                @change="handleFieldChange(field.name, $event)"
                :class="{ 'field-error': fieldErrors[field.name]?.length }"
                class="field-select"
              >
                <option value="">请选择</option>
                <option v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </template>
            
            <template v-else-if="field.type === 'radio'">
              <div class="radio-group">
                <label v-for="option in field.options" :key="option.value" class="radio-option">
                  <input
                    type="radio"
                    :name="field.name"
                    :value="option.value"
                    :checked="formData[field.name] === option.value"
                    @change="handleFieldChange(field.name, $event)"
                    class="field-radio"
                  />
                  <span class="radio-label">{{ option.label }}</span>
                </label>
              </div>
            </template>
            
            <template v-else-if="field.type === 'checkbox'">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :id="field.name"
                  :name="field.name"
                  :checked="formData[field.name]"
                  @change="handleFieldChange(field.name, $event)"
                  class="field-checkbox"
                />
                <span class="checkbox-text">{{ field.label }}</span>
              </label>
            </template>
          </div>
          
          <div v-if="fieldErrors[field.name]?.length" class="field-error-messages">
            <span v-for="(error, index) in fieldErrors[field.name]" :key="index" class="field-error-message">
              {{ error }}
            </span>
          </div>
        </div>
      </TransitionGroup>
      
      <div class="form-actions">
        <button type="submit" class="btn-submit">
          提交表单
        </button>
        <button type="button" @click="resetForm" class="btn-reset">
          重置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RuleEngine } from '../utils/ruleEngine'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['submit'])

const formData = reactive({})
const fieldErrors = reactive({})
const ruleEngine = ref(null)

const visibleFields = computed(() => {
  if (!ruleEngine.value) return props.schema.fields || []
  
  return (props.schema.fields || []).filter(field => {
    const state = ruleEngine.value.getFieldState(field.name)
    return state.visible
  })
})

const initForm = () => {
  const fields = props.schema.fields || []
  
  fields.forEach(field => {
    if (formData[field.name] === undefined) {
      if (field.type === 'checkbox') {
        formData[field.name] = false
      } else {
        formData[field.name] = ''
      }
    }
  })
  
  ruleEngine.value = new RuleEngine()
  ruleEngine.value.init(formData, fields)
  
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key]
  })
}

const handleFieldChange = (fieldName, event) => {
  let value
  
  if (event.target.type === 'checkbox') {
    value = event.target.checked
  } else if (event.target.type === 'radio') {
    value = event.target.value
  } else {
    value = event.target.value
  }
  
  formData[fieldName] = value
  
  if (ruleEngine.value) {
    ruleEngine.value.updateFieldValue(fieldName, value)
  }
  
  validateField(fieldName)
}

const validateField = (fieldName) => {
  if (!ruleEngine.value) return
  
  const result = ruleEngine.value.validateField(fieldName, formData[fieldName])
  
  if (result.valid) {
    delete fieldErrors[fieldName]
  } else {
    fieldErrors[fieldName] = result.messages
  }
}

const validateAll = () => {
  if (!ruleEngine.value) return false
  
  const result = ruleEngine.value.validateAll()
  
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key]
  })
  
  Object.entries(result.errors).forEach(([fieldName, messages]) => {
    fieldErrors[fieldName] = messages
  })
  
  return result.valid
}

const handleSubmit = () => {
  if (validateAll()) {
    const submitData = { ...formData }
    
    if (ruleEngine.value) {
      const visibleFields = ruleEngine.value.getVisibleFields()
      Object.keys(submitData).forEach(key => {
        if (!visibleFields.includes(key)) {
          delete submitData[key]
        }
      })
    }
    
    emit('submit', submitData)
  }
}

const resetForm = () => {
  Object.keys(formData).forEach(key => {
    const field = (props.schema.fields || []).find(f => f.name === key)
    if (field) {
      if (field.type === 'checkbox') {
        formData[key] = false
      } else {
        formData[key] = ''
      }
    }
  })
  
  initForm()
}

const getFieldState = (fieldName) => {
  if (!ruleEngine.value) return { visible: true, required: false }
  return ruleEngine.value.getFieldState(fieldName)
}

watch(() => props.schema, () => {
  initForm()
}, { deep: true })

onMounted(() => {
  initForm()
})
</script>
