import { apiClient } from './apiClient';
import { getState } from '../prototypeStore';

export const customerApi = {
  async getCustomers() {
    return apiClient('/customers', {
      method: 'GET',
      fallback: () => getState().users || [],
    });
  },

  async getCustomer(id) {
    return apiClient(`/customers/${id}`, {
      method: 'GET',
      fallback: () => {
        const users = getState().users || [];
        return users.find((u) => String(u.id) === String(id)) || null;
      },
    });
  },

  async updateCustomer(id, userData) {
    return apiClient(`/customers/${id}`, {
      method: 'PUT',
      body: userData,
      fallback: () => ({ id, ...userData }),
    });
  },
};
