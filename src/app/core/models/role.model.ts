export interface Role {
  id: string;
  _id?: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[] | Permission[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  _id?: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRole {
  id: string;
  _id?: string;
  userId: string;
  roleId: string;
  role?: Role;
  additionalPermissions?: string[] | Permission[];
  deniedPermissions?: string[] | Permission[];
  areaId?: string;
  subAreaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolesResponse {
  data: Role[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface RoleResponse {
  data: Role;
  message: string;
  success: boolean;
}

export interface PermissionsResponse {
  data: Permission[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface PermissionResponse {
  data: Permission;
  message: string;
  success: boolean;
}

export interface UserRolesResponse {
  data: UserRole[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface UserRoleResponse {
  data: UserRole;
  message: string;
  success: boolean;
} 