/**
 * Core API Client Architecture
 * Engineered for Edge-native communication with strict credential policies.
 */

// Inherit the environment's base URL, defaulting to local Vite proxy or relative path
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestConfig extends RequestInit {
  data?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

async function fetchClient(endpoint: string, { data, params, headers: customHeaders, ...customConfig }: RequestConfig = {}) {
  // Construct the query string payload if parameters are provided
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    // 'include' is critical: It commands the browser to attach the HttpOnly JWT cookie to the cross-origin or same-origin request.
    credentials: 'include', 
    headers: {
      'Content-Type': data instanceof FormData ? '' : 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    },
    ...customConfig,
  };

  // Automatically delete the Content-Type header for FormData to allow the browser to set the multipart boundary
  if (data instanceof FormData) {
    const headers = new Headers(config.headers);
    headers.delete('Content-Type');
    config.headers = headers;
    config.body = data;
  } else if (data) {
    config.body = JSON.stringify(data);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    // Handle network-level interruptions (e.g., DNS failure, offline state)
    throw new ApiError(0, 'Network transmission failed. Verify your connection to the node.');
  }

  // Handle No Content responses gracefully
  if (response.status === 204) {
    return { ok: true };
  }

  let responseData;
  try {
    // Attempt to parse the payload as JSON, fallback to raw text if the Edge worker returns a malformed response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    // Normalize structured errors sent from the Hono API
    const errorMessage = typeof responseData === 'object' && responseData?.error 
      ? responseData.error 
      : response.statusText || 'Unknown pipeline failure';
      
    // 401 Unauthorized Handler - Can be used to trigger global logout events if needed
    if (response.status === 401 && typeof window !== 'undefined') {
      // DisPATCH custom event to notify the AuthContext or global state to flush user data
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new ApiError(response.status, errorMessage, responseData);
  }

  // Extend the native Response object to automatically wrap the parsed data for backward compatibility
  // if you choose to use `await api.get().then(res => res.json())` instead of directly consuming the data.
  const proxyResponse = new Response(
    typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
    { status: response.status, statusText: response.statusText, headers: response.headers }
  );

  // Attach a pre-parsed json payload to prevent secondary parsing costs in components
  Object.defineProperty(proxyResponse, 'json', {
    value: async () => responseData
  });

  return proxyResponse;
}

// Exported standard execution vectors
export const api = {
  get: (endpoint: string, config?: RequestConfig) => fetchClient(endpoint, { ...config, method: 'GET' }),
  post: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'POST' }),
  put: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'PUT' }),
  patch: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'PATCH' }),
  delete: (endpoint: string, config?: RequestConfig) => fetchClient(endpoint, { ...config, method: 'DELETE' }),
};
