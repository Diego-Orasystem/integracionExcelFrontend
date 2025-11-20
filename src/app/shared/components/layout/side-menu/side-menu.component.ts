import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { MenuItem } from '../../../../core/models/menu-item.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit, OnDestroy {
  staticMenuItems: MenuItem[] = [
    {
      _id: 'dashboard',
      name: 'MENU.DASHBOARD',
      url: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      permissionCode: 'dashboard_view',
      order: 1,
      active: true
    },
    {
      _id: 'files',
      name: 'MENU.FILES',
      url: '/explorer',
      icon: 'fas fa-file-excel',
      permissionCode: 'files_view',
      order: 2,
      active: true
    },
    {
      _id: 'file-status',
      name: 'MENU.FILE_STATUS',
      url: '/file-status',
      icon: 'fas fa-puzzle-piece',
      permissionCode: 'file_status_view',
      order: 4,
      active: true
    },
    {
      _id: 'sftp',
      name: 'MENU.SFTP',
      url: '/sftp',
      icon: 'fas fa-server',
      permissionCode: 'sftp_view',
      order: 5,
      active: true
    },
    {
      _id: 'users',
      name: 'MENU.USERS',
      url: '/users',
      icon: 'fas fa-users',
      permissionCode: 'users_manage',
      order: 6,
      active: true
    },
    {
      _id: 'companies',
      name: 'MENU.COMPANIES',
      url: '/companies',
      icon: 'fas fa-building',
      permissionCode: 'companies_manage',
      order: 7,
      active: true
    },
    {
      _id: 'areas',
      name: 'MENU.AREAS',
      url: '/organization/areas',
      icon: 'fas fa-sitemap',
      permissionCode: 'organization_manage',
      order: 8,
      active: true
    },
    {
      _id: 'logs',
      name: 'MENU.LOGS',
      url: '/logs',
      icon: 'fas fa-clipboard-list',
      permissionCode: 'logs_view',
      order: 9,
      active: true
    }
  ];

  filteredMenuItems: MenuItem[] = [];
  showSettings: boolean = false;
  currentRoute: string = '';
  isCollapsed: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Filtrar menú según el rol del usuario
    this.filterMenuItemsByRole();
    
    // Suscribirse a cambios en la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Filtra los elementos del menú según el rol y permisos del usuario
   */
  filterMenuItemsByRole(): void {
    const currentUser = this.authService.currentUser;
    
    if (!currentUser || !currentUser.roles || currentUser.roles.length === 0) {
      this.filteredMenuItems = [];
      this.showSettings = false;
      return;
    }

    // Filtrar elementos según los roles que tenga el usuario
    this.filteredMenuItems = this.staticMenuItems.filter(item => {
      // Admin tiene acceso a todo
      if (currentUser.roles.includes('admin')) {
        return true;
      }
      
      // Verificar si el usuario tiene roles específicos
      const isCompanyAdmin = currentUser.roles.includes('company_admin');
      const isUserControl = currentUser.roles.includes('user_control');
      const isUserResponsible = currentUser.roles.includes('user_responsible');
      
      // Filtrar según los roles que tenga
      if (isCompanyAdmin) {
        // Admin de compañía tiene acceso a todo excepto gestión de empresas
        if (['dashboard', 'files', 'file-status', 'sftp', 'users', 'areas', 'settings', 'logs'].includes(item._id)) {
          return true;
        }
      }
      
      if (isUserControl) {
        // Usuario control tiene acceso a dashboard, archivos, reportes, áreas y estado
        if (['dashboard', 'files', 'reports', 'file-status', 'areas'].includes(item._id)) {
          return true;
        }
      }
      
      if (isUserResponsible) {
        // Usuario responsable tiene acceso básico
        if (['dashboard', 'files', 'file-status'].includes(item._id)) {
          return true;
        }
      }
      
      return false;
    });

    // Verificar si se debe mostrar el enlace de configuración
    this.showSettings = this.filteredMenuItems.some(item => item._id === 'settings');

    // Ordenar por propiedad 'order'
    this.filteredMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Verifica si una ruta está activa
   */
  isActiveRoute(url: string | undefined): boolean {
    if (!url) return false;
    return this.currentRoute === url || this.currentRoute.startsWith(`${url}/`);
  }

  /**
   * Alterna el estado de colapso del menú lateral
   */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
} 