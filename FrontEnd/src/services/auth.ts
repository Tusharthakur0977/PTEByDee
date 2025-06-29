import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  isVerified: boolean;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: User & { token: string };
  message: string;
  statusCode: number;
}

export interface ApiError {
  success: boolean;
  data: null;
  message: string;
  statusCode: number;
}

// Register user
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
  });
  return response.data;
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

// Google login
export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/google-login', {
    idToken,
  });
  return response.data;
};

// Get user profile
export const getUserProfile = async (): Promise<{
  success: boolean;
  data: User;
  message: string;
}> => {
  const response = await api.get('/user/profile');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (
  userData: Partial<User>
): Promise<AuthResponse> => {
  const response = await api.put('/user/profile', userData);
  return response.data;
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> => {
  const response = await api.put('/user/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};
