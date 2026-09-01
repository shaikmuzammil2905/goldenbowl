import { apiClient } from './apiClient';
import { getState, registerDeliveryPartner as storeRegisterDelivery } from '../prototypeStore';

export const deliveryApi = {
  async getDeliveryPartners() {
    return apiClient('/delivery/partners', {
      method: 'GET',
      fallback: () => getState().deliveryPartners || [],
    });
  },

  async getDeliveryPartner(id) {
    return apiClient(`/delivery/partners/${id}`, {
      method: 'GET',
      fallback: () => {
        const partners = getState().deliveryPartners || [];
        return partners.find((p) => String(p.id) === String(id)) || partners[0] || null;
      },
    });
  },

  async registerDeliveryPartner(profileData) {
    return apiClient('/delivery/register', {
      method: 'POST',
      body: profileData,
      fallback: () => storeRegisterDelivery(profileData),
    });
  },

  async updateDeliveryStatus(id, status) {
    return apiClient(`/delivery/partners/${id}/status`, {
      method: 'PATCH',
      body: { status },
      fallback: () => ({ success: true, id, status }),
    });
  },

  async updateAvailability(id, isAvailable) {
    return apiClient(`/delivery/partners/${id}/availability`, {
      method: 'PATCH',
      body: { available: isAvailable },
      fallback: () => ({ success: true, id, available: isAvailable }),
    });
  },

  async getWallet(partnerId = 'dp1') {
    return apiClient(`/delivery/partners/${partnerId}/wallet`, {
      method: 'GET',
      fallback: () => ({
        balance: 2840,
        todayEarnings: 1450,
        tripsCount: 14,
        history: [
          { id: 'tx-1', amount: 320, orderId: 'BWL10245', timestamp: new Date().toISOString() },
          { id: 'tx-2', amount: 280, orderId: 'BWL10242', timestamp: new Date().toISOString() },
        ],
      }),
    });
  },

  async getDeliveryOrders(partnerId = 'dp1') {
    return apiClient(`/delivery/partners/${partnerId}/orders`, {
      method: 'GET',
      fallback: () => getState().orders || [],
    });
  },
};
