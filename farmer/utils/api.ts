import { BASE_URL } from './config';

// Common request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

interface ApiError {
  message: string;
  status?: number;
}

// Fetch wrapper with error handling
async function request<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  token?: string | null,
  customHeaders?: Record<string, string>
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Prepare headers with authentication token if provided
  const headers = {
    ...DEFAULT_HEADERS,
    ...customHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
  };

  // Add request body for non-GET requests
  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      // Handle API error responses
      const error: ApiError = {
        message: responseData.message || 'Something went wrong',
        status: response.status,
      };
      
      throw error;
    }

    return {
      data: responseData,
      success: true,
    };
  } catch (error: any) {
    // Handle network errors and JSON parsing errors
    if (error.status) {
      // This is an API error we threw above
      throw error;
    } else {
      // This is a network or other fetch error
      throw {
        message: error.message || 'Network error',
        status: 500,
      };
    }
  }
}

// API client with common HTTP methods
export const api = {
  // GET request
  get: async <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data as T,
        message: data.message,
        errors: data.errors,
      };
    } catch (error) {
      console.error('API GET Error:', error);
      return {
        success: false,
        data: {} as T,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  },
  
  // POST request
  post: async <T>(endpoint: string, body: any, token?: string): Promise<ApiResponse<T>> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data as T,
        message: data.message,
        errors: data.errors,
      };
    } catch (error) {
      console.error('API POST Error:', error);
      return {
        success: false,
        data: {} as T,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  },
  
  // PUT request
  put: async <T>(endpoint: string, body: any, token?: string): Promise<ApiResponse<T>> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data as T,
        message: data.message,
        errors: data.errors,
      };
    } catch (error) {
      console.error('API PUT Error:', error);
      return {
        success: false,
        data: {} as T,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  },
  
  // PATCH request
  patch: <T>(endpoint: string, data: any, token?: string | null) => 
    request<T>(endpoint, 'PATCH', data, token),
  
  // DELETE request
  delete: async <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data as T,
        message: data.message,
        errors: data.errors,
      };
    } catch (error) {
      console.error('API DELETE Error:', error);
      return {
        success: false,
        data: {} as T,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  },

  // Special method for form data uploads (for images)
  uploadForm: async <T>(endpoint: string, formData: FormData, token?: string): Promise<ApiResponse<T>> => {
    try {
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data as T,
        message: data.message,
        errors: data.errors,
      };
    } catch (error) {
      console.error('API Upload Error:', error);
      return {
        success: false,
        data: {} as T,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  },
};

// Common API endpoints
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
  },
  products: {
    list: '/api/products',
    details: (id: string) => `/api/products/${id}`,
    create: '/api/products',
    update: (id: string) => `/api/products/${id}`,
    delete: (id: string) => `/api/products/${id}`,
  },
  orders: {
    list: '/api/orders',
    farmer: '/api/orders/farmer',
    details: (id: string) => `/api/orders/${id}`,
    updateStatus: (id: string) => `/api/orders/${id}/status`,
    updateItemStatus: (id: string) => `/api/orders/item/${id}/status`,
  },
  messages: {
    list: '/api/messages',
    conversation: (userId: string) => `/api/messages/${userId}`,
    send: '/api/messages/send',
  },
  dashboard: {
    stats: '/api/dashboard/stats',
  },
};

// Export a default API instance
export default api; 