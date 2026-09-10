const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;

  constructor(code: string, message: string, statusCode: number, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('euroshub_access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData (e.g. file upload), remove Content-Type header so browser sets boundary
  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send cookies for refresh token
  });

  // Handle 401 Unauthorized by attempting to refresh token
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('euroshub_access_token', data.accessToken);
          processQueue(null, data.accessToken);

          // Retry initial request with new token
          (headers as any)['Authorization'] = `Bearer ${data.accessToken}`;
          response = await fetch(url, { ...options, headers, credentials: 'include' });
        } else {
          processQueue(new Error('Session expired'), null);
          localStorage.removeItem('euroshub_access_token');
          localStorage.removeItem('euroshub_user');
        }
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('euroshub_access_token');
        localStorage.removeItem('euroshub_user');
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for existing refresh to resolve
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            const newToken = localStorage.getItem('euroshub_access_token');
            if (newToken) (headers as any)['Authorization'] = `Bearer ${newToken}`;
            fetch(url, { ...options, headers, credentials: 'include' })
              .then((res) => res.json())
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorInfo = data?.error || {};
    throw new ApiError(
      errorInfo.code || 'API_ERROR',
      errorInfo.message || `Request failed with status ${response.status}`,
      response.status,
      errorInfo.details
    );
  }

  return data as T;
}

export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
};
