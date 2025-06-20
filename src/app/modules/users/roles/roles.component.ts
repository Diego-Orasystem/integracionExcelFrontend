import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { Role, Permission } from '../../../core/models/role.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  template: `
    <div class="roles-container">
      <div class="header-actions">
        <h1>{{ 'USERS.ROLES.TITLE' | translate }}</h1>
        <button class="btn-add-role" (click)="showRoleForm()">
          <i class="fas fa-plus"></i> {{ 'USERS.ROLES.ADD_ROLE' | translate }}
        </button>
      </div>
      <p>{{ 'USERS.ROLES.DESCRIPTION' | translate }}</p>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'USERS.ROLES.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadRoles()">{{ 'USERS.ROLES.RETRY' | translate }}</button>
      </div>
      
      <!-- Formulario para crear/editar rol -->
      <div class="role-form" *ngIf="isFormVisible">
        <div class="form-header">
          <h2>{{ editingRole ? ('USERS.ROLES.EDIT_ROLE' | translate) : ('USERS.ROLES.CREATE_ROLE' | translate) }}</h2>
          <button class="btn-close" (click)="cancelForm()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form [formGroup]="roleForm" (ngSubmit)="saveRole()">
          <div class="form-group">
            <label for="name">{{ 'USERS.ROLES.NAME' | translate }}</label>
            <input type="text" id="name" formControlName="name" placeholder="{{ 'USERS.ROLES.NAME' | translate }}">
            <div class="validation-error" *ngIf="roleForm.get('name')?.invalid && roleForm.get('name')?.touched">
              {{ 'USERS.ROLES.NAME_REQUIRED' | translate }}
            </div>
          </div>
          <div class="form-group">
            <label for="code">{{ 'USERS.ROLES.CODE' | translate }}</label>
            <input type="text" id="code" formControlName="code" placeholder="{{ 'USERS.ROLES.CODE' | translate }}">
            <div class="validation-error" *ngIf="roleForm.get('code')?.invalid && roleForm.get('code')?.touched">
              {{ 'USERS.ROLES.CODE_REQUIRED' | translate }}
            </div>
          </div>
          <div class="form-group">
            <label for="description">{{ 'USERS.ROLES.DESCRIPTION' | translate }}</label>
            <textarea id="description" formControlName="description" placeholder="{{ 'USERS.ROLES.DESCRIPTION' | translate }}"></textarea>
          </div>
          
          <div class="form-group permissions-section">
            <label>{{ 'USERS.ROLES.PERMISSIONS' | translate }}</label>
            <div class="permissions-list" *ngIf="permissions.length > 0">
              <div *ngFor="let perm of permissions" class="permission-item">
                <input type="checkbox" 
                       [id]="'perm-' + (perm._id || perm.id)" 
                       [checked]="isPermissionSelected(perm._id || perm.id)"
                       (change)="togglePermission(perm._id || perm.id)">
                <label [for]="'perm-' + (perm._id || perm.id)">{{ perm.name }}</label>
                <span class="permission-category">{{ perm.category }}</span>
              </div>
            </div>
            <div class="empty-permissions" *ngIf="permissions.length === 0">
              {{ 'USERS.ROLES.NO_PERMISSIONS' | translate }}
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelForm()">{{ 'USERS.ROLES.CANCEL' | translate }}</button>
            <button type="submit" class="btn-save" [disabled]="roleForm.invalid">{{ 'USERS.ROLES.SAVE' | translate }}</button>
          </div>
        </form>
      </div>
      
      <!-- Lista de roles -->
      <div class="roles-list" *ngIf="!loading && !errorMessage && !isFormVisible">
        <div class="empty-state" *ngIf="roles.length === 0">
          <p>{{ 'USERS.ROLES.NO_ROLES' | translate }}</p>
        </div>
        
        <table *ngIf="roles.length > 0" class="roles-table">
          <thead>
            <tr>
              <th>{{ 'USERS.ROLES.NAME' | translate }}</th>
              <th>{{ 'USERS.ROLES.CODE' | translate }}</th>
              <th>{{ 'USERS.ROLES.PERMISSIONS' | translate }}</th>
              <th>{{ 'USERS.ROLES.STATUS' | translate }}</th>
              <th>{{ 'USERS.ROLES.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let role of roles">
              <td>{{ role.name }}</td>
              <td>{{ role.code }}</td>
              <td>
                <span class="permissions-count">
                  {{ getPermissionsCount(role) }} {{ 'USERS.ROLES.PERMISSIONS_COUNT' | translate }}
                </span>
              </td>
              <td>
                <span class="status" [ngClass]="{'active': role.active, 'inactive': !role.active}">
                  {{ role.active ? ('USERS.ROLES.ACTIVE' | translate) : ('USERS.ROLES.INACTIVE' | translate) }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" (click)="editRole(role)" title="{{ 'USERS.ROLES.EDIT' | translate }}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-permissions" (click)="managePermissions(role)" title="{{ 'USERS.ROLES.MANAGE_PERMISSIONS' | translate }}">
                  <i class="fas fa-key"></i>
                </button>
                <button class="btn-delete" (click)="toggleRoleStatus(role)" title="{{ 'USERS.ROLES.TOGGLE_STATUS' | translate }}">
                  <i class="fas" [ngClass]="role.active ? 'fa-ban' : 'fa-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .roles-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .btn-add-role {
      background-color: #4caf50;
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
    .btn-add-role:hover {
      background-color: #45a049;
    }
    .roles-list {
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
    }
    h1 {
      margin-bottom: 0;
      color: #333;
    }
    .roles-table {
      width: 100%;
      border-collapse: collapse;
    }
    .roles-table th, .roles-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .roles-table th {
      font-weight: 500;
      color: #666;
    }
    .roles-table tr:hover {
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
    .btn-edit, .btn-delete, .btn-permissions {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
    }
    .btn-edit {
      color: #2196F3;
    }
    .btn-permissions {
      color: #9c27b0;
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
    
    /* Estilos del formulario */
    .role-form {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-top: 20px;
    }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .form-header h2 {
      margin: 0;
      color: #333;
    }
    .btn-close {
      background: none;
      border: none;
      color: #999;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.95rem;
    }
    .form-group textarea {
      height: 100px;
      resize: vertical;
    }
    .validation-error {
      color: #d32f2f;
      font-size: 0.85rem;
      margin-top: 5px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .btn-cancel {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-save {
      background-color: #2196f3;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-save:disabled {
      background-color: #bbdefb;
      cursor: not-allowed;
    }
    .permissions-section {
      margin-top: 20px;
    }
    .permissions-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-top: 5px;
    }
    .permission-item {
      display: flex;
      align-items: center;
      padding: 5px 0;
    }
    .permission-item label {
      margin: 0 0 0 8px;
      font-weight: normal;
    }
    .permission-category {
      margin-left: auto;
      font-size: 0.85rem;
      color: #777;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .empty-permissions {
      padding: 15px;
      text-align: center;
      color: #777;
    }
    .permissions-count {
      font-size: 0.85rem;
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 3px 8px;
      border-radius: 4px;
    }
  `]
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  permissions: Permission[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  isFormVisible: boolean = false;
  roleForm: FormGroup;
  selectedPermissions: string[] = [];
  editingRole: Role | null = null;

  constructor(
    private router: Router,
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.createRoleForm();
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  createRoleForm(role?: Role): FormGroup {
    return this.fb.group({
      name: [role?.name || '', [Validators.required]],
      code: [role?.code || '', [Validators.required]],
      description: [role?.description || ''],
      active: [role?.active !== undefined ? role.active : true]
    });
  }

  loadRoles(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Usar timestamp para evitar el caché del navegador
    const timestamp = new Date().getTime();
    this.roleService.getRoles().subscribe({
      next: (response) => {
        console.log('Roles cargados:', response.data);
        this.roles = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.errorMessage = 'No se pudieron cargar los roles. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  loadPermissions(): void {
    this.roleService.getPermissions().subscribe({
      next: (response) => {
        this.permissions = response.data;
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
      }
    });
  }

  showRoleForm(): void {
    this.isFormVisible = true;
    this.editingRole = null;
    this.roleForm = this.createRoleForm();
    this.selectedPermissions = [];
  }

  cancelForm(): void {
    this.isFormVisible = false;
    this.editingRole = null;
  }

  editRole(role: Role): void {
    this.editingRole = role;
    this.roleForm = this.createRoleForm(role);
    this.isFormVisible = true;
    
    // Limpiar los permisos seleccionados previamente
    this.selectedPermissions = [];
    
    // Cargar permisos seleccionados
    if (Array.isArray(role.permissions)) {
      this.selectedPermissions = role.permissions.map(perm => {
        if (typeof perm === 'string') {
          return perm;
        } else {
          return perm._id || perm.id || '';
        }
      }).filter(id => id !== ''); // Filtrar posibles IDs vacíos
    }
    
    console.log('Permisos seleccionados:', this.selectedPermissions);
  }

  saveRole(): void {
    if (this.roleForm.invalid) return;
    
    console.log('Permisos seleccionados antes de guardar:', this.selectedPermissions);
    
    const roleData: Partial<Role> = {
      ...this.roleForm.value,
      permissions: this.selectedPermissions
    };
    
    console.log('Datos del rol a guardar:', roleData);
    
    if (this.editingRole) {
      // Actualizar rol existente
      const roleId = this.editingRole.id || this.editingRole._id || '';
      this.roleService.updateRole(roleId, roleData).subscribe({
        next: (response) => {
          console.log('Rol actualizado correctamente:', response);
          this.loadRoles();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al actualizar rol:', error);
          this.errorMessage = 'No se pudo actualizar el rol. Por favor, intente nuevamente.';
        }
      });
    } else {
      // Crear nuevo rol
      this.roleService.createRole(roleData).subscribe({
        next: (response) => {
          console.log('Rol creado correctamente:', response);
          this.loadRoles();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al crear rol:', error);
          this.errorMessage = 'No se pudo crear el rol. Por favor, intente nuevamente.';
        }
      });
    }
  }

  toggleRoleStatus(role: Role): void {
    const updatedRole: Partial<Role> = {
      active: !role.active
    };
    
    this.roleService.updateRole(role.id, updatedRole).subscribe({
      next: (response) => {
        this.loadRoles();
      },
      error: (error) => {
        console.error('Error al cambiar estado del rol:', error);
        this.errorMessage = 'No se pudo cambiar el estado del rol. Por favor, intente nuevamente.';
      }
    });
  }

  managePermissions(role: Role): void {
    console.log('Role antes de editar:', role);
    if (role.id || role._id) {
      this.roleService.getRole(role.id || role._id || '').subscribe({
        next: (response) => {
          console.log('Detalle del rol:', response.data);
          this.editRole(response.data);
        },
        error: (err) => {
          console.error('Error al cargar el detalle del rol:', err);
          this.editRole(role);
        }
      });
    } else {
      this.editRole(role);
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: string): void {
    const index = this.selectedPermissions.indexOf(permissionId);
    if (index === -1) {
      this.selectedPermissions.push(permissionId);
    } else {
      this.selectedPermissions.splice(index, 1);
    }
  }

  getPermissionsCount(role: Role): number {
    if (!role.permissions) return 0;
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  }
} 