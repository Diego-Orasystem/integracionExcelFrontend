import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Role, RoleResponse, RolesResponse,
  Permission, PermissionResponse, PermissionsResponse,
  UserRole, UserRoleResponse, UserRolesResponse
} from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Roles
  getRoles(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(`${this.apiUrl}/roles`);
  }

  getRole(id: string): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/roles/${id}`);
  }

  createRole(role: Partial<Role>): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`${this.apiUrl}/roles`, role);
  }

  updateRole(id: string, role: Partial<Role>): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/roles/${id}`, role);
  }

  deleteRole(id: string): Observable<RoleResponse> {
    return this.http.delete<RoleResponse>(`${this.apiUrl}/roles/${id}`);
  }

  // Permisos
  getPermissions(): Observable<PermissionsResponse> {
    return this.http.get<PermissionsResponse>(`${this.apiUrl}/permissions`);
  }

  getPermission(id: string): Observable<PermissionResponse> {
    return this.http.get<PermissionResponse>(`${this.apiUrl}/permissions/${id}`);
  }

  createPermission(permission: Partial<Permission>): Observable<PermissionResponse> {
    return this.http.post<PermissionResponse>(`${this.apiUrl}/permissions`, permission);
  }

  updatePermission(id: string, permission: Partial<Permission>): Observable<PermissionResponse> {
    return this.http.put<PermissionResponse>(`${this.apiUrl}/permissions/${id}`, permission);
  }

  deletePermission(id: string): Observable<PermissionResponse> {
    return this.http.delete<PermissionResponse>(`${this.apiUrl}/permissions/${id}`);
  }

  // Asignación de roles a usuarios
  getUserRoles(userId: string): Observable<UserRolesResponse> {
    return this.http.get<UserRolesResponse>(`${this.apiUrl}/user-roles/user/${userId}`);
  }

  assignRoleToUser(userRole: Partial<UserRole>): Observable<UserRoleResponse> {
    return this.http.post<UserRoleResponse>(`${this.apiUrl}/user-roles`, userRole);
  }

  updateUserRole(id: string, userRole: Partial<UserRole>): Observable<UserRoleResponse> {
    return this.http.put<UserRoleResponse>(`${this.apiUrl}/user-roles/${id}`, userRole);
  }

  revokeUserRole(id: string): Observable<UserRoleResponse> {
    return this.http.delete<UserRoleResponse>(`${this.apiUrl}/user-roles/${id}`);
  }
} 