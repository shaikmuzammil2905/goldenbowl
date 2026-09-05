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
 * automatic token refresh on HTTP 401, JSON parsing, and central error handling.
 */
export async function apiClient(endpoint, {
  method = 'GET',
  body = null,
  headers = {},
  fallback = null,
  role: explicitRole = null,
  isRetry = false,
} = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}${method === 'GET' ? (cleanEndpoint.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`) : ''}`;

  // 1. Context-aware role detection
  let targetRole = explicitRole;
  if (!targetRole) {
    if (cleanEndpoint.startsWith('/admin')) targetRole = 'admin';
    else if (cleanEndpoint.startsWith('/delivery')) targetRole = 'delivery';
    else if (cleanEndpoint.startsWith('/support')) targetRole = 'support';
    else if (cleanEndpoint.startsWith('/customer')) targetRole = 'customer';
    else if (typeof window !== 'undefined' && window.location?.pathname) {
      const p = window.location.pathname;
      if (p.startsWith('/admin')) targetRole = 'admin';
      else if (p.startsWith('/delivery')) targetRole = 'delivery';
      else if (p.startsWith('/support')) targetRole = 'support';
      else if (p.startsWith('/customer')) targetRole = 'customer';
    }
  }

  const activeRole = authStorage.getAnyActiveRole(targetRole);
  const user = authStorage.getUserForRole(activeRole);

  const token = user?.accessToken || user?.token || '';
  const refreshToken = user?.refreshToken || '';
  const roleHeader = user?.role ? user.role.toUpperCase() : (activeRole ? activeRole.toUpperCase() : 'CUSTOMER');
  const emailHeader = user?.email || 'guest@goldenbowl.com';

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-user-role': roleHeader,
      'x-user-email': emailHeader,
      ...headers,
    },
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // 2. Handle HTTP 401 (Unauthorized / Token Expired) with Token Refresh
    if (response.status === 401) {
      const isAuthEndpoint = cleanEndpoint.includes('/auth/login') ||
                             cleanEndpoint.includes('/auth/refresh') ||
                             cleanEndpoint.includes('/auth/register');

      if (!isRetry && !isAuthEndpoint && refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.accessToken || refreshData.token;
            const newRefreshToken = refreshData.refreshToken || refreshToken;

            if (newAccessToken) {
              authStorage.updateTokens(activeRole, {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              });

              // Retry original request ONCE with new access token
              return await apiClient(endpoint, {
                method,
                body,
                headers,
                fallback,
                role: activeRole,
                isRetry: true,
              });
            }
          }
        } catch (refreshErr) {
          console.warn('[apiClient] Automatic token refresh failed:', refreshErr.message);
        }
      }

      // If refresh failed or not available, clear invalid authentication state
      if (!isAuthEndpoint && activeRole) {
        authStorage.clearAuthForRole(activeRole);
        if (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin') && !window.location.pathname.includes('/signin')) {
          window.location.href = '/admin/signin?session=expired';
        }
      }

      let errorMsg = 'Your session has expired or is invalid. Please sign in again.';
      try {
        const errJson = await response.json();
        if (errJson?.message) errorMsg = errJson.message;
      } catch {}
      const authError = new Error(errorMsg);
      authError.status = 401;
      throw authError;
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'The requested service endpoint is unavailable. Please check backend connection.';
        } else if (response.status >= 500) {
          errorMessage = 'The server encountered an error. Please try again in a few moments.';
        }
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
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
    if (fallback && !error.status) {
      return await Promise.resolve(fallback());
    }
    throw error;
  }
}
