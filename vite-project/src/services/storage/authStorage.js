const KEYS = {
  CUSTOMER_AUTH: 'bowlCustomerAuth',
  CUSTOMER_USER: 'bowlCustomerUser',
  CUSTOMER_PENDING_REDIRECT: 'bowlCustomerPendingRedirect',
  ADMIN_AUTH: 'bowlAdminAuth',
  ADMIN_USER: 'bowlAdminUser',
  DELIVERY_AUTH: 'bowlDeliveryAuth',
  DELIVERY_USER: 'bowlDeliveryUser',
  DELIVERY_ONBOARDING: 'bowlDeliveryOnboarding',
  SUPPORT_AUTH: 'bowlSupportAuth',
  SUPPORT_USER: 'bowlSupportUser',
};

export const authStorage = {
  // Customer Auth
  getCustomerAuth() {
    return sessionStorage.getItem(KEYS.CUSTOMER_AUTH) === '1';
  },
  setCustomerAuth(user = null) {
    sessionStorage.setItem(KEYS.CUSTOMER_AUTH, '1');
    if (user) sessionStorage.setItem(KEYS.CUSTOMER_USER, JSON.stringify(user));
  },
  clearCustomerAuth() {
    sessionStorage.removeItem(KEYS.CUSTOMER_AUTH);
    sessionStorage.removeItem(KEYS.CUSTOMER_USER);
  },
  getCustomerUser() {
    try {
      const data = sessionStorage.getItem(KEYS.CUSTOMER_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getPendingRedirect() {
    return sessionStorage.getItem(KEYS.CUSTOMER_PENDING_REDIRECT);
  },
  setPendingRedirect(path) {
    sessionStorage.setItem(KEYS.CUSTOMER_PENDING_REDIRECT, path);
  },
  clearPendingRedirect() {
    sessionStorage.removeItem(KEYS.CUSTOMER_PENDING_REDIRECT);
  },

  // Admin Auth
  getAdminAuth() {
    const isAuth = sessionStorage.getItem(KEYS.ADMIN_AUTH) === '1' || localStorage.getItem(KEYS.ADMIN_AUTH) === '1';
    if (!isAuth) return false;
    const user = this.getAdminUser();
    if (user && user.role && user.role.toUpperCase() !== 'ADMIN') {
      this.clearAdminAuth();
      return false;
    }
    return true;
  },
  setAdminAuth(user = null) {
    sessionStorage.setItem(KEYS.ADMIN_AUTH, '1');
    localStorage.setItem(KEYS.ADMIN_AUTH, '1');
    if (user) {
      const data = JSON.stringify(user);
      sessionStorage.setItem(KEYS.ADMIN_USER, data);
      localStorage.setItem(KEYS.ADMIN_USER, data);
    }
  },
  clearAdminAuth() {
    sessionStorage.removeItem(KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(KEYS.ADMIN_USER);
    localStorage.removeItem(KEYS.ADMIN_AUTH);
    localStorage.removeItem(KEYS.ADMIN_USER);
  },
  getAdminUser() {
    try {
      const data = sessionStorage.getItem(KEYS.ADMIN_USER) || localStorage.getItem(KEYS.ADMIN_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  getAdminToken() {
    const user = this.getAdminUser();
    return user?.accessToken || user?.token || null;
  },
  getAdminRefreshToken() {
    const user = this.getAdminUser();
    return user?.refreshToken || null;
  },
  updateAdminTokens({ accessToken, refreshToken }) {
    const user = this.getAdminUser() || {};
    if (accessToken) {
      user.token = accessToken;
      user.accessToken = accessToken;
    }
    if (refreshToken) {
      user.refreshToken = refreshToken;
    }
    this.setAdminAuth(user);
  },

  // Delivery Auth
  getDeliveryAuth() {
    return sessionStorage.getItem(KEYS.DELIVERY_AUTH) === '1' || localStorage.getItem(KEYS.DELIVERY_AUTH) === '1';
  },
  setDeliveryAuth(user = null) {
    sessionStorage.setItem(KEYS.DELIVERY_AUTH, '1');
    localStorage.setItem(KEYS.DELIVERY_AUTH, '1');
    if (user) {
      const data = JSON.stringify(user);
      sessionStorage.setItem(KEYS.DELIVERY_USER, data);
      localStorage.setItem(KEYS.DELIVERY_USER, data);
    }
  },
  clearDeliveryAuth() {
    sessionStorage.removeItem(KEYS.DELIVERY_AUTH);
    sessionStorage.removeItem(KEYS.DELIVERY_USER);
    localStorage.removeItem(KEYS.DELIVERY_AUTH);
    localStorage.removeItem(KEYS.DELIVERY_USER);
    localStorage.removeItem(KEYS.DELIVERY_ONBOARDING);
    localStorage.removeItem('bowlDeliveryLocation');
  },
  getDeliveryUser() {
    try {
      const data = sessionStorage.getItem(KEYS.DELIVERY_USER) || localStorage.getItem(KEYS.DELIVERY_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Support Auth
  getSupportAuth() {
    return sessionStorage.getItem(KEYS.SUPPORT_AUTH) === '1';
  },
  setSupportAuth(user = null) {
    sessionStorage.setItem(KEYS.SUPPORT_AUTH, '1');
    if (user) sessionStorage.setItem(KEYS.SUPPORT_USER, JSON.stringify(user));
  },
  clearSupportAuth() {
    sessionStorage.removeItem(KEYS.SUPPORT_AUTH);
    sessionStorage.removeItem(KEYS.SUPPORT_USER);
  },
  getSupportUser() {
    try {
      const data = sessionStorage.getItem(KEYS.SUPPORT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Generic helpers across roles
  getUserForRole(role) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return this.getAdminUser();
    if (r === 'support') return this.getSupportUser();
    if (r === 'delivery') return this.getDeliveryUser();
    if (r === 'customer') return this.getCustomerUser();
    return null;
  },
  getTokenForRole(role) {
    const user = this.getUserForRole(role);
    return user?.accessToken || user?.token || null;
  },
  getRefreshTokenForRole(role) {
    const user = this.getUserForRole(role);
    return user?.refreshToken || null;
  },
  updateTokens(role, { accessToken, refreshToken }) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') {
      this.updateAdminTokens({ accessToken, refreshToken });
    } else {
      const user = this.getUserForRole(r) || {};
      if (accessToken) {
        user.token = accessToken;
        user.accessToken = accessToken;
      }
      if (refreshToken) user.refreshToken = refreshToken;
      if (r === 'delivery') this.setDeliveryAuth(user);
      else if (r === 'support') this.setSupportAuth(user);
      else if (r === 'customer') this.setCustomerAuth(user);
    }
  },
  clearAuthForRole(role) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') this.clearAdminAuth();
    else if (r === 'support') this.clearSupportAuth();
    else if (r === 'delivery') this.clearDeliveryAuth();
    else if (r === 'customer') this.clearCustomerAuth();
  },

  // Check if a JWT is expired client-side without network call
  isTokenExpired(token) {
    if (!token || typeof token !== 'string') return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      // Expired if within 10 seconds of expiry
      return Date.now() >= (payload.exp * 1000 - 10000);
    } catch {
      return true;
    }
  },

  // Context-aware role resolution
  getAnyActiveRole(explicitHint = null) {
    if (explicitHint) {
      const hint = explicitHint.toLowerCase();
      if (hint === 'admin' && this.getAdminAuth()) return 'admin';
      if (hint === 'support' && this.getSupportAuth()) return 'support';
      if (hint === 'delivery' && this.getDeliveryAuth()) return 'delivery';
      if (hint === 'customer' && this.getCustomerAuth()) return 'customer';
    }

    // Inspect browser path context if running in browser
    if (typeof window !== 'undefined' && window.location?.pathname) {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && this.getAdminAuth()) return 'admin';
      if (path.startsWith('/support') && this.getSupportAuth()) return 'support';
      if (path.startsWith('/delivery') && this.getDeliveryAuth()) return 'delivery';
      if (path.startsWith('/customer') && this.getCustomerAuth()) return 'customer';
    }

    // Default priority order: Admin > Support > Delivery > Customer
    if (this.getAdminAuth()) return 'admin';
    if (this.getSupportAuth()) return 'support';
    if (this.getDeliveryAuth()) return 'delivery';
    if (this.getCustomerAuth()) return 'customer';
    return null;
  },
};
