// User Interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  condominiumIds: string[]; // Condominiums this user can manage
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer'
}

export interface UserPermissions {
  canManageCondominiums: boolean;
  canManageResidents: boolean;
  canManageInvoices: boolean;
  canManagePayments: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageMaintenance: boolean;
  canSendNotifications: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
