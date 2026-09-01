import { assignDelivery, createOrder, updateOrderStatus } from './prototypeStore'

const nextStatus = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'ASSIGNED',
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export function placeCustomerOrder({ items, total, type = 'Delivery', branch = 'Bowl Koramangala', customer = 'Demo Customer', paymentMethod = 'UPI' }) {
  return createOrder({ items, total, type, branch, customer, paymentMethod, eta: type === 'Delivery' ? 30 : 20 })
}

export function advanceOrder(order) {
  const next = nextStatus[order.status]
  if (!next) return order
  if (next === 'ASSIGNED') {
    assignDelivery(order.id, 'Rahul Kumar')
  } else {
    updateOrderStatus(order.id, next)
  }
  return { ...order, status: next }
}
