import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: string;
  provider: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  googleLogin: (credential: string) => Promise<boolean>;
  sendOtp: (
    email: string,
    type: 'login' | 'registration'
  ) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (
    email: string,
    otp: string,
    type: 'login' | 'registration',
    name?: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) return false;

      const response = await api.post('/auth/refresh-token', {
        refreshToken: storedRefreshToken,
      });

      if (response.data.success) {
        const { User: userData, token } = response.data.data;
        setUser(userData);
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Auto token refresh setup
  useEffect(() => {
    const setupTokenRefresh = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // Refresh token 5 minutes before expiry
        const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

        setTimeout(async () => {
          const success = await refreshToken();
          if (success) {
            setupTokenRefresh(); // Setup next refresh
          } else {
            logout(); // Force logout if refresh fails
          }
        }, refreshTime);
      } catch (error) {
        console.error('Error setting up token refresh:', error);
      }
    };

    setupTokenRefresh();
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // Check if token is expired
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();

          if (isExpired) {
            // Try to refresh token
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
              // Clear invalid session
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setIsLoading(false);
              return;
            }
          } else {
            setUser(parsedUser);
            api.defaults.headers.common[
              'Authorization'
            ] = `Bearer ${storedToken}`;
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const googleLogin = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google-login', {
        idToken: credential,
      });

      if (response.data.success) {
        const {
          User: userData,
          token,
          refreshToken: newRefreshToken,
        } = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(
        'Google login error:',
        error.response?.data?.message || error.message
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (
    email: string,
    type: 'login' | 'registration'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/send-otp', { email, type });
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to send OTP. Please try again.',
      };
    }
  };

  const verifyOtp = async (
    email: string,
    otp: string,
    type: 'login' | 'registration',
    name?: string
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const payload: any = { email, otp, type };
      if (type === 'registration' && name) {
        payload.name = name;
      }

      const response = await api.post('/auth/verify-otp', payload);

      if (response.data.success) {
        const {
          User: userData,
          token,
          refreshToken: newRefreshToken,
        } = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Verification failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Verification failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        googleLogin,
        sendOtp,
        verifyOtp,
        logout,
        isLoading,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
