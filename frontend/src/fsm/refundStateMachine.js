export const RefundStates = {
  IDLE: 'IDLE',
  CHECKING_INVENTORY: 'CHECKING_INVENTORY',
  CANCELLING_COUPON: 'CANCELLING_COUPON',
  WECHAT_REFUNDING: 'WECHAT_REFUNDING',
  UPDATING_ORDER: 'UPDATING_ORDER',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  COMPENSATING: 'COMPENSATING'
}

export const RefundEvents = {
  START: 'START',
  INVENTORY_CHECK_SUCCESS: 'INVENTORY_CHECK_SUCCESS',
  INVENTORY_CHECK_FAIL: 'INVENTORY_CHECK_FAIL',
  COUPON_CANCEL_SUCCESS: 'COUPON_CANCEL_SUCCESS',
  COUPON_CANCEL_FAIL: 'COUPON_CANCEL_FAIL',
  WECHAT_REFUND_SUCCESS: 'WECHAT_REFUND_SUCCESS',
  WECHAT_REFUND_FAIL: 'WECHAT_REFUND_FAIL',
  ORDER_UPDATE_SUCCESS: 'ORDER_UPDATE_SUCCESS',
  ORDER_UPDATE_FAIL: 'ORDER_UPDATE_FAIL',
  COMPENSATION_COMPLETE: 'COMPENSATION_COMPLETE',
  RESET: 'RESET'
}

export const createRefundStateMachine = (options = {}) => {
  let currentState = RefundStates.IDLE
  let error = null
  let context = {}
  let executedSteps = []
  let listeners = []

  const { onStateChange, onError, onComplete, onCompensationStart, onCompensationComplete, api } = options

  const notifyListeners = () => {
    listeners.forEach(listener => listener({
      state: currentState,
      error,
      context,
      executedSteps: [...executedSteps]
    }))
  }

  const transitionTo = (newState) => {
    console.log(`[FSM] Transition: ${currentState} -> ${newState}`)
    currentState = newState
    if (onStateChange) {
      onStateChange(currentState, context)
    }
    notifyListeners()
  }

  const recordStep = (stepName, result) => {
    executedSteps.push({
      name: stepName,
      result,
      timestamp: Date.now()
    })
  }

  const stateMachineConfig = {
    [RefundStates.IDLE]: {
      on: {
        [RefundEvents.START]: {
          target: RefundStates.CHECKING_INVENTORY,
          action: async (eventContext) => {
            context = { ...context, ...eventContext }
            try {
              recordStep('CHECK_INVENTORY_START', { pending: true })
              const result = await api.checkInventory(
                context.orderId,
                context.sku,
                context.quantity
              )
              
              if (result.code === 200) {
                recordStep('CHECK_INVENTORY', result.data)
                context.inventoryResult = result.data
                processEvent(RefundEvents.INVENTORY_CHECK_SUCCESS)
              } else {
                throw new Error(result.message || 'Inventory check failed')
              }
            } catch (err) {
              error = err
              recordStep('CHECK_INVENTORY', { error: err.message })
              processEvent(RefundEvents.INVENTORY_CHECK_FAIL)
            }
          }
        }
      }
    },

    [RefundStates.CHECKING_INVENTORY]: {
      on: {
        [RefundEvents.INVENTORY_CHECK_SUCCESS]: {
          target: RefundStates.CANCELLING_COUPON,
          action: async () => {
            try {
              recordStep('CANCEL_COUPON_START', { pending: true })
              const result = await api.cancelCoupon(
                context.orderId,
                context.couponId
              )
              
              if (result.code === 200) {
                recordStep('CANCEL_COUPON', result.data)
                context.couponResult = result.data
                processEvent(RefundEvents.COUPON_CANCEL_SUCCESS)
              } else {
                throw new Error(result.message || 'Coupon cancellation failed')
              }
            } catch (err) {
              error = err
              recordStep('CANCEL_COUPON', { error: err.message })
              processEvent(RefundEvents.COUPON_CANCEL_FAIL)
            }
          }
        },
        [RefundEvents.INVENTORY_CHECK_FAIL]: {
          target: RefundStates.ERROR,
          action: () => {
            if (onError) onError(error, context)
          }
        }
      }
    },

    [RefundStates.CANCELLING_COUPON]: {
      on: {
        [RefundEvents.COUPON_CANCEL_SUCCESS]: {
          target: RefundStates.WECHAT_REFUNDING,
          action: async () => {
            try {
              recordStep('WECHAT_REFUND_START', { pending: true })
              const result = await api.wechatRefund(
                context.orderId,
                context.transactionId,
                context.refundAmount,
                context.totalAmount
              )
              
              if (result.code === 200) {
                recordStep('WECHAT_REFUND', result.data)
                context.refundResult = result.data
                processEvent(RefundEvents.WECHAT_REFUND_SUCCESS)
              } else {
                throw new Error(result.message || 'Wechat refund failed')
              }
            } catch (err) {
              error = err
              recordStep('WECHAT_REFUND', { error: err.message })
              processEvent(RefundEvents.WECHAT_REFUND_FAIL)
            }
          }
        },
        [RefundEvents.COUPON_CANCEL_FAIL]: {
          target: RefundStates.ERROR,
          action: () => {
            if (onError) onError(error, context)
          }
        }
      }
    },

    [RefundStates.WECHAT_REFUNDING]: {
      on: {
        [RefundEvents.WECHAT_REFUND_SUCCESS]: {
          target: RefundStates.UPDATING_ORDER,
          action: async () => {
            try {
              recordStep('UPDATE_ORDER_START', { pending: true })
              const result = await api.updateOrderStatus(
                context.orderId,
                5,
                'Refund completed'
              )
              
              if (result.code === 200) {
                recordStep('UPDATE_ORDER', result.data)
                context.orderResult = result.data
                processEvent(RefundEvents.ORDER_UPDATE_SUCCESS)
              } else {
                throw new Error(result.message || 'Order status update failed')
              }
            } catch (err) {
              error = err
              recordStep('UPDATE_ORDER', { error: err.message })
              processEvent(RefundEvents.ORDER_UPDATE_FAIL)
            }
          }
        },
        [RefundEvents.WECHAT_REFUND_FAIL]: {
          target: RefundStates.COMPENSATING,
          action: async () => {
            if (onCompensationStart) onCompensationStart(error, context)
            
            try {
              recordStep('RESTORE_COUPON_START', { pending: true, isCompensation: true })
              const result = await api.restoreCoupon(
                context.orderId,
                context.couponId
              )
              
              if (result.code === 200) {
                recordStep('RESTORE_COUPON', { ...result.data, isCompensation: true })
                context.compensationResult = result.data
                processEvent(RefundEvents.COMPENSATION_COMPLETE)
              } else {
                throw new Error(result.message || 'Compensation failed')
              }
            } catch (compensationErr) {
              recordStep('RESTORE_COUPON', { error: compensationErr.message, isCompensation: true })
              error = new Error(`Refund failed: ${error.message}. Compensation also failed: ${compensationErr.message}`)
              processEvent(RefundEvents.COMPENSATION_COMPLETE)
            }
          }
        }
      }
    },

    [RefundStates.UPDATING_ORDER]: {
      on: {
        [RefundEvents.ORDER_UPDATE_SUCCESS]: {
          target: RefundStates.COMPLETED,
          action: () => {
            if (onComplete) onComplete(context)
          }
        },
        [RefundEvents.ORDER_UPDATE_FAIL]: {
          target: RefundStates.ERROR,
          action: () => {
            if (onError) onError(error, context)
          }
        }
      }
    },

    [RefundStates.COMPENSATING]: {
      on: {
        [RefundEvents.COMPENSATION_COMPLETE]: {
          target: RefundStates.ERROR,
          action: () => {
            if (onCompensationComplete) onCompensationComplete(error, context)
          }
        }
      }
    },

    [RefundStates.COMPLETED]: {
      on: {
        [RefundEvents.RESET]: {
          target: RefundStates.IDLE,
          action: () => {
            error = null
            context = {}
            executedSteps = []
          }
        }
      }
    },

    [RefundStates.ERROR]: {
      on: {
        [RefundEvents.RESET]: {
          target: RefundStates.IDLE,
          action: () => {
            error = null
            context = {}
            executedSteps = []
          }
        }
      }
    }
  }

  const processEvent = (event, eventContext = {}) => {
    const currentConfig = stateMachineConfig[currentState]
    if (!currentConfig || !currentConfig.on || !currentConfig.on[event]) {
      console.warn(`[FSM] No transition found for event ${event} in state ${currentState}`)
      return
    }

    const transition = currentConfig.on[event]
    if (transition.target) {
      transitionTo(transition.target)
    }
    if (transition.action) {
      transition.action(eventContext)
    }
  }

  return {
    getState: () => currentState,
    getError: () => error,
    getContext: () => ({ ...context }),
    getExecutedSteps: () => [...executedSteps],
    
    start: (refundContext) => {
      if (currentState !== RefundStates.IDLE) {
        throw new Error(`Cannot start from state: ${currentState}`)
      }
      processEvent(RefundEvents.START, refundContext)
    },
    
    reset: () => {
      processEvent(RefundEvents.RESET)
    },
    
    subscribe: (listener) => {
      listeners.push(listener)
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    }
  }
}
