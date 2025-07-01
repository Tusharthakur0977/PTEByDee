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

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const googleLogin = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google-login', {
        idToken: credential,
      });

      if (response.data.success) {
        const { User: userData, token } = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
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
        const { User: userData, token } = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
