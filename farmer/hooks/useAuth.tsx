import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { api, endpoints } from '../utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address?: string;
}

interface LoginResult {
  success: boolean;
  error?: 'invalid_credentials' | 'invalid_role' | 'account_inactive' | 'server_error';
  message?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for cross-platform storage
const storeData = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getData = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const removeData = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for stored token on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await getData('userToken');
        if (storedToken) {
          const storedUser = await getData('userData');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error loading auth data', error);
        // If there's an error, we should consider the user not authenticated
        await removeData('userToken');
        await removeData('userData');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a timeout to ensure the app doesn't get stuck in the loading state
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds timeout

    loadToken();

    // Clear the timeout if the loadToken function completes before the timeout
    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>(
        endpoints.auth.login,
        { username, password }
      );

      if (response.success) {
        const { data } = response;
        
        // Verify the user is a farmer
        if (data.user.role !== 'farmer') {
          return {
            success: false,
            error: 'invalid_role',
            message: 'This app is for farmers only'
          };
        }
        
        // Check if account is active
        if (data.user.is_active === false) {
          return {
            success: false,
            error: 'account_inactive', 
            message: 'Your account has been deactivated. Please contact support.'
          };
        }
        
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Store auth data securely
        await storeData('userToken', data.token);
        await storeData('userData', JSON.stringify(data.user));
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'invalid_credentials',
          message: 'Invalid username or password'
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'server_error',
        message: error.message || 'Failed to connect to server'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Adding farmer role as this is the farmer app
      const requestData = {
        ...userData,
        role: 'farmer'
      };

      console.log('Starting registration process');
      
      const response = await api.post<{ token?: string; user?: User }>(
        endpoints.auth.register,
        requestData
      );

      console.log('Registration response:', response.success);

      if (response.success) {
        console.log('Registration successful, performing auto-login');
        try {
          const { data } = response;
          // Check if token and user were provided directly from registration
          if (data.token && data.user) {
            console.log('Token and user info received directly after registration');
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            
            // Store auth data securely
            await storeData('userToken', data.token);
            await storeData('userData', JSON.stringify(data.user));
            return true;
          } else {
            // If token/user not provided, we need to manually login
            console.log('No token/user in registration response, attempting manual login');
            const loginResult = await login(userData.username, userData.password);
            if (loginResult.success) {
              console.log('Manual login after registration succeeded');
              return true;
            } else {
              console.error('Manual login after registration failed:', loginResult.message);
              return false;
            }
          }
        } catch (loginError) {
          console.error('Error during auto-login after registration:', loginError);
          return false;
        }
      } else {
        // Registration failed
        console.error('Registration failed with message:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('Registration network/parsing error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // First clear auth state in memory
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Then clear stored data
      await removeData('userToken');
      await removeData('userData');
      
      // Finally redirect to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        token, 
        login, 
        register, 
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 