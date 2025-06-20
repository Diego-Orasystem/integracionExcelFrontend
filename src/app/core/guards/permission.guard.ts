import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const user = this.authService.currentUser;
    
    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Si es administrador, permitir acceso completo
    if (user.roles?.includes('admin')) {
      return true;
    }

    // Verificar los permisos requeridos para la ruta
    const requiredPermissions = route.data['permissions'] as string[];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No se requieren permisos específicos
    }

    // Obtener los roles y permisos del usuario
    return this.roleService.getUserRoles(user.id).pipe(
      map(response => {
        const userRoles = response.data;
        
        // Si no tiene roles asignados, verificar si sus roles básicos son suficientes
        if (!userRoles || userRoles.length === 0) {
          // Verificar los roles permitidos para la ruta
          const allowedRoles = route.data['roles'] as string[];
          if (allowedRoles && user.roles?.some((role: string) => allowedRoles.includes(role as any))) {
            return true;
          }
          
          this.router.navigate(['/forbidden']);
          return false;
        }

        // Verificar permisos en los roles asignados
        let hasPermission = false;

        // Recorremos los roles asignados y sus permisos
        for (const userRole of userRoles) {
          // Obtener el rol completo con sus permisos
          const roleId = userRole.roleId;
          
          // Verificamos si ha sido denegado específicamente algún permiso requerido
          const deniedPermissions = userRole.deniedPermissions || [];
          const deniedPermissionCodes = this.getPermissionCodes(deniedPermissions);
          
          if (requiredPermissions.some(perm => deniedPermissionCodes.includes(perm))) {
            continue; // Si algún permiso requerido está denegado, pasamos al siguiente rol
          }

          // Verificamos permisos adicionales
          const additionalPermissions = userRole.additionalPermissions || [];
          const additionalPermissionCodes = this.getPermissionCodes(additionalPermissions);
          
          if (requiredPermissions.some(perm => additionalPermissionCodes.includes(perm))) {
            hasPermission = true;
            break;
          }
        }

        if (!hasPermission) {
          this.router.navigate(['/forbidden']);
        }
        
        return hasPermission;
      }),
      catchError(() => {
        this.router.navigate(['/forbidden']);
        return of(false);
      })
    );
  }

  private getPermissionCodes(permissions: any[]): string[] {
    return permissions.map(permission => {
      if (typeof permission === 'string') {
        return permission;
      } else if (permission.code) {
        return permission.code;
      }
      return '';
    }).filter(code => code !== '');
  }
} 