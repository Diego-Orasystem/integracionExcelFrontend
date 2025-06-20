export interface User {
  id: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  password?: string;
  role?: 'admin' | 'company_admin' | 'user_control' | 'user_responsible';
  roles: ('admin' | 'company_admin' | 'user_control' | 'user_responsible')[];
  companyId?: string;
  areaId?: string;
  areaName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  loginMethod?: 'password' | 'email_code';
  preferences?: UserPreferences;
  token?: string;
  refreshToken?: string;
  permissions?: string[];
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: 'es' | 'en';
  notifications?: boolean;
  dashboardLayout?: any;
}

export interface UserResponse {
  data: User;
  message: string;
  success: boolean;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface PasswordReset {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: User;
  }
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyId?: string;
  roles?: ('admin' | 'company_admin' | 'user_control' | 'user_responsible')[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roles?: ('admin' | 'company_admin' | 'user_control' | 'user_responsible')[];
  companyId?: string;
  preferences?: UserPreferences;
} 