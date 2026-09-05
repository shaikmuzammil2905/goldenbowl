import { apiClient } from './apiClient';

export const addressApi = {
  async getAddresses(userId) {
    if (!userId) return { success: false, data: [] };
    return apiClient(`/customers/${userId}/addresses`, {
      method: 'GET',
    });
  },

  async createAddress(userId, addressData) {
    return apiClient(`/customers/${userId}/addresses`, {
      method: 'POST',
      body: addressData,
    });
  },

  async updateAddress(userId, addressId, addressData) {
    return apiClient(`/customers/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      body: addressData,
    });
  },

  async deleteAddress(userId, addressId) {
    return apiClient(`/customers/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },
};
