/**
 * Centralized Golden Food Bowl Delivery Lifecycle State Machine
 */

export type DeliveryStage =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ARRIVING_AT_PICKUP'
  | 'AT_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'ARRIVING_AT_CUSTOMER'
  | 'DELIVERED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

export type DbOrderStatus =
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

/**
 * Maps granular delivery stages to PostgreSQL OrderStatus enum values
 */
export function mapDeliveryStageToDbStatus(stage: string): DbOrderStatus {
  const s = String(stage || '').toUpperCase().trim();
  switch (s) {
    case 'ACCEPTED':
    case 'ASSIGNED':
    case 'ARRIVING_AT_PICKUP':
    case 'AT_PICKUP':
      return 'ASSIGNED';
    case 'PICKED_UP':
      return 'PICKED_UP';
    case 'ON_THE_WAY':
    case 'OUT_FOR_DELIVERY':
    case 'ARRIVING_AT_CUSTOMER':
      return 'OUT_FOR_DELIVERY';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELLED':
    case 'FAILED':
      return 'CANCELLED';
    default:
      if (['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(s)) {
        return s as DbOrderStatus;
      }
      return 'ASSIGNED';
  }
}

/**
 * Valid allowed transitions from current status/stage
 */
export const ALLOWED_DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED', 'ASSIGNED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'CANCELLED'],
  READY_FOR_PICKUP: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  ASSIGNED: ['ARRIVING_AT_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  ACCEPTED: ['ARRIVING_AT_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  ARRIVING_AT_PICKUP: ['AT_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  AT_PICKUP: ['PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  PICKED_UP: ['ON_THE_WAY', 'OUT_FOR_DELIVERY', 'ARRIVING_AT_CUSTOMER', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['ARRIVING_AT_CUSTOMER', 'DELIVERED', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVING_AT_CUSTOMER', 'DELIVERED', 'CANCELLED'],
  ARRIVING_AT_CUSTOMER: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  DECLINED: [],
  EXPIRED: [],
  FAILED: []
};

/**
 * Checks if transitioning from currentStatus to nextStatus is valid
 */
export function isValidDeliveryTransition(currentStatus: string, nextStatus: string): boolean {
  const current = String(currentStatus || '').toUpperCase().trim();
  const next = String(nextStatus || '').toUpperCase().trim();

  if (current === next) return true;
  const allowed = ALLOWED_DELIVERY_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
