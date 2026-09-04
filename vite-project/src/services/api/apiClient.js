import { authStorage } from '../storage/authStorage';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
  API_BASE_URL = '/api';
}
// Strip trailing slash if any
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Force consistent routing to /api in case Vercel env vars are incorrectly set to /aws-api
if (API_BASE_URL.includes('aws-api')) {
  API_BASE_URL = '/api';
}

/**
 * Production-ready API Client for Golden Food Bowl Backend Integration.
 * Automatically handles standard HTTP requests, authorization headers,
 * JSON parsing, and central error handling.
 */
export async function apiClient(endpoint, { method = 'GET', body = null, headers = {}, fallback = null } = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}${method === 'GET' ? (cleanEndpoint.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`) : ''}`;

  // Resolve token based on active role
  const activeRole = authStorage.getAnyActiveRole();
  let user = null;
  
  if (activeRole === 'customer') user = authStorage.getCustomerUser();
  else if (activeRole === 'admin') user = authStorage.getAdminUser();
  else if (activeRole === 'support') user = authStorage.getSupportUser();
  else if (activeRole === 'delivery') user = authStorage.getDeliveryUser();

  const token = user?.token || user?.accessToken || '';
  const role = user?.role ? user.role.toUpperCase() : (activeRole ? activeRole.toUpperCase() : 'CUSTOMER');
  const email = user?.email || 'guest@goldenbowl.com';

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-role': role,
      'x-user-email': email,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          const isCustomer = window.location.pathname.startsWith('/customer') || window.location.pathname === '/';
          if (!isCustomer) {
             const activeRole = authStorage.getAnyActiveRole();
             if (activeRole === 'admin') authStorage.clearAdminAuth();
             if (activeRole === 'support') authStorage.clearSupportAuth();
             if (activeRole === 'delivery') authStorage.clearDeliveryAuth();
             if (activeRole === 'customer') authStorage.clearCustomerAuth();
             
             // Trigger event for UI to catch and redirect
             window.dispatchEvent(new CustomEvent('auth-expired'));
          }
        }
      }

      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // Non-JSON response (e.g. 404 HTML from proxy)
        if (response.status === 401) {
          errorMessage = 'Your session has expired. Please sign in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'The requested service endpoint is unavailable. Please check backend connection.';
        } else if (response.status >= 500) {
          errorMessage = 'The server encountered an error. Please try again in a few moments.';
        }
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      if (text.trim().startsWith('<')) {
         throw new Error('API returned HTML instead of JSON. The route might be missing on the backend.');
      }
      return JSON.parse(text);
    }
  } catch (error) {
    if (fallback) {
      return await Promise.resolve(fallback());
    }
    throw error;
  }
}
