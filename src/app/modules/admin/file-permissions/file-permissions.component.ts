import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { FilePermissionService } from '../../../core/services/file-permission.service';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { Role, UserRolesResponse } from '../../../core/models/role.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface FilePermission {
  id: string;
  fileId: string;
  entityType: 'user' | 'role';
  entityId: string;
  actions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  entityName?: string; // Nombre del usuario o rol (para la visualización)
}

@Component({
  selector: 'app-file-permissions',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h1>Administración de Permisos de Archivo</h1>
        <p>Gestiona quién puede acceder al archivo: {{ fileName }}</p>
      </div>

      <div class="content-panel">
        <div class="loading-container" *ngIf="loading">
          <app-loading-spinner></app-loading-spinner>
        </div>

        <ng-container *ngIf="!loading">
          <div class="permission-list">
            <h2>Permisos Actuales</h2>
            
            <div class="empty-state" *ngIf="permissions.length === 0">
              <p>No hay permisos específicos asignados para este archivo.</p>
            </div>
            
            <table class="permissions-table" *ngIf="permissions.length > 0">
              <thead>
                <tr>
                  <th>Entidad</th>
                  <th>Tipo</th>
                  <th>Lectura</th>
                  <th>Escritura</th>
                  <th>Eliminación</th>
                  <th>Admin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let permission of permissions">
                  <td>{{ permission.entityName }}</td>
                  <td>{{ permission.entityType === 'user' ? 'Usuario' : 'Rol' }}</td>
                  <td>
                    <i class="fas" [class.fa-check]="permission.actions.read" 
                       [class.fa-times]="!permission.actions.read"></i>
                  </td>
                  <td>
                    <i class="fas" [class.fa-check]="permission.actions.write" 
                       [class.fa-times]="!permission.actions.write"></i>
                  </td>
                  <td>
                    <i class="fas" [class.fa-check]="permission.actions.delete" 
                       [class.fa-times]="!permission.actions.delete"></i>
                  </td>
                  <td>
                    <i class="fas" [class.fa-check]="permission.actions.admin" 
                       [class.fa-times]="!permission.actions.admin"></i>
                  </td>
                  <td class="actions-column">
                    <button (click)="editPermission(permission)" class="btn-edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button (click)="deletePermission(permission.id)" class="btn-delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="add-permission-panel">
            <h2>Añadir Nuevo Permiso</h2>
            
            <form [formGroup]="permissionForm" (ngSubmit)="addPermission()">
              <div class="form-group">
                <label for="entityType">Tipo de Entidad</label>
                <select id="entityType" formControlName="entityType">
                  <option value="user">Usuario</option>
                  <option value="role">Rol</option>
                </select>
              </div>
              
              <div class="form-group" *ngIf="permissionForm.get('entityType')?.value === 'user'">
                <label for="userId">Usuario</label>
                <select id="userId" formControlName="entityId">
                  <option value="">Seleccione un usuario</option>
                  <option *ngFor="let user of users" [value]="user.id">
                    {{ user.name }} ({{ user.email }})
                  </option>
                </select>
              </div>
              
              <div class="form-group" *ngIf="permissionForm.get('entityType')?.value === 'role'">
                <label for="roleId">Rol</label>
                <select id="roleId" formControlName="entityId">
                  <option value="">Seleccione un rol</option>
                  <option *ngFor="let role of roles" [value]="role.id">
                    {{ role.name }}
                  </option>
                </select>
              </div>
              
              <div class="permissions-grid">
                <div class="permission-checkbox">
                  <input type="checkbox" id="read" formControlName="read">
                  <label for="read">Lectura</label>
                </div>
                
                <div class="permission-checkbox">
                  <input type="checkbox" id="write" formControlName="write">
                  <label for="write">Escritura</label>
                </div>
                
                <div class="permission-checkbox">
                  <input type="checkbox" id="delete" formControlName="delete">
                  <label for="delete">Eliminación</label>
                </div>
                
                <div class="permission-checkbox">
                  <input type="checkbox" id="admin" formControlName="admin">
                  <label for="admin">Administración</label>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="permissionForm.invalid || saving">
                  {{ saving ? 'Guardando...' : 'Añadir Permiso' }}
                </button>
              </div>
            </form>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
    }
    
    .page-header {
      margin-bottom: 20px;
    }
    
    .content-panel {
      background-color: #fff;
      border-radius: 5px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .permission-list {
      margin-bottom: 30px;
    }
    
    .permissions-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .permissions-table th, .permissions-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .permissions-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .actions-column {
      width: 100px;
    }
    
    .btn-edit, .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      margin-right: 5px;
    }
    
    .btn-edit {
      color: #4a63a9;
    }
    
    .btn-delete {
      color: #e74c3c;
    }
    
    .add-permission-panel {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .form-group select, .form-group input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .permission-checkbox {
      display: flex;
      align-items: center;
    }
    
    .permission-checkbox input {
      margin-right: 5px;
    }
    
    .form-actions {
      margin-top: 15px;
    }
    
    .btn-primary {
      background-color: #4a63a9;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary:disabled {
      background-color: #a5b2d3;
      cursor: not-allowed;
    }
    
    .fa-check {
      color: #2ecc71;
    }
    
    .fa-times {
      color: #e74c3c;
    }
    
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #777;
    }
  `]
})
export class FilePermissionsComponent implements OnInit {
  fileId: string = '';
  fileName: string = '';
  permissions: FilePermission[] = [];
  roles: Role[] = [];
  users: any[] = [];
  
  permissionForm: FormGroup;
  loading = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private filePermissionService: FilePermissionService,
    private roleService: RoleService,
    private userService: UserService
  ) {
    this.permissionForm = this.fb.group({
      entityType: ['user', Validators.required],
      entityId: ['', Validators.required],
      read: [true],
      write: [false],
      delete: [false],
      admin: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.fileId = params['id'];
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    
    // Cargar permisos
    this.filePermissionService.getFilePermissions(this.fileId).subscribe({
      next: (response) => {
        this.permissions = response.data.map((permission: any) => ({
          id: permission.id,
          fileId: permission.fileId,
          entityType: permission.entityType,
          entityId: permission.entityId,
          actions: permission.actions,
          entityName: permission.entityName || permission.entityId
        }));
        
        // Cargar roles
        this.roleService.getRoles().subscribe({
          next: (rolesResponse) => {
            this.roles = rolesResponse.data;
            
            // Cargar usuarios
            this.userService.getUsers().subscribe({
              next: (usersResponse) => {
                this.users = usersResponse.data;
                this.loading = false;
              },
              error: (error) => {
                console.error('Error al cargar usuarios', error);
                this.loading = false;
              }
            });
          },
          error: (error) => {
            console.error('Error al cargar roles', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar permisos', error);
        this.loading = false;
      }
    });
  }

  addPermission(): void {
    if (this.permissionForm.invalid) return;
    
    this.saving = true;
    const formData = this.permissionForm.value;
    
    const newPermission = {
      entityType: formData.entityType,
      entityId: formData.entityId,
      actions: {
        read: formData.read,
        write: formData.write,
        delete: formData.delete,
        admin: formData.admin
      }
    };
    
    this.filePermissionService.addFilePermission(this.fileId, newPermission).subscribe({
      next: (response) => {
        // Agregar el nuevo permiso a la lista con su nombre
        const entityName = this.getEntityName(formData.entityType, formData.entityId);
        this.permissions.push({
          ...response.data,
          entityName
        });
        
        // Limpiar formulario
        this.permissionForm.reset({
          entityType: 'user',
          read: true,
          write: false,
          delete: false,
          admin: false
        });
        
        this.saving = false;
      },
      error: (error) => {
        console.error('Error al añadir permiso', error);
        this.saving = false;
      }
    });
  }

  editPermission(permission: FilePermission): void {
    // Para la implementación del MVP, usaremos un enfoque simple:
    // borramos el permiso y añadimos uno nuevo con los cambios
    // En una versión más avanzada, se podría implementar un diálogo de edición
    
    this.permissionForm.setValue({
      entityType: permission.entityType,
      entityId: permission.entityId,
      read: permission.actions.read,
      write: permission.actions.write,
      delete: permission.actions.delete,
      admin: permission.actions.admin
    });
    
    this.deletePermission(permission.id);
  }

  deletePermission(permissionId: string): void {
    if (confirm('¿Está seguro de eliminar este permiso?')) {
      this.filePermissionService.deletePermission(permissionId).subscribe({
        next: () => {
          this.permissions = this.permissions.filter(p => p.id !== permissionId);
        },
        error: (error) => {
          console.error('Error al eliminar permiso', error);
        }
      });
    }
  }

  getEntityName(entityType: string, entityId: string): string {
    if (entityType === 'user') {
      const user = this.users.find(u => u.id === entityId);
      return user ? `${user.name} (${user.email})` : entityId;
    } else {
      const role = this.roles.find(r => r.id === entityId);
      return role ? role.name : entityId;
    }
  }
} 