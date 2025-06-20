import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { SharedModule } from '../../../shared/shared.module';
import { CompanyService } from '../../../core/services/company.service';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule
  ],
  template: `
    <div class="edit-user-container">
      <div class="header">
        <h1>{{ 'USERS.EDIT.TITLE' | translate }}</h1>
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> {{ 'USERS.EDIT.BACK' | translate }}
        </button>
      </div>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'USERS.EDIT.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadUser()">{{ 'USERS.RETRY' | translate }}</button>
      </div>
      
      <div class="form-container" *ngIf="!loading && !errorMessage">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">{{ 'USERS.EDIT.FULL_NAME' | translate }}</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name" 
              placeholder="{{ 'USERS.EDIT.FULL_NAME_PLACEHOLDER' | translate }}"
            >
            <div *ngIf="submitted && f['name'].errors" class="error-message">
              <span *ngIf="f['name'].errors['required']">{{ 'USERS.EDIT.NAME_REQUIRED' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">{{ 'USERS.EDIT.EMAIL' | translate }}</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="{{ 'USERS.EDIT.EMAIL_PLACEHOLDER' | translate }}"
            >
            <div *ngIf="submitted && f['email'].errors" class="error-message">
              <span *ngIf="f['email'].errors['required']">{{ 'USERS.EDIT.EMAIL_REQUIRED' | translate }}</span>
              <span *ngIf="f['email'].errors['email']">{{ 'USERS.EDIT.EMAIL_INVALID' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">{{ 'USERS.EDIT.PASSWORD' | translate }}</label>
            <div class="password-input-container">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                id="password" 
                formControlName="password" 
                placeholder="{{ 'USERS.EDIT.PASSWORD_PLACEHOLDER' | translate }}"
              >
              <button 
                type="button" 
                class="toggle-password-btn" 
                (click)="showPassword = !showPassword" 
                [attr.aria-label]="showPassword ? ('USERS.EDIT.HIDE_PASSWORD' | translate) : ('USERS.EDIT.SHOW_PASSWORD' | translate)"
              >
                <i class="fas" [class.fa-eye]="!showPassword" [class.fa-eye-slash]="showPassword"></i>
              </button>
            </div>
            <div *ngIf="submitted && f['password'].errors" class="error-message">
              <span *ngIf="f['password'].errors['minlength']">{{ 'USERS.EDIT.PASSWORD_LENGTH' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ 'USERS.EDIT.ROLES' | translate }}</label>
            <div class="roles-container">
              <div class="role-checkbox" *ngFor="let roleOption of availableRoles">
                <label>
                  <input 
                    type="checkbox"
                    [value]="roleOption.value"
                    (change)="onRoleChange($event)"
                    [checked]="isRoleSelected(roleOption.value)"
                  >
                  {{ roleOption.label }}
                </label>
              </div>
            </div>
            <div *ngIf="submitted && !hasSelectedRoles()" class="error-message">
              <span>{{ 'USERS.EDIT.SELECT_ROLE' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group" *ngIf="authService.currentUser?.role === 'admin' || authService.hasRole(['admin'])">
            <label for="companyId">{{ 'USERS.EDIT.COMPANY' | translate }}</label>
            <select id="companyId" formControlName="companyId">
              <option value="">{{ 'USERS.EDIT.COMPANY_PLACEHOLDER' | translate }}</option>
              <option *ngFor="let company of companies" [value]="company._id">
                {{company.name}}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>{{ 'USERS.EDIT.PREFERENCES' | translate }}</label>
            <div class="preferences-container" formGroupName="preferences">
              <div class="pref-item">
                <label for="language">{{ 'USERS.EDIT.LANGUAGE' | translate }}</label>
                <select id="language" formControlName="language">
                  <option value="es">{{ 'GLOBAL.SPANISH' | translate }}</option>
                  <option value="en">{{ 'GLOBAL.ENGLISH' | translate }}</option>
                </select>
              </div>
              
              <div class="pref-item">
                <label for="theme">{{ 'USERS.EDIT.THEME' | translate }}</label>
                <select id="theme" formControlName="theme">
                  <option value="light">{{ 'USERS.EDIT.LIGHT' | translate }}</option>
                  <option value="dark">{{ 'USERS.EDIT.DARK' | translate }}</option>
                </select>
              </div>
              
              <div class="pref-item">
                <label for="defaultView">{{ 'USERS.EDIT.DEFAULT_VIEW' | translate }}</label>
                <select id="defaultView" formControlName="defaultView">
                  <option value="list">{{ 'USERS.EDIT.LIST' | translate }}</option>
                  <option value="grid">{{ 'USERS.EDIT.GRID' | translate }}</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="btn-cancel" 
              (click)="goBack()"
            >
              {{ 'USERS.EDIT.CANCEL' | translate }}
            </button>
            <button 
              type="submit" 
              class="btn-submit" 
              [disabled]="submitting"
            >
              <span *ngIf="submitting">{{ 'USERS.EDIT.SAVING' | translate }}</span>
              <span *ngIf="!submitting">{{ 'USERS.EDIT.SAVE' | translate }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .edit-user-container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      color: #333;
    }
    .btn-back {
      background: none;
      border: none;
      color: #2196F3;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 16px;
      transition: color 0.3s;
    }
    .btn-back:hover {
      color: #0b7dda;
    }
    .form-container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 30px;
      max-width: 600px;
      margin: 0 auto;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }
    input, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus, select:focus {
      border-color: #2196F3;
      outline: none;
    }
    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .toggle-password-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 5px;
      font-size: 16px;
    }
    .toggle-password-btn:focus {
      outline: none;
    }
    .toggle-password-btn:hover {
      color: #333;
    }
    .preferences-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .pref-item {
      margin-bottom: 10px;
    }
    .roles-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
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
      width: auto;
      margin-right: 8px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 30px;
    }
    .btn-cancel, .btn-submit {
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s, color 0.3s;
    }
    .btn-cancel {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      color: #555;
    }
    .btn-cancel:hover {
      background-color: #e0e0e0;
    }
    .btn-submit {
      background-color: #2196F3;
      border: 1px solid #2196F3;
      color: white;
    }
    .btn-submit:hover {
      background-color: #0b7dda;
    }
    .btn-submit:disabled {
      background-color: #b0c7d6;
      border-color: #b0c7d6;
      cursor: not-allowed;
    }
    .loading, .error-message {
      text-align: center;
      margin: 40px 0;
    }
    .error-message p {
      color: #f44336;
      margin-bottom: 15px;
    }
    .btn-retry {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-retry:hover {
      background-color: #d32f2f;
    }
  `]
})
export class EditUserComponent implements OnInit {
  userForm!: FormGroup;
  submitted = false;
  submitting = false;
  loading = true;
  errorMessage = '';
  userId = '';
  companies: any[] = [];
  showPassword = false;
  selectedRoles: string[] = [];
  
  availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'company_admin', label: 'Admin. Empresa' },
    { value: 'user_control', label: 'Usuario de Control' },
    { value: 'user_responsible', label: 'Usuario Responsable' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private companyService: CompanyService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.userId = this.route.snapshot.params['id'];
    if (this.userId) {
      this.loadUser();
    } else {
      this.loading = false;
    }

    this.loadCompanies();
  }

  initForm(): void {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      companyId: [''],
      preferences: this.formBuilder.group({
        language: ['es'],
        theme: ['light'],
        defaultView: ['list']
      })
    });
  }

  loadUser(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getUserById(this.userId)
      .subscribe({
        next: (response) => {
          if (response.data) {
            const user = response.data;
            
            // Actualizar formulario con datos del usuario
            this.userForm.patchValue({
              name: user.name,
              email: user.email,
              companyId: user.companyId || '',
              preferences: user.preferences || {
                language: 'es',
                theme: 'light',
                defaultView: 'list'
              }
            });
            
            // Actualizar roles seleccionados
            this.selectedRoles = user.roles || (user.role ? [user.role] : []);
            
            this.loading = false;
          } else {
            this.errorMessage = 'No se pudo cargar la información del usuario';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error al cargar usuario:', error);
          this.errorMessage = 'Error al cargar la información del usuario. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (response) => {
        if (response.data) {
          this.companies = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    // Verificar que al menos un rol esté seleccionado
    if (!this.hasSelectedRoles()) {
      return;
    }

    if (this.userForm.invalid) {
      return;
    }

    this.submitting = true;

    const userData = {
      ...this.userForm.value,
      roles: this.selectedRoles
    };

    // Si el password está vacío, eliminarlo para no actualizarlo
    if (!userData.password) {
      delete userData.password;
    }

    this.userService.updateUser(this.userId, userData)
      .subscribe({
        next: (response) => {
          console.log('Usuario actualizado:', response);
          this.submitting = false;
          // Redirigir a la lista de usuarios
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.submitting = false;
          // Mostrar mensaje de error
          this.errorMessage = 'Error al actualizar usuario. Por favor, intente nuevamente.';
        }
      });
  }

  onRoleChange(event: any): void {
    const roleValue = event.target.value;
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
    return this.selectedRoles.includes(roleValue);
  }

  hasSelectedRoles(): boolean {
    return this.selectedRoles.length > 0;
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  get f() {
    return this.userForm.controls;
  }
} 