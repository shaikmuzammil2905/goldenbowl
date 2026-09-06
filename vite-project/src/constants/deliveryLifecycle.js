/**
 * Centralized Golden Food Bowl Delivery Lifecycle Constants for Frontend
 */

export const DELIVERY_STAGES = [
  { id: 'ASSIGNED', label: 'Order Assigned', subLabel: 'Driver Assigned' },
  { id: 'ACCEPTED', label: 'Accepted', subLabel: 'Delivery Accepted' },
  { id: 'ARRIVING_AT_PICKUP', label: 'Heading to Store', subLabel: 'Arriving at Pickup' },
  { id: 'AT_PICKUP', label: 'At Restaurant', subLabel: 'Waiting for Order' },
  { id: 'PICKED_UP', label: 'Order Picked Up', subLabel: 'Food in Transit' },
  { id: 'ON_THE_WAY', label: 'On The Way', subLabel: 'Out for Delivery' },
  { id: 'ARRIVING_AT_CUSTOMER', label: 'Near Drop-off', subLabel: 'Arriving at Customer' },
  { id: 'DELIVERED', label: 'Delivered', subLabel: 'Order Completed' },
];

/**
 * Returns the primary action button configuration based on current status
 */
export function getNextDeliveryAction(currentStatus) {
  const s = String(currentStatus || 'ASSIGNED').toUpperCase().trim();
  switch (s) {
    case 'ASSIGNED':
    case 'ACCEPTED':
      return {
        next: 'ARRIVING_AT_PICKUP',
        label: "🛵 I'm Arriving at Pickup",
        desc: 'Heading to the restaurant for order collection',
      };
    case 'ARRIVING_AT_PICKUP':
      return {
        next: 'AT_PICKUP',
        label: "📍 I've Arrived at Pickup",
        desc: 'Reached the restaurant location',
      };
    case 'AT_PICKUP':
      return {
        next: 'PICKED_UP',
        label: '📦 Confirm Order Pickup',
        desc: 'Order collected and verified with restaurant',
      };
    case 'PICKED_UP':
      return {
        next: 'OUT_FOR_DELIVERY',
        label: '🚀 Start Delivery (On The Way)',
        desc: 'Departing restaurant towards customer address',
      };
    case 'OUT_FOR_DELIVERY':
    case 'ON_THE_WAY':
      return {
        next: 'ARRIVING_AT_CUSTOMER',
        label: "🏠 I'm Near Customer",
        desc: 'Within 200m of customer delivery point',
      };
    case 'ARRIVING_AT_CUSTOMER':
      return {
        next: 'DELIVERED',
        label: '✅ Mark Order Delivered',
        desc: 'Handover complete to customer',
      };
    case 'DELIVERED':
      return null;
    default:
      return null;
  }
}
