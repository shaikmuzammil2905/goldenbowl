let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
  API_BASE_URL = '/api';
}

/**
 * Production-ready API Client for AWS API Gateway / Backend Integration.
 * Automatically handles standard HTTP requests, authorization headers,
 * JSON parsing, and central error handling.
 */
export async function apiClient(endpoint, { method = 'GET', body = null, headers = {}, fallback = null } = {}) {
  const url = `${API_BASE_URL}${endpoint}${method === 'GET' ? (endpoint.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`) : ''}`;
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token-admin-goldenbowl',
      'x-user-role': 'ADMIN',
      'x-user-email': 'admin@goldenbowl.com',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // Non-JSON response body
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (fallback) {
      return await Promise.resolve(fallback());
    }
    throw error;
  }
}
