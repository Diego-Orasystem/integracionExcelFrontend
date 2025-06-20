import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RoleService } from '../../core/services/role.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('appHasPermission') permission: string = '';
  @Input('appHasPermissionEntity') entity: { type: 'file' | 'area' | 'subarea', id: string } | null = null;
  
  private destroy$ = new Subject<void>();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.checkPermission();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermission(): void {
    const user = this.authService.currentUser;
    
    if (!user) {
      this.viewContainer.clear();
      return;
    }

    // Administrador tiene todos los permisos
    if (user.roles?.includes('admin')) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    // Verificar permisos específicos según el tipo de entidad
    if (this.entity && this.entity.id) {
      // Aquí podríamos implementar una verificación específica por entidad
      // Por ahora, simplemente verificamos en los roles del usuario
      this.roleService.getUserRoles(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          const userRoles = response.data;
          let hasPermission = false;

          // Verificar si el usuario tiene el permiso requerido
          if (userRoles && userRoles.length > 0) {
            for (const userRole of userRoles) {
              // Verificar si está denegado explícitamente
              const deniedPermissions = userRole.deniedPermissions || [];
              const deniedCodes = this.getPermissionCodes(deniedPermissions);
              
              if (deniedCodes.includes(this.permission)) {
                continue; // Si está denegado, pasar al siguiente rol
              }

              // Verificar permisos adicionales
              const additionalPermissions = userRole.additionalPermissions || [];
              const additionalCodes = this.getPermissionCodes(additionalPermissions);
              
              if (additionalCodes.includes(this.permission)) {
                hasPermission = true;
                break;
              }

              // Verificar si el rol tiene el permiso
              const rolePermissions = userRole.role?.permissions || [];
              const roleCodes = this.getPermissionCodes(rolePermissions);
              
              if (roleCodes.includes(this.permission)) {
                hasPermission = true;
                break;
              }
            }
          }

          if (hasPermission && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
          } else if (!hasPermission && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
          }
        });
    } else {
      // Si no hay entidad específica, simplemente verificamos el permiso general
      this.roleService.getUserRoles(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          const userRoles = response.data;
          let hasPermission = false;

          // Verificar si el usuario tiene el permiso requerido en alguno de sus roles
          if (userRoles && userRoles.length > 0) {
            for (const userRole of userRoles) {
              // Verificar permisos del rol
              const rolePermissions = userRole.role?.permissions || [];
              const roleCodes = this.getPermissionCodes(rolePermissions);
              
              if (roleCodes.includes(this.permission)) {
                hasPermission = true;
                break;
              }
            }
          }

          if (hasPermission && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
          } else if (!hasPermission && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
          }
        });
    }
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