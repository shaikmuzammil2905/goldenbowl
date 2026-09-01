import { DEFAULT_DELIVERY_FEE, TAX_RATE } from './constants';
import { getState } from '../services/prototypeStore';

export function calculateCartSummary(cartItems = [], deliveryFee = null) {
  const dynamicFee = deliveryFee !== null ? deliveryFee : (getState()?.deliverySettings?.customerDeliveryFee ?? DEFAULT_DELIVERY_FEE);
  const actualFee = Number(dynamicFee);
  const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price ?? item.price ?? 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal > 0 ? subtotal + actualFee + taxes : 0;

  return {
    count,
    subtotal,
    deliveryFee: actualFee,
    taxes,
    total,
  };
}
