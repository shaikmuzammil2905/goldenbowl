import { apiClient } from './apiClient';
import { authStorage } from '../storage/authStorage';
import { registerCustomer } from '../prototypeStore';

export const authApi = {
  // ── Password Login (Email or Mobile + Password) ───────────────────────────
  async login({ identifier, password, role = 'customer' }) {
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: { identifier, password, role },
      });
      if (res?.success && (res?.user || res?.data?.user)) {
        const userData = res.user || res.data?.user;
        const token = res.token || res.data?.token;
        const userObj = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          role,
          token,
        };
        authStorage.setCustomerAuth(userObj);
        return { success: true, user: userObj, token };
      }
      return res;
    } catch (err) {
      throw err;
    }
  },

  // ── Registration (Name, Email, Mobile, Password) ──────────────────────────
  async register({ name, email, mobile, password }) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, mobile, password },
    });
  },

  // ── Email OTP ─────────────────────────────────────────────────────────────
  async sendEmailOtp({ email }) {
    return apiClient('/auth/send-otp', {
      method: 'POST',
      body: { email },
    });
  },

  async verifyEmailOtp({ email, otp }) {
    return apiClient('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    });
  },

  // ── Mobile OTP ────────────────────────────────────────────────────────────
  async sendMobileOtp({ mobile }) {
    return apiClient('/auth/send-mobile-otp', {
      method: 'POST',
      body: { mobile },
    });
  },

  async verifyMobileOtp({ mobile, otp }) {
    return apiClient('/auth/verify-mobile-otp', {
      method: 'POST',
      body: { mobile, otp },
    });
  },

  // ── Legacy Aliases ────────────────────────────────────────────────────────
  async sendOtp({ email, mobile }) {
    if (email) return this.sendEmailOtp({ email });
    return this.sendMobileOtp({ mobile });
  },

  async verifyOtp({ email, mobile, otp }) {
    if (email) return this.verifyEmailOtp({ email, otp });
    return this.verifyMobileOtp({ mobile, otp });
  },

  // ── Session ───────────────────────────────────────────────────────────────
  async logout(role = 'customer') {
    try {
      await apiClient('/auth/logout', { method: 'POST', body: { role } });
    } catch (e) {
      // Ignore network errors on logout
    }
    if (role === 'customer') authStorage.clearCustomerAuth();
    else if (role === 'admin') authStorage.clearAdminAuth();
    else if (role === 'delivery') authStorage.clearDeliveryAuth();
    else if (role === 'support') authStorage.clearSupportAuth();
    return { success: true };
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
};
