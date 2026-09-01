import { apiClient } from './apiClient';
import { getState, createOrder as storeCreateOrder, updateOrderStatus as storeUpdateStatus, assignDelivery as storeAssignDelivery } from '../prototypeStore';

export const orderApi = {
  async getOrders(params = {}) {
    return apiClient('/orders', {
      method: 'GET',
      fallback: () => {
        let orders = getState().orders || [];
        if (params.status) {
          orders = orders.filter((o) => o.status === params.status);
        }
        if (params.customer) {
          orders = orders.filter((o) => o.customer === params.customer);
        }
        return orders;
      },
    });
  },

  async getOrder(id) {
    return apiClient(`/orders/${id}`, {
      method: 'GET',
      fallback: () => {
        const orders = getState().orders || [];
        return orders.find((o) => String(o.id) === String(id)) || orders[0] || null;
      },
    });
  },

  async createOrder(orderPayload) {
    return apiClient('/orders', {
      method: 'POST',
      body: orderPayload,
      fallback: () => storeCreateOrder(orderPayload),
    });
  },

  async updateOrder(id, orderData) {
    return apiClient(`/orders/${id}`, {
      method: 'PUT',
      body: orderData,
      fallback: () => ({ id, ...orderData }),
    });
  },

  async updateOrderStatus(id, status) {
    return apiClient(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
      fallback: () => {
        storeUpdateStatus(id, status);
        const orders = getState().orders || [];
        return orders.find((o) => String(o.id) === String(id));
      },
    });
  },

  async assignDeliveryPartner(id, driverName) {
    return apiClient(`/orders/${id}/assign`, {
      method: 'POST',
      body: { driverName },
      fallback: () => {
        storeAssignDelivery(id, driverName);
        const orders = getState().orders || [];
        return orders.find((o) => String(o.id) === String(id));
      },
    });
  },

  async cancelOrder(id) {
    return apiClient(`/orders/${id}/cancel`, {
      method: 'POST',
      fallback: () => {
        storeUpdateStatus(id, 'CANCELLED');
        const orders = getState().orders || [];
        return orders.find((o) => String(o.id) === String(id));
      },
    });
  },
};
