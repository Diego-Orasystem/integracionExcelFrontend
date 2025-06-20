import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { CompanyService } from '../../core/services/company.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, RouterModule, TranslateModule],
  template: `
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">{{ 'PROFILE.TITLE' | translate }}</h4>
            </div>
            <div class="card-body">
              <div *ngIf="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">{{ 'PROFILE.LOADING' | translate }}</span>
                </div>
                <p class="mt-2">{{ 'PROFILE.LOADING' | translate }}</p>
              </div>

              <form *ngIf="!loading" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="mb-3">
                  <label for="name" class="form-label">{{ 'PROFILE.FULL_NAME' | translate }}</label>
                  <input type="text" class="form-control" id="name" formControlName="name">
                  <div *ngIf="profileForm.get('name')?.invalid && profileForm.get('name')?.touched" class="text-danger">
                    {{ 'PROFILE.NAME_REQUIRED' | translate }}
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="email" class="form-label">{{ 'PROFILE.EMAIL' | translate }}</label>
                  <input type="email" class="form-control" id="email" formControlName="email" readonly>
                </div>
                
                <div class="mb-3">
                  <label for="company" class="form-label">{{ 'PROFILE.COMPANY' | translate }}</label>
                  <input type="text" class="form-control" id="company" formControlName="company" readonly>
                </div>
                
                <div class="mb-3">
                  <label for="role" class="form-label">{{ 'PROFILE.ROLES' | translate }}</label>
                  <div *ngIf="hasRoles()" class="role-badges">
                    <span *ngFor="let role of user?.roles || []" class="badge bg-info me-2 mb-2">
                      {{ formatRoleName(role) }}
                    </span>
                  </div>
                  <div *ngIf="!hasRoles()" class="form-control-plaintext">
                    {{ 'PROFILE.NO_ROLES' | translate }}
                  </div>
                </div>
                
                <hr class="my-4">
                
                <h5>{{ 'PROFILE.CHANGE_PASSWORD' | translate }}</h5>
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">{{ 'PROFILE.CURRENT_PASSWORD' | translate }}</label>
                  <input type="password" class="form-control" id="currentPassword" formControlName="currentPassword">
                  <div *ngIf="profileForm.get('currentPassword')?.touched && profileForm.get('passwordGroup.newPassword')?.value && !profileForm.get('currentPassword')?.value" class="text-danger">
                    {{ 'PROFILE.CURRENT_PASSWORD_REQUIRED' | translate }}
                  </div>
                </div>
                
                <div formGroupName="passwordGroup">
                  <div class="mb-3">
                    <label for="newPassword" class="form-label">{{ 'PROFILE.NEW_PASSWORD' | translate }}</label>
                    <input type="password" class="form-control" id="newPassword" formControlName="newPassword">
                    <div *ngIf="profileForm.get('passwordGroup.newPassword')?.errors?.['minlength']" class="text-danger">
                      {{ 'PROFILE.PASSWORD_LENGTH' | translate }}
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="confirmPassword" class="form-label">{{ 'PROFILE.CONFIRM_PASSWORD' | translate }}</label>
                    <input type="password" class="form-control" id="confirmPassword" formControlName="confirmPassword">
                    <div *ngIf="profileForm.get('passwordGroup')?.errors?.['mismatch']" class="text-danger">
                      {{ 'PROFILE.PASSWORDS_MISMATCH' | translate }}
                    </div>
                  </div>
                </div>
                
                <div class="d-flex justify-content-between mt-4">
                  <button type="button" class="btn btn-outline-secondary" routerLink="/dashboard">{{ 'PROFILE.CANCEL' | translate }}</button>
                  <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || saving">
                    <span *ngIf="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {{ saving ? ('PROFILE.SAVING' | translate) : ('PROFILE.SAVE' | translate) }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastService: ToastService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    console.log('Iniciando componente de perfil de usuario');
    this.createForm();
    this.loadUserProfile();
    this.showPasswordDebugInfo();
  }

  createForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      company: [{ value: '', disabled: true }],
      currentPassword: [''],
      passwordGroup: this.fb.group({
        newPassword: ['', [Validators.minLength(8)]],
        confirmPassword: ['']
      }, { validators: this.passwordMatchValidator })
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    console.log('Cargando perfil de usuario...');
    this.userService.getCurrentUser().pipe(
      switchMap(response => {
        this.user = response.data;
        console.log('Datos del usuario obtenidos:', this.user);
        
        // Si el usuario tiene companyId, obtener detalles de la empresa
        if (this.user?.companyId) {
          return forkJoin({
            user: of(response),
            company: this.companyService.getCompanyById(this.user.companyId).pipe(
              catchError(err => {
                console.error('Error al obtener detalles de la empresa:', err);
                return of(null);
              })
            )
          });
        } else {
          return forkJoin({
            user: of(response),
            company: of(null)
          });
        }
      })
    ).subscribe({
      next: (results) => {
        // Usar directamente el campo name del usuario
        const userName = this.user?.name || '';
        
        // Obtener el nombre real de la empresa si está disponible
        let companyName = 'No asignada';
        if (results.company && results.company.data && results.company.data.name) {
          companyName = results.company.data.name;
        } else if (this.user?.companyId) {
          companyName = 'Empresa ID: ' + this.user.companyId;
        }
        
        this.profileForm.patchValue({
          name: userName,
          email: this.user?.email || '',
          company: companyName
        });
        
        console.log('Formulario cargado con datos:', {
          name: userName,
          email: this.user?.email || '',
          company: companyName,
          roles: this.user?.roles || []
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el perfil:', error);
        this.toastService.showError('Error al cargar datos del perfil');
        this.loading = false;
      }
    });
  }

  formatRoleName(role: string): string {
    const roleMap: {[key: string]: string} = {
      'admin': 'Administrador',
      'company_admin': 'Administrador de Empresa',
      'user_control': 'Usuario de Control',
      'user_responsible': 'Usuario Responsable'
    };
    return roleMap[role] || role;
  }

  passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return newPassword && confirmPassword && newPassword !== confirmPassword 
      ? { 'mismatch': true } 
      : null;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    // Preparar los datos para actualizar
    const formData: any = {
      name: this.profileForm.get('name')?.value?.trim()
    };
    
    // Agregar cambio de contraseña si se proporciona
    const newPassword = this.profileForm.get('passwordGroup.newPassword')?.value;
    const currentPassword = this.profileForm.get('currentPassword')?.value;
    
    if (newPassword && currentPassword) {
      console.log('Contraseña actual:', currentPassword);
      console.log('Nueva contraseña:', newPassword);
      formData.currentPassword = currentPassword;
      formData.newPassword = newPassword;
    }
    
    console.log('Datos a enviar:', formData);
    
    this.saving = true;
    this.userService.updateProfile(formData).subscribe({
      next: (response) => {
        // Actualizar el usuario local con los datos actualizados
        if (response.data) {
          this.user = response.data;
        }
        
        this.toastService.showSuccess('Perfil actualizado correctamente');
        this.saving = false;
        
        // Limpiar campos de contraseña
        this.profileForm.get('currentPassword')?.reset();
        this.profileForm.get('passwordGroup')?.reset();
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        this.toastService.showError(error.error?.message || 'Error al actualizar el perfil');
        this.saving = false;
      }
    });
  }

  showPasswordDebugInfo(): void {
    console.log('=== Información de seguridad ===');
    console.log('Campo de contraseña actual inicializado');
    console.log('Campo de nueva contraseña inicializado');
    console.log('Campos de contraseña listos para usuario:', localStorage.getItem('userEmail') || 'No disponible');
    
    // Intentar obtener información guardada en localStorage si existe
    try {
      const savedAuthData = localStorage.getItem('authData');
      if (savedAuthData) {
        const parsedData = JSON.parse(savedAuthData);
        console.log('Datos de autenticación encontrados:', {
          tokenPresente: !!parsedData.token,
          tokenLongitud: parsedData.token ? parsedData.token.length : 0,
          refreshTokenPresente: !!parsedData.refreshToken,
          ultimoAcceso: parsedData.lastAccess || 'No disponible'
        });
      } else {
        console.log('No se encontraron datos de autenticación en localStorage');
      }
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
    }
  }

  hasRoles(): boolean {
    return this.user?.roles !== undefined && 
           this.user.roles !== null && 
           this.user.roles.length > 0;
  }
} 