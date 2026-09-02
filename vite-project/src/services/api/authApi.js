import { apiClient } from './apiClient';
import { authStorage } from '../storage/authStorage';
import { registerCustomer } from '../prototypeStore';

export const authApi = {
  async login({ identifier, password, role = 'customer' }) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { identifier, password, role },
      fallback: () => {
        const user = {
          id: `u-${Date.now()}`,
          name: identifier.includes('@') ? identifier.split('@')[0] : 'Golden User',
          email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
          role,
          token: `token-${Date.now()}`,
        };

        if (role === 'customer') {
          registerCustomer({ name: user.name, mobile: '9876543210', email: user.email });
          authStorage.setCustomerAuth(user);
        } else if (role === 'admin') {
          authStorage.setAdminAuth(user);
        } else if (role === 'delivery') {
          authStorage.setDeliveryAuth(user);
        } else if (role === 'support') {
          authStorage.setSupportAuth(user);
        }

        return { success: true, user, token: user.token };
      },
    });
  },

  async register({ name, email, mobile, password }) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, mobile, password },
    });
  },

  async logout(role = 'customer') {
    return apiClient('/auth/logout', {
      method: 'POST',
      body: { role },
      fallback: () => {
        if (role === 'customer') authStorage.clearCustomerAuth();
        else if (role === 'admin') authStorage.clearAdminAuth();
        else if (role === 'delivery') authStorage.clearDeliveryAuth();
        else if (role === 'support') authStorage.clearSupportAuth();
        return { success: true };
      },
    });
  },

  async getCurrentUser(role = 'customer') {
    return apiClient('/auth/me', {
      method: 'GET',
      fallback: () => {
        if (role === 'customer') return authStorage.getCustomerUser();
        if (role === 'admin') return authStorage.getAdminUser();
        if (role === 'delivery') return authStorage.getDeliveryUser();
        if (role === 'support') return authStorage.getSupportUser();
        return null;
      },
    });
  },

  async refreshSession() {
    return apiClient('/auth/refresh', {
      method: 'POST',
      fallback: () => ({ success: true }),
    });
  },

  async verifySession(role = 'customer') {
    return apiClient('/auth/verify', {
      method: 'GET',
      fallback: () => {
        if (role === 'customer') return authStorage.getCustomerAuth();
        if (role === 'admin') return authStorage.getAdminAuth();
        if (role === 'delivery') return authStorage.getDeliveryAuth();
        if (role === 'support') return authStorage.getSupportAuth();
        return false;
      },
    });
  },

  async sendOtp({ email, mobile }) {
    return apiClient('/auth/send-otp', {
      method: 'POST',
      body: { email, mobile },
    });
  },

  async verifyOtp({ email, mobile, otp }) {
    return apiClient('/auth/verify-otp', {
      method: 'POST',
      body: { email, mobile, otp },
    });
  },
};
