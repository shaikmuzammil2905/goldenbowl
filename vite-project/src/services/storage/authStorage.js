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
    return sessionStorage.getItem(KEYS.ADMIN_AUTH) === '1' || localStorage.getItem(KEYS.ADMIN_AUTH) === '1';
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

  // Role resolution
  getAnyActiveRole() {
    if (this.getCustomerAuth()) return 'customer';
    if (this.getAdminAuth()) return 'admin';
    if (this.getDeliveryAuth()) return 'delivery';
    if (this.getSupportAuth()) return 'support';
    return null;
  },
};
