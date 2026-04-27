import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const refundApi = {
  checkInventory: async (orderId, sku, quantity) => {
    const response = await apiClient.post('/refund/check-inventory', {
      orderId,
      sku,
      quantity
    })
    return response.data
  },

  wechatRefund: async (orderId, transactionId, refundAmount, totalAmount) => {
    const response = await apiClient.post('/refund/wechat-refund', {
      orderId,
      transactionId,
      refundAmount,
      totalAmount
    })
    return response.data
  },

  cancelCoupon: async (orderId, couponId) => {
    const response = await apiClient.post('/refund/cancel-coupon', {
      orderId,
      couponId
    })
    return response.data
  },

  restoreCoupon: async (orderId, couponId) => {
    const response = await apiClient.post('/refund/restore-coupon', {
      orderId,
      couponId
    })
    return response.data
  },

  updateOrderStatus: async (orderId, status, reason) => {
    const response = await apiClient.post('/refund/update-order-status', {
      orderId,
      status,
      reason
    })
    return response.data
  }
}
