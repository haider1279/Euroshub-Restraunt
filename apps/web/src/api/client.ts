function getApiBase(): string {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '').trim();
  if (!envUrl) {
    return '/api';
  }
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

export const API_BASE = getApiBase();

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

// In-memory access token storage (never persisted to localStorage)
let inMemoryAccessToken: string | null = null;

export const getAccessToken = (): string | null => inMemoryAccessToken;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

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
  const token = getAccessToken();

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
          setAccessToken(data.accessToken);
          processQueue(null, data.accessToken);

          // Retry initial request with new token
          (headers as any)['Authorization'] = `Bearer ${data.accessToken}`;
          response = await fetch(url, { ...options, headers, credentials: 'include' });
        } else {
          setAccessToken(null);
          processQueue(new Error('Session expired'), null);
          localStorage.removeItem('euroshub_user');
        }
      } catch (err) {
        setAccessToken(null);
        processQueue(err, null);
        localStorage.removeItem('euroshub_user');
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for existing refresh to resolve
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            const tokenToUse = typeof newToken === 'string' ? newToken : getAccessToken();
            if (tokenToUse) (headers as any)['Authorization'] = `Bearer ${tokenToUse}`;
            fetch(url, { ...options, headers, credentials: 'include' })
              .then(async (res) => {
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}));
                  throw new ApiError(
                    errorData?.error?.code || 'API_ERROR',
                    errorData?.error?.message || `Request failed with status ${res.status}`,
                    res.status,
                    errorData?.error?.details
                  );
                }
                return res.json();
              })
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
