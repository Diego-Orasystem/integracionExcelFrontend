import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { Permission } from '../../../core/models/role.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  template: `
    <div class="permissions-container">
      <div class="header-actions">
        <h1>{{ 'USERS.PERMISSIONS.TITLE' | translate }}</h1>
        
      </div>
      <p>{{ 'USERS.PERMISSIONS.DESCRIPTION' | translate }}</p>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'USERS.PERMISSIONS.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadPermissions()">{{ 'USERS.PERMISSIONS.RETRY' | translate }}</button>
      </div>
      
      <!-- Formulario para crear/editar permiso -->
      <div class="permission-form" *ngIf="isFormVisible">
        <div class="form-header">
          <h2>{{ editingPermission ? ('USERS.PERMISSIONS.EDIT_PERMISSION' | translate) : ('USERS.PERMISSIONS.CREATE_PERMISSION' | translate) }}</h2>
          <button class="btn-close" (click)="cancelForm()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form [formGroup]="permissionForm" (ngSubmit)="savePermission()">
          <div class="form-group">
            <label for="name">{{ 'USERS.PERMISSIONS.NAME' | translate }}</label>
            <input type="text" id="name" formControlName="name" placeholder="{{ 'USERS.PERMISSIONS.NAME' | translate }}">
            <div class="validation-error" *ngIf="permissionForm.get('name')?.invalid && permissionForm.get('name')?.touched">
              {{ 'USERS.PERMISSIONS.NAME_REQUIRED' | translate }}
            </div>
          </div>
          <div class="form-group">
            <label for="code">{{ 'USERS.PERMISSIONS.CODE' | translate }}</label>
            <input type="text" id="code" formControlName="code" placeholder="{{ 'USERS.PERMISSIONS.CODE' | translate }}">
            <div class="validation-error" *ngIf="permissionForm.get('code')?.invalid && permissionForm.get('code')?.touched">
              {{ 'USERS.PERMISSIONS.CODE_REQUIRED' | translate }}
            </div>
          </div>
          <div class="form-group">
            <label for="category">{{ 'USERS.PERMISSIONS.CATEGORY' | translate }}</label>
            <input type="text" id="category" formControlName="category" placeholder="{{ 'USERS.PERMISSIONS.CATEGORY' | translate }}">
            <div class="validation-error" *ngIf="permissionForm.get('category')?.invalid && permissionForm.get('category')?.touched">
              {{ 'USERS.PERMISSIONS.CATEGORY_REQUIRED' | translate }}
            </div>
          </div>
          <div class="form-group">
            <label for="description">{{ 'USERS.PERMISSIONS.DESCRIPTION' | translate }}</label>
            <textarea id="description" formControlName="description" placeholder="{{ 'USERS.PERMISSIONS.DESCRIPTION' | translate }}"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelForm()">{{ 'USERS.PERMISSIONS.CANCEL' | translate }}</button>
            <button type="submit" class="btn-save" [disabled]="permissionForm.invalid">{{ 'USERS.PERMISSIONS.SAVE' | translate }}</button>
          </div>
        </form>
      </div>
      
      <!-- Lista de permisos -->
      <div class="permissions-list" *ngIf="!loading && !errorMessage && !isFormVisible">
        <div class="empty-state" *ngIf="permissions.length === 0">
          <p>{{ 'USERS.PERMISSIONS.NO_PERMISSIONS' | translate }}</p>
        </div>
        
        <div class="filter-bar" *ngIf="permissions.length > 0">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="{{ 'USERS.PERMISSIONS.SEARCH' | translate }}" [(ngModel)]="searchTerm" (keyup)="filterPermissions()">
          </div>
          <div class="category-filter">
            <select [(ngModel)]="selectedCategory" (change)="filterPermissions()">
              <option value="">{{ 'USERS.PERMISSIONS.ALL_CATEGORIES' | translate }}</option>
              <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
            </select>
          </div>
        </div>
        
        <table *ngIf="filteredPermissions.length > 0" class="permissions-table">
          <thead>
            <tr>
              <th>{{ 'USERS.PERMISSIONS.NAME' | translate }}</th>
              <th>{{ 'USERS.PERMISSIONS.CODE' | translate }}</th>
              <th>{{ 'USERS.PERMISSIONS.CATEGORY' | translate }}</th>
              <th>{{ 'USERS.PERMISSIONS.STATUS' | translate }}</th>
              <th>{{ 'USERS.PERMISSIONS.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let permission of filteredPermissions">
              <td>{{ permission.name }}</td>
              <td><code>{{ permission.code }}</code></td>
              <td>
                <span class="category-badge">
                  {{ permission.category }}
                </span>
              </td>
              <td>
                <span class="status" [ngClass]="{'active': permission.active, 'inactive': !permission.active}">
                  {{ permission.active ? ('USERS.PERMISSIONS.ACTIVE' | translate) : ('USERS.PERMISSIONS.INACTIVE' | translate) }}
                </span>
              </td>
              <td class="actions">
             <!--    <button class="btn-edit" (click)="editPermission(permission)">
                  <i class="fas fa-edit"></i>
                </button> -->
                <button class="btn-delete" (click)="togglePermissionStatus(permission)" title="{{ 'USERS.PERMISSIONS.TOGGLE_STATUS' | translate }}">
                  <i class="fas" [ngClass]="permission.active ? 'fa-ban' : 'fa-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="empty-search" *ngIf="permissions.length > 0 && filteredPermissions.length === 0">
          <p>{{ 'USERS.PERMISSIONS.NO_RESULTS' | translate }}</p>
          <button class="btn-clear-filters" (click)="clearFilters()">{{ 'USERS.PERMISSIONS.CLEAR_FILTERS' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .permissions-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .btn-add-permission {
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
    .btn-add-permission:hover {
      background-color: #45a049;
    }
    .permissions-list {
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
    .permissions-table {
      width: 100%;
      border-collapse: collapse;
    }
    .permissions-table th, .permissions-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .permissions-table th {
      font-weight: 500;
      color: #666;
    }
    .permissions-table tr:hover {
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
    
    /* Estilos del formulario */
    .permission-form {
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
    
    /* Filtros */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 0 12px;
      flex: 1;
      max-width: 300px;
    }
    .search-box i {
      color: #777;
      margin-right: 8px;
    }
    .search-box input {
      border: none;
      background: transparent;
      padding: 10px 0;
      width: 100%;
      outline: none;
    }
    .category-filter select {
      padding: 9px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      min-width: 180px;
    }
    .category-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .empty-search {
      text-align: center;
      padding: 30px;
      color: #777;
    }
    .btn-clear-filters {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 8px 15px;
      border-radius: 4px;
      margin-top: 10px;
      cursor: pointer;
      color: #333;
    }
    code {
      background-color: #f5f5f5;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
      font-family: monospace;
    }
  `]
})
export class PermissionsComponent implements OnInit {
  permissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  categories: string[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  isFormVisible: boolean = false;
  permissionForm: FormGroup;
  editingPermission: Permission | null = null;
  searchTerm: string = '';
  selectedCategory: string = '';

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.permissionForm = this.createPermissionForm();
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  createPermissionForm(permission?: Permission): FormGroup {
    return this.fb.group({
      name: [permission?.name || '', [Validators.required]],
      code: [permission?.code || '', [Validators.required]],
      category: [permission?.category || '', [Validators.required]],
      description: [permission?.description || ''],
      active: [permission?.active !== undefined ? permission.active : true]
    });
  }

  loadPermissions(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.roleService.getPermissions().subscribe({
      next: (response) => {
        this.permissions = response.data;
        this.filteredPermissions = [...this.permissions];
        this.extractCategories();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
        this.errorMessage = 'No se pudieron cargar los permisos. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  extractCategories(): void {
    this.categories = [...new Set(this.permissions.map(p => p.category))].sort();
  }

  filterPermissions(): void {
    this.filteredPermissions = this.permissions.filter(permission => {
      // Filtrar por término de búsqueda
      const searchMatch = !this.searchTerm || 
        permission.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        permission.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filtrar por categoría
      const categoryMatch = !this.selectedCategory || 
        permission.category === this.selectedCategory;
      
      return searchMatch && categoryMatch;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.filteredPermissions = [...this.permissions];
  }

  showPermissionForm(): void {
    this.isFormVisible = true;
    this.editingPermission = null;
    this.permissionForm = this.createPermissionForm();
  }

  cancelForm(): void {
    this.isFormVisible = false;
    this.editingPermission = null;
  }

  editPermission(permission: Permission): void {
    this.editingPermission = permission;
    this.permissionForm = this.createPermissionForm(permission);
    this.isFormVisible = true;
  }

  savePermission(): void {
    if (this.permissionForm.invalid) return;
    
    const permissionData: Partial<Permission> = this.permissionForm.value;
    
    if (this.editingPermission) {
      // Actualizar permiso existente
      this.roleService.updatePermission(this.editingPermission.id, permissionData).subscribe({
        next: (response) => {
          this.loadPermissions();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al actualizar permiso:', error);
          this.errorMessage = 'No se pudo actualizar el permiso. Por favor, intente nuevamente.';
        }
      });
    } else {
      // Crear nuevo permiso
      this.roleService.createPermission(permissionData).subscribe({
        next: (response) => {
          this.loadPermissions();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al crear permiso:', error);
          this.errorMessage = 'No se pudo crear el permiso. Por favor, intente nuevamente.';
        }
      });
    }
  }

  togglePermissionStatus(permission: Permission): void {
    const updatedPermission: Partial<Permission> = {
      active: !permission.active
    };
    console.log(permission);
    this.roleService.updatePermission(permission._id || '', updatedPermission).subscribe({
      next: (response) => {
        this.loadPermissions();
      },
      error: (error) => {
        console.error('Error al cambiar estado del permiso:', error);
        this.errorMessage = 'No se pudo cambiar el estado del permiso. Por favor, intente nuevamente.';
      }
    });
  }
} 