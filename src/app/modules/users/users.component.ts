import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule
  ],
  template: `
    <div class="users-container">
      <div class="header-actions">
        <h1>{{ 'USERS.TITLE' | translate }}</h1>
        <div class="action-buttons">
          <button class="btn-add-user" (click)="createUser()">
            <i class="fas fa-plus"></i> {{ 'USERS.ADD_USER' | translate }}
          </button>
          <button class="btn-roles" (click)="navigateToRoles()">
            <i class="fas fa-users-cog"></i> {{ 'USERS.MANAGE_ROLES' | translate }}
          </button>
          <button class="btn-permissions" (click)="navigateToPermissions()">
            <i class="fas fa-key"></i> {{ 'USERS.MANAGE_PERMISSIONS' | translate }}
          </button>
        </div>
      </div>
      <p>{{ 'USERS.DESCRIPTION' | translate }}</p>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'USERS.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadUsers()">{{ 'USERS.RETRY' | translate }}</button>
      </div>
      
      <div class="auth-debug" *ngIf="showDebug">
        <h3>{{ 'USERS.DEBUG_INFO' | translate }}:</h3>
        <p>{{ 'USERS.USER_AUTHENTICATED' | translate }}: {{ currentUser ? 'Sí' : 'No' }}</p>
        <p *ngIf="currentUser">{{ 'USERS.TOKEN' | translate }}: {{ currentUserToken ? (currentUserToken | slice:0:20) + '...' : 'No disponible' }}</p>
        <p *ngIf="currentUser">{{ 'USERS.ROLE' | translate }}: {{ currentUser?.role }}</p>
        <button class="btn-debug" (click)="showDebug = false">{{ 'USERS.HIDE' | translate }}</button>
      </div>
      
      <div class="users-list" *ngIf="!loading && !errorMessage">
        <div class="empty-state" *ngIf="users.length === 0">
          <p>{{ 'USERS.NO_USERS' | translate }}</p>
          <button class="btn-debug" (click)="showDebug = true">{{ 'USERS.SHOW_DEBUG' | translate }}</button>
        </div>
        
        <table *ngIf="users.length > 0" class="users-table">
          <thead>
            <tr>
              <th>{{ 'USERS.NAME' | translate }}</th>
              <th>{{ 'USERS.EMAIL' | translate }}</th>
              <th>{{ 'USERS.ROLE' | translate }}</th>
              <th>{{ 'USERS.STATUS' | translate }}</th>
              <th>{{ 'USERS.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.name || (user.firstName + ' ' + user.lastName) }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span *ngFor="let role of user.roles; let last = last" class="role-badge">
                  {{ getRoleName(role) }}{{ !last ? ', ' : '' }}
                </span>
                <span *ngIf="!user.roles || user.roles.length === 0">{{ 'USERS.NO_ROLE' | translate }}</span>
              </td>
              <td>
                <span class="status" [ngClass]="{'active': user.active, 'inactive': !user.active}">
                  {{ user.active ? ('USERS.ACTIVE' | translate) : ('USERS.INACTIVE' | translate) }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" (click)="editUser(user.id)" title="{{ 'USERS.EDIT_USER' | translate }}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-roles" (click)="manageUserRoles(user.id)" title="{{ 'USERS.MANAGE_USER_ROLES' | translate }}">
                  <i class="fas fa-user-tag"></i>
                </button>
                <button class="btn-delete" (click)="toggleUserStatus(user)" title="{{ 'USERS.TOGGLE_STATUS' | translate }}">
                  <i class="fas" [ngClass]="user.active ? 'fa-ban' : 'fa-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    .btn-add-user, .btn-roles, .btn-permissions {
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.3s;
    }
    .btn-add-user {
      background-color: #4caf50;
    }
    .btn-add-user:hover {
      background-color: #45a049;
    }
    .btn-roles {
      background-color: #2196F3;
    }
    .btn-roles:hover {
      background-color: #1976D2;
    }
    .btn-permissions {
      background-color: #9c27b0;
    }
    .btn-permissions:hover {
      background-color: #7B1FA2;
    }
    .users-list {
      margin-top: 20px;
      min-height: 300px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #777;
      gap: 15px;
    }
    h1 {
      margin-bottom: 0;
      color: #333;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th, .users-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .users-table th {
      font-weight: 500;
      color: #666;
    }
    .users-table tr:hover {
      background-color: #f9f9f9;
    }
    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
    }
    .status.active {
      background-color: #e6f7e6;
      color: #2e7d32;
    }
    .status.inactive {
      background-color: #ffebee;
      color: #c62828;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .btn-edit, .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
    }
    .btn-edit {
      color: #2196F3;
    }
    .btn-delete {
      color: #F44336;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
      color: #666;
    }
    .error-message {
      background-color: #ffebee;
      color: #c62828;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      text-align: center;
    }
    .btn-retry {
      background-color: #e53935;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      margin-top: 10px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .btn-retry:hover {
      background-color: #d32f2f;
    }
    .auth-debug {
      background-color: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      font-family: monospace;
    }
    .auth-debug h3 {
      margin-top: 0;
      font-size: 16px;
      color: #1976d2;
    }
    .btn-debug {
      background-color: #2196f3;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: background-color 0.3s;
    }
    .btn-debug:hover {
      background-color: #1976d2;
    }
    .role-badge {
      display: inline-block;
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  showDebug: boolean = false;
  currentUser: User | null = null;
  currentUserToken: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Obtener usuario actual
    this.currentUser = this.authService.currentUser;
    this.currentUserToken = this.authService.getToken();
    
    console.log('Usuario actual:', this.currentUser);
    console.log('Token actual:', this.currentUserToken);
    
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data;
        this.loading = false;
        console.log('Usuarios cargados:', this.users);
        
        // Si no hay usuarios, verificar si hay un problema con el backend
        if (this.users.length === 0) {
          console.warn('No se encontraron usuarios en la respuesta del servidor');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar usuarios:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique que el backend esté activo.';
        } else if (error.status === 401) {
          this.errorMessage = 'Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.';
          // Redirigir al login después de un breve retraso
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.errorMessage = `Error al cargar usuarios: ${error.error?.message || error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/users/create']);
  }

  editUser(id: string): void {
    this.router.navigate([`/users/edit/${id}`]);
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.active;
    this.userService.setActiveStatus(user.id, newStatus).subscribe({
      next: (response) => {
        // Actualizar el usuario en la lista
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = response.data;
        }
      },
      error: (error) => {
        console.error(`Error al ${newStatus ? 'activar' : 'desactivar'} usuario:`, error);
        alert(`Error al ${newStatus ? 'activar' : 'desactivar'} usuario: ${error.error?.message || error.message || 'Error desconocido'}`);
      }
    });
  }

  getRoleName(role: string): string {
    if (!role) return 'Sin rol';
    
    const roles: Record<string, string> = {
      'admin': 'Administrador',
      'company_admin': 'Admin. Empresa',
      'user_control': 'Usuario de Control',
      'user_responsible': 'Usuario Responsable'
    };
    return roles[role] || role;
  }

  // Métodos de navegación
  navigateToRoles(): void {
    this.router.navigate(['/users/roles']);
  }

  navigateToPermissions(): void {
    this.router.navigate(['/users/permissions']);
  }

  manageUserRoles(userId: string): void {
    this.router.navigate(['/users', userId, 'roles']);
  }
} 