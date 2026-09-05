import { apiClient } from './apiClient';
import { getState, syncWithBackend } from '../prototypeStore';

export const orderApi = {
  async getOrders(params = {}) {
    let queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/orders?${queryParams}` : '/orders';
    return apiClient(endpoint, {
      method: 'GET',
      fallback: () => ({ data: (getState().orders || []).filter(o => o && !o.id?.startsWith('BWL1024')) })
    });
  },

  async getOrder(id) {
    return apiClient(`/orders/${id}`, {
      method: 'GET',
    });
  },

  async createOrder(orderPayload) {
    const res = await apiClient('/orders', {
      method: 'POST',
      body: orderPayload,
    });
    try {
      syncWithBackend();
    } catch {}
    return res;
  },

  async updateOrder(id, orderData) {
    return apiClient(`/orders/${id}`, {
      method: 'PUT',
      body: orderData,
    });
  },

  async updateOrderStatus(id, status) {
    return apiClient(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async assignDeliveryPartner(id, driverId) {
    return apiClient(`/orders/${id}/assign`, {
      method: 'POST',
      body: { driverId },
    });
  },

  async cancelOrder(id) {
    return apiClient(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },
};
