import { apiClient } from './apiClient';
import { getState, createOrder as storeCreateOrder, updateOrderStatus as storeUpdateStatus, assignDelivery as storeAssignDelivery } from '../prototypeStore';

export const orderApi = {
  async getOrders(params = {}) {
    let queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/orders?${queryParams}` : '/orders';
    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  async getOrder(id) {
    return apiClient(`/orders/${id}`, {
      method: 'GET',
    });
  },

  async createOrder(orderPayload) {
    return apiClient('/orders', {
      method: 'POST',
      body: orderPayload,
    });
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
