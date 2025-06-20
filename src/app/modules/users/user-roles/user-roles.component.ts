import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

// Lista en duro de roles disponibles
interface RolOpcion {
  codigo: 'company_admin' | 'user_control' | 'user_responsible';
  nombre: string;
}

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
    <div class="user-roles-container">
      <div class="header-actions">
        <h1>Gestión de Roles para Usuario</h1>
        <div class="action-buttons">
          <button class="btn-assign-role" (click)="mostrarFormulario()" *ngIf="!formularioVisible">
            <i class="fas fa-user-tag"></i> Gestionar Roles
          </button>
          <button class="btn-back" (click)="volver()">
            <i class="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>
      
      <div class="user-info" *ngIf="usuario">
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
          <h2>{{ usuario.name }}</h2>
          <p class="user-email">{{ usuario.email }}</p>
          <div class="current-role-container">
            <span class="role-label">Roles actuales:</span>
            <div class="roles-container">
              <span *ngFor="let rol of usuario.roles" class="user-role-badge">
                {{ obtenerNombreRol(rol) }}
              </span>
              <span *ngIf="!usuario.roles || usuario.roles.length === 0" class="user-role-badge empty-role">
                Sin roles asignados
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="loading" *ngIf="cargando">
        <p>Cargando información...</p>
      </div>
      
      <div class="error-message" *ngIf="mensajeError">
        <p>{{ mensajeError }}</p>
        <button class="btn-retry" (click)="cargarUsuario()">Reintentar</button>
      </div>
      
      <!-- Formulario para gestionar roles -->
      <div class="assign-form" *ngIf="formularioVisible">
        <div class="form-header">
          <h2>Gestionar Roles de Usuario</h2>
          <button class="btn-close" (click)="cancelarFormulario()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form [formGroup]="formularioRol" (ngSubmit)="guardarCambioRol()">
          <div class="form-group">
            <label>Roles Disponibles</label>
            <p class="select-instruction">Seleccione los roles que desea asignar al usuario.</p>
            
            <div class="roles-checkbox-container">
              <div *ngFor="let rol of rolesDisponibles" class="role-checkbox">
                <label>
                  <input 
                    type="checkbox"
                    [value]="rol.codigo"
                    (change)="onRoleChange($event)"
                    [checked]="isRoleSelected(rol.codigo)"
                  >
                  {{ rol.nombre }}
                </label>
              </div>
              <div class="role-checkbox">
                <label>
                  <input 
                    type="checkbox"
                    value="admin"
                    (change)="onRoleChange($event)"
                    [checked]="isRoleSelected('admin')"
                  >
                  Administrador de Sistema
                </label>
              </div>
            </div>
            
            <div class="validation-error" *ngIf="!hasSelectedRoles() && submitted">
              Debe seleccionar al menos un rol
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelarFormulario()">Cancelar</button>
            <button type="submit" class="btn-save">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .user-roles-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    .btn-assign-role {
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
    .btn-assign-role:hover {
      background-color: #45a049;
    }
    .btn-back {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h1 {
      margin-bottom: 0;
      color: #333;
    }
    .user-info {
      display: flex;
      align-items: center;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .user-avatar {
      font-size: 3rem;
      color: #1976d2;
      margin-right: 15px;
    }
    .user-details h2 {
      margin: 0 0 5px 0;
      color: #333;
    }
    .user-email {
      margin: 0 0 10px 0;
      color: #666;
    }
    .current-role-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .role-label {
      font-weight: 500;
      color: #555;
    }
    .user-role-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.85rem;
      display: inline-block;
      font-weight: 500;
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
      cursor: pointer;
      margin-top: 10px;
    }
    .assign-form {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-top: 20px;
    }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .form-header h2 {
      margin: 0;
      color: #333;
    }
    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: #666;
      cursor: pointer;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }
    .select-instruction {
      font-size: 0.9rem;
      color: #666;
      margin: 0 0 12px 0;
      font-style: italic;
    }
    .roles-checkbox-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 10px;
    }
    .role-checkbox {
      display: flex;
      align-items: center;
    }
    .role-checkbox label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: normal;
      margin-bottom: 0;
    }
    .role-checkbox input[type="checkbox"] {
      margin-right: 8px;
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
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .btn-cancel:hover {
      background-color: #e0e0e0;
    }
    .btn-save {
      background-color: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .btn-save:hover {
      background-color: #1565c0;
    }
    .btn-save:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .roles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 5px;
    }
    .empty-role {
      background-color: #f5f5f5;
      color: #666;
    }
  `]
})
export class UserRolesComponent implements OnInit {
  // Lista en duro de roles disponibles
  rolesDisponibles: RolOpcion[] = [
    { codigo: 'company_admin', nombre: 'Administrador de Empresa' },
    { codigo: 'user_control', nombre: 'Usuario de Control' },
    { codigo: 'user_responsible', nombre: 'Usuario Responsable' }
  ];

  // Propiedades del componente
  usuarioId: string = '';
  usuario: User | null = null;
  cargando: boolean = true;
  mensajeError: string = '';
  formularioVisible: boolean = false;
  formularioRol: FormGroup;
  selectedRoles: ('admin' | 'company_admin' | 'user_control' | 'user_responsible')[] = [];
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.formularioRol = this.crearFormularioRol();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.usuarioId = params['id'];
      if (this.usuarioId) {
        this.cargarUsuario();
      } else {
        this.mensajeError = 'ID de usuario no válido';
        this.cargando = false;
      }
    });
  }

  crearFormularioRol(): FormGroup {
    return this.fb.group({});
  }

  cargarUsuario(): void {
    this.cargando = true;
    this.mensajeError = '';
    
    this.userService.getUser(this.usuarioId).subscribe({
      next: (response) => {
        this.usuario = response.data;
        this.selectedRoles = this.usuario.roles || (this.usuario.role ? [this.usuario.role] : []);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.mensajeError = 'No se pudo cargar la información del usuario.';
        this.cargando = false;
      }
    });
  }

  mostrarFormulario(): void {
    this.formularioVisible = true;
    this.submitted = false;
  }

  cancelarFormulario(): void {
    this.formularioVisible = false;
    this.mensajeError = '';
  }

  onRoleChange(event: any): void {
    const roleValue = event.target.value as 'admin' | 'company_admin' | 'user_control' | 'user_responsible';
    const isChecked = event.target.checked;
    
    if (isChecked) {
      // Agregar rol si no está en la lista
      if (!this.selectedRoles.includes(roleValue)) {
        this.selectedRoles.push(roleValue);
      }
    } else {
      // Eliminar rol si está en la lista
      this.selectedRoles = this.selectedRoles.filter(role => role !== roleValue);
    }
  }

  isRoleSelected(roleValue: string): boolean {
    return this.selectedRoles.includes(roleValue as 'admin' | 'company_admin' | 'user_control' | 'user_responsible');
  }

  hasSelectedRoles(): boolean {
    return this.selectedRoles.length > 0;
  }

  guardarCambioRol(): void {
    this.submitted = true;
    
    if (!this.hasSelectedRoles() || !this.usuario) return;

    // Preparar datos para actualizar los roles del usuario
    const datosUsuario: Partial<User> = {
      id: this.usuario.id,
      roles: this.selectedRoles
    };

    // Actualizar los roles del usuario
    this.userService.updateUser(this.usuario.id, datosUsuario)
      .subscribe({
        next: (response) => {
          // Actualizar el usuario en el componente
          if (this.usuario && response.data) {
            this.usuario = response.data;
          }
          
          // Cerrar el formulario
          this.formularioVisible = false;
        },
        error: (error) => {
          console.error('Error al actualizar los roles del usuario', error);
          this.mensajeError = 'Error al actualizar los roles. Inténtelo de nuevo más tarde.';
        }
      });
  }

  obtenerNombreRol(rolCodigo: string): string {
    if (!rolCodigo) return 'Sin rol';
    
    const rol = this.rolesDisponibles.find(r => r.codigo === rolCodigo);
    if (rol) return rol.nombre;
    
    // Para el caso de 'admin' que no está en la lista
    if (rolCodigo === 'admin') return 'Administrador de Sistema';
    
    return rolCodigo;
  }

  volver(): void {
    this.router.navigate(['/users']);
  }
} 