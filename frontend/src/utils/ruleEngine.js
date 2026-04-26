export class RuleEngine {
  constructor() {
    this.formData = {}
    this.fieldStates = {}
    this.rules = []
  }
  
  init(formData, fields) {
    this.formData = formData
    this.fieldStates = {}
    
    fields.forEach(field => {
      this.fieldStates[field.name] = {
        visible: true,
        required: field.required || false,
        rules: field.rules || []
      }
    })
    
    this.rules = []
    fields.forEach(field => {
      if (field.rules && field.rules.length > 0) {
        field.rules.forEach(rule => {
          this.rules.push({
            targetField: field.name,
            condition: rule.condition,
            action: rule.action,
            message: rule.message
          })
        })
      }
    })
    
    this.evaluateAllRules()
  }
  
  updateFieldValue(fieldName, value) {
    this.formData[fieldName] = value
    this.evaluateAllRules()
  }
  
  evaluateAllRules() {
    Object.keys(this.fieldStates).forEach(fieldName => {
      const field = this.fieldStates[fieldName]
      field.visible = true
      
      const originalField = this.getOriginalField(fieldName)
      field.required = originalField?.required || false
    })
    
    this.rules.forEach(rule => {
      this.evaluateRule(rule)
    })
  }
  
  evaluateRule(rule) {
    const conditionResult = this.evaluateCondition(rule.condition)
    const fieldState = this.fieldStates[rule.targetField]
    
    if (!fieldState) return
    
    switch (rule.action) {
      case 'show':
        fieldState.visible = conditionResult
        break
      case 'hide':
        fieldState.visible = !conditionResult
        break
      case 'required':
        if (conditionResult) {
          fieldState.required = true
        }
        break
      case 'optional':
        if (conditionResult) {
          fieldState.required = false
        }
        break
      case 'showRequired':
        if (conditionResult) {
          fieldState.visible = true
          fieldState.required = true
        }
        break
    }
  }
  
  evaluateCondition(condition) {
    try {
      const context = { ...this.formData }
      
      const fn = new Function(...Object.keys(context), `return ${condition}`)
      
      return fn(...Object.values(context))
    } catch (error) {
      console.error('条件表达式执行失败:', condition, error)
      return false
    }
  }
  
  getOriginalField(fieldName) {
    for (const rule of this.rules) {
      if (rule.targetField === fieldName) {
        return this.fieldStates[fieldName]
      }
    }
    return null
  }
  
  getFieldState(fieldName) {
    return this.fieldStates[fieldName] || { visible: true, required: false }
  }
  
  validateField(fieldName, value) {
    const state = this.getFieldState(fieldName)
    
    if (!state.visible) {
      return { valid: true, messages: [] }
    }
    
    const messages = []
    
    if (state.required && (value === undefined || value === null || value === '')) {
      messages.push('此字段为必填项')
    }
    
    return {
      valid: messages.length === 0,
      messages
    }
  }
  
  validateAll() {
    const errors = {}
    let isValid = true
    
    Object.keys(this.fieldStates).forEach(fieldName => {
      const state = this.getFieldState(fieldName)
      
      if (state.visible) {
        const result = this.validateField(fieldName, this.formData[fieldName])
        if (!result.valid) {
          errors[fieldName] = result.messages
          isValid = false
        }
      }
    })
    
    return {
      valid: isValid,
      errors
    }
  }
  
  getVisibleFields() {
    return Object.entries(this.fieldStates)
      .filter(([_, state]) => state.visible)
      .map(([name]) => name)
  }
}
