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

async function fetchClient(endpoint: string, { data, params, headers: customHeaders, ...customConfig }: RequestConfig = {}): Promise<Response> {
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    credentials: 'include', 
    headers: {
      'Content-Type': data instanceof FormData ? '' : 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    },
    ...customConfig,
  };

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
    throw new ApiError(0, 'Network transmission failed. Verify your connection to the node.');
  }

  if (response.status === 204) {
    return new Response(null, { status: 204, statusText: 'No Content' });
  }

  let responseData;
  try {
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
    const isErrorObj = typeof responseData === 'object' && responseData !== null && 'error' in responseData;
    const errorMessage = isErrorObj ? (responseData as any).error : response.statusText || 'Unknown pipeline failure';
      
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new ApiError(response.status, errorMessage, responseData);
  }

  const proxyResponse = new Response(
    typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
    { status: response.status, statusText: response.statusText, headers: response.headers }
  );

  Object.defineProperty(proxyResponse, 'json', {
    value: async () => responseData
  });

  return proxyResponse;
}

export const api = {
  get: (endpoint: string, config?: RequestConfig) => fetchClient(endpoint, { ...config, method: 'GET' }),
  post: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'POST' }),
  put: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'PUT' }),
  patch: (endpoint: string, data?: any, config?: RequestConfig) => fetchClient(endpoint, { ...config, data, method: 'PATCH' }),
  delete: (endpoint: string, config?: RequestConfig) => fetchClient(endpoint, { ...config, method: 'DELETE' }),
};
