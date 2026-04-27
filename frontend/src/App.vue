<template>
  <div class="container" :class="{ 'rollback-animation': showRollbackAnimation }">
    <h1 class="title">退款申请</h1>
    
    <div class="order-card">
      <div class="order-info">
        <label>订单号：</label>
        <value>{{ orderData.orderId }}</value>
      </div>
      <div class="order-info">
        <label>商品：</label>
        <value>{{ orderData.sku }}</value>
      </div>
      <div class="order-info">
        <label>退款金额：</label>
        <value>¥{{ orderData.refundAmount }}</value>
      </div>
      <div class="order-info">
        <label>优惠券：</label>
        <value>{{ orderData.couponId }}</value>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div class="status-indicator">
      <div class="status-label">退款进度：</div>
      
      <div 
        v-for="step in steps" 
        :key="step.id"
        class="status-step"
        :class="getStepStatusClass(step.id)"
      >
        <div class="step-icon">
          {{ getStepIcon(step.id) }}
        </div>
        <div class="step-text">{{ step.label }}</div>
      </div>
    </div>

    <button 
      class="btn btn-primary"
      :disabled="isProcessing || isCompleted"
      @click="handleRefund"
    >
      {{ getButtonText() }}
    </button>
  </div>

  <div v-if="showOverlay" class="overlay">
    <div class="loading-spinner"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { createRefundStateMachine, RefundStates } from './fsm/refundStateMachine'
import { refundApi } from './api/refundApi'

export default {
  name: 'RefundApp',
  setup() {
    const currentState = ref(RefundStates.IDLE)
    const errorMessage = ref('')
    const successMessage = ref('')
    const showOverlay = ref(false)
    const showRollbackAnimation = ref(false)
    const fsmInstance = ref(null)
    const unsubscribe = ref(null)

    const orderData = ref({
      orderId: 'ORD20240101001',
      sku: 'SKU001',
      quantity: 1,
      transactionId: 'TXN1234567890',
      refundAmount: 99.00,
      totalAmount: 199.00,
      couponId: 'CPN2024001'
    })

    const steps = [
      { id: 'inventory', label: '检查库存' },
      { id: 'coupon', label: '作废优惠券' },
      { id: 'refund', label: '发起微信退款' },
      { id: 'order', label: '更新订单状态' }
    ]

    const isProcessing = computed(() => {
      return [
        RefundStates.CHECKING_INVENTORY,
        RefundStates.CANCELLING_COUPON,
        RefundStates.WECHAT_REFUNDING,
        RefundStates.UPDATING_ORDER,
        RefundStates.COMPENSATING
      ].includes(currentState.value)
    })

    const isCompleted = computed(() => {
      return currentState.value === RefundStates.COMPLETED
    })

    const stepStatusMap = computed(() => {
      const state = currentState.value
      const map = {
        inventory: 'pending',
        coupon: 'pending',
        refund: 'pending',
        order: 'pending'
      }

      if (state === RefundStates.IDLE) {
        return map
      }

      if (state === RefundStates.CHECKING_INVENTORY) {
        map.inventory = 'active'
      } else if (state === RefundStates.CANCELLING_COUPON) {
        map.inventory = 'success'
        map.coupon = 'active'
      } else if (state === RefundStates.WECHAT_REFUNDING) {
        map.inventory = 'success'
        map.coupon = 'success'
        map.refund = 'active'
      } else if (state === RefundStates.UPDATING_ORDER) {
        map.inventory = 'success'
        map.coupon = 'success'
        map.refund = 'success'
        map.order = 'active'
      } else if (state === RefundStates.COMPLETED) {
        map.inventory = 'success'
        map.coupon = 'success'
        map.refund = 'success'
        map.order = 'success'
      } else if (state === RefundStates.COMPENSATING) {
        map.inventory = 'success'
        map.coupon = 'compensating'
        map.refund = 'error'
      } else if (state === RefundStates.ERROR) {
        if (map.coupon === 'compensating') {
          map.coupon = 'error'
        } else {
          const errorStates = [
            { state: RefundStates.CHECKING_INVENTORY, step: 'inventory' },
            { state: RefundStates.CANCELLING_COUPON, step: 'coupon' },
            { state: RefundStates.WECHAT_REFUNDING, step: 'refund' },
            { state: RefundStates.UPDATING_ORDER, step: 'order' }
          ]
        }
      }

      return map
    })

    const getStepStatusClass = (stepId) => {
      return stepStatusMap.value[stepId] || 'pending'
    }

    const getStepIcon = (stepId) => {
      const status = stepStatusMap.value[stepId]
      if (status === 'success') return '✓'
      if (status === 'error') return '✗'
      if (status === 'active' || status === 'compensating') return '◯'
      return stepId === 'inventory' ? '1' : 
             stepId === 'coupon' ? '2' : 
             stepId === 'refund' ? '3' : '4'
    }

    const getButtonText = () => {
      if (currentState.value === RefundStates.COMPLETED) {
        return '退款成功'
      }
      if (currentState.value === RefundStates.ERROR) {
        return '重新申请'
      }
      if (isProcessing.value) {
        return '处理中...'
      }
      return '申请退款'
    }

    const initFSM = () => {
      fsmInstance.value = createRefundStateMachine({
        api: refundApi,
        
        onStateChange: (state, context) => {
          console.log('State changed:', state)
          currentState.value = state
        },

        onError: (err, context) => {
          console.error('FSM Error:', err)
          errorMessage.value = err.message || '退款失败，请稍后重试'
          successMessage.value = ''
          showOverlay.value = false
          
          showRollbackAnimation.value = true
          setTimeout(() => {
            showRollbackAnimation.value = false
          }, 600)
        },

        onComplete: (context) => {
          console.log('Refund completed:', context)
          successMessage.value = '退款申请已成功提交！退款金额将在1-3个工作日内原路返回。'
          errorMessage.value = ''
          showOverlay.value = false
        },

        onCompensationStart: (err, context) => {
          console.log('Compensation started due to:', err)
          errorMessage.value = '退款失败，正在执行补偿操作...'
        },

        onCompensationComplete: (err, context) => {
          console.log('Compensation completed')
          errorMessage.value = `退款失败，已执行补偿：${err.message}`
        }
      })

      unsubscribe.value = fsmInstance.value.subscribe((data) => {
        console.log('FSM Update:', data)
      })
    }

    const handleRefund = () => {
      if (currentState.value === RefundStates.ERROR) {
        fsmInstance.value.reset()
        errorMessage.value = ''
        successMessage.value = ''
        return
      }

      if (currentState.value === RefundStates.IDLE) {
        showOverlay.value = true
        errorMessage.value = ''
        successMessage.value = ''

        fsmInstance.value.start({
          orderId: orderData.value.orderId,
          sku: orderData.value.sku,
          quantity: orderData.value.quantity,
          transactionId: orderData.value.transactionId,
          refundAmount: orderData.value.refundAmount,
          totalAmount: orderData.value.totalAmount,
          couponId: orderData.value.couponId
        })
      }
    }

    onMounted(() => {
      initFSM()
    })

    onUnmounted(() => {
      if (unsubscribe.value) {
        unsubscribe.value()
      }
    })

    return {
      currentState,
      errorMessage,
      successMessage,
      showOverlay,
      showRollbackAnimation,
      orderData,
      steps,
      isProcessing,
      isCompleted,
      getStepStatusClass,
      getStepIcon,
      getButtonText,
      handleRefund
    }
  }
}
</script>
