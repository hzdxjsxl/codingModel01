import axios from 'axios'

const FAIL_AT_STEP_HEADER = 'X-Test-Fail-At-Step'

let testMode = {
  enabled: false,
  failAtStep: null
}

export const setTestMode = (enabled, failAtStep = null) => {
  testMode = {
    enabled,
    failAtStep
  }
}

export const getTestMode = () => ({ ...testMode })

const createApiClient = (stepName) => {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (testMode.enabled && testMode.failAtStep === stepName) {
    headers[FAIL_AT_STEP_HEADER] = stepName
  }
  
  return axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers
  })
}

export const refundApi = {
  checkInventory: async (orderId, sku, quantity) => {
    const apiClient = createApiClient('inventory')
    const response = await apiClient.post('/refund/check-inventory', {
      orderId,
      sku,
      quantity
    })
    return response.data
  },

  wechatRefund: async (orderId, transactionId, refundAmount, totalAmount) => {
    const apiClient = createApiClient('refund')
    const response = await apiClient.post('/refund/wechat-refund', {
      orderId,
      transactionId,
      refundAmount,
      totalAmount
    })
    return response.data
  },

  cancelCoupon: async (orderId, couponId) => {
    const apiClient = createApiClient('coupon')
    const response = await apiClient.post('/refund/cancel-coupon', {
      orderId,
      couponId
    })
    return response.data
  },

  restoreCoupon: async (orderId, couponId) => {
    const apiClient = createApiClient(null)
    const response = await apiClient.post('/refund/restore-coupon', {
      orderId,
      couponId
    })
    return response.data
  },

  updateOrderStatus: async (orderId, status, reason) => {
    const apiClient = createApiClient('order')
    const response = await apiClient.post('/refund/update-order-status', {
      orderId,
      status,
      reason
    })
    return response.data
  }
}
