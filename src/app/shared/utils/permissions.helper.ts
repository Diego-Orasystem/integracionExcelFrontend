import { Injectable } from '@angular/core';
import { User } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionsHelper {
  /**
   * Verifica si un usuario tiene un permiso específico
   * @param user - El objeto de usuario actual
   * @param permissionCode - El código del permiso a verificar
   * @returns true si el usuario tiene el permiso, false en caso contrario
   */
  hasPermission(user: User | null, permissionCode: string): boolean {
    if (!user || !user.permissions || !permissionCode) {
      return false;
    }
    
    return user.permissions.includes(permissionCode);
  }
  
  /**
   * Verifica si un usuario tiene al menos uno de los permisos especificados
   * @param user - El objeto de usuario actual
   * @param permissions - Array de códigos de permisos a verificar
   * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
   */
  hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user || !user.permissions || !permissions.length) {
      return false;
    }
    
    return permissions.some(permission => user.permissions!.includes(permission));
  }
  
  /**
   * Verifica si un usuario tiene todos los permisos especificados
   * @param user - El objeto de usuario actual
   * @param permissions - Array de códigos de permisos a verificar
   * @returns true si el usuario tiene todos los permisos, false en caso contrario
   */
  hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user || !user.permissions || !permissions.length) {
      return false;
    }
    
    return permissions.every(permission => user.permissions!.includes(permission));
  }
} 