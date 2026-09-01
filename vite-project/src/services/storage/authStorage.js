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
    return sessionStorage.getItem(KEYS.ADMIN_AUTH) === '1';
  },
  setAdminAuth(user = null) {
    sessionStorage.setItem(KEYS.ADMIN_AUTH, '1');
    if (user) sessionStorage.setItem(KEYS.ADMIN_USER, JSON.stringify(user));
  },
  clearAdminAuth() {
    sessionStorage.removeItem(KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(KEYS.ADMIN_USER);
  },
  getAdminUser() {
    try {
      const data = sessionStorage.getItem(KEYS.ADMIN_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Delivery Auth
  getDeliveryAuth() {
    const sessionReady = sessionStorage.getItem(KEYS.DELIVERY_AUTH) === '1';
    let onboardingReady = false;
    try {
      const onboarding = JSON.parse(localStorage.getItem(KEYS.DELIVERY_ONBOARDING) || '{}');
      if (onboarding.verificationStatus === 'VERIFIED') onboardingReady = true;
    } catch {
      // Ignore JSON parse error
    }
    return sessionReady || onboardingReady;
  },
  setDeliveryAuth(user = null) {
    sessionStorage.setItem(KEYS.DELIVERY_AUTH, '1');
    if (user) sessionStorage.setItem(KEYS.DELIVERY_USER, JSON.stringify(user));
  },
  clearDeliveryAuth() {
    sessionStorage.removeItem(KEYS.DELIVERY_AUTH);
    sessionStorage.removeItem(KEYS.DELIVERY_USER);
  },
  getDeliveryUser() {
    try {
      const data = sessionStorage.getItem(KEYS.DELIVERY_USER);
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
