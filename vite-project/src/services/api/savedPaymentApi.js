import { apiClient } from './apiClient';

export const savedPaymentApi = {
  async getSavedPayments(userId) {
    if (!userId) return { success: false, data: [] };
    return apiClient(`/customers/${userId}/payments`, {
      method: 'GET',
    });
  },

  async createSavedPayment(userId, paymentData) {
    return apiClient(`/customers/${userId}/payments`, {
      method: 'POST',
      body: paymentData,
    });
  },

  async deleteSavedPayment(userId, paymentId) {
    return apiClient(`/customers/${userId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },
};
