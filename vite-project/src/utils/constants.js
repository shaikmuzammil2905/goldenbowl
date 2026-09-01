export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  DELIVERY: 'delivery',
  SUPPORT: 'support',
};

export const ORDER_STATUSES = {
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABELS = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const DELIVERY_FLOW = [
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const DEFAULT_DELIVERY_FEE = 0;
export const TAX_RATE = 0.05;
