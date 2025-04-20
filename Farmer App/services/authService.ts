import { api, endpoints } from '../utils/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: string;
  phone?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    return api.post<{token: string; user: User}>(endpoints.auth.login, credentials);
  },
  
  register: async (userData: RegisterData) => {
    return api.post<{token: string; user: User}>(endpoints.auth.register, userData);
  },
  
  logout: async (token: string) => {
    return api.post<{success: boolean}>(endpoints.auth.logout, {}, token);
  },
  
  getProfile: async (token: string) => {
    return api.get<User>(endpoints.auth.profile, token);
  },
}; 