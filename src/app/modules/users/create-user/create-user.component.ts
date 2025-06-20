import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { SharedModule } from '../../../shared/shared.module';
import { CompanyService } from '../../../core/services/company.service';
import { CreateUserData } from '../../../core/models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule
  ],
  template: `
    <div class="create-user-container">
      <div class="header">
        <h1>{{ 'USERS.CREATE.TITLE' | translate }}</h1>
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> {{ 'USERS.CREATE.BACK' | translate }}
        </button>
      </div>
      
      <div class="form-container">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">{{ 'USERS.CREATE.FULL_NAME' | translate }}</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name" 
              placeholder="{{ 'USERS.CREATE.FULL_NAME_PLACEHOLDER' | translate }}"
            >
            <div *ngIf="submitted && f['name'].errors" class="error-message">
              <span *ngIf="f['name'].errors['required']">{{ 'USERS.CREATE.NAME_REQUIRED' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">{{ 'USERS.CREATE.EMAIL' | translate }}</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="{{ 'USERS.CREATE.EMAIL_PLACEHOLDER' | translate }}"
            >
            <div *ngIf="submitted && f['email'].errors" class="error-message">
              <span *ngIf="f['email'].errors['required']">{{ 'USERS.CREATE.EMAIL_REQUIRED' | translate }}</span>
              <span *ngIf="f['email'].errors['email']">{{ 'USERS.CREATE.EMAIL_INVALID' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">{{ 'USERS.CREATE.PASSWORD' | translate }}</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              placeholder="{{ 'USERS.CREATE.PASSWORD_PLACEHOLDER' | translate }}"
            >
            <div *ngIf="submitted && f['password'].errors" class="error-message">
              <span *ngIf="f['password'].errors['required']">{{ 'USERS.CREATE.PASSWORD_REQUIRED' | translate }}</span>
              <span *ngIf="f['password'].errors['minlength']">{{ 'USERS.CREATE.PASSWORD_LENGTH' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="role">{{ 'USERS.CREATE.ROLE' | translate }}</label>
            <select id="role" formControlName="role">
              <option value="admin">{{ 'USER_ROLES.ADMIN' | translate }}</option>
              <option value="company_admin">{{ 'USER_ROLES.COMPANY_ADMIN' | translate }}</option>
              <option value="user_control">{{ 'USER_ROLES.CONTROL' | translate }}</option>
              <option value="user_responsible">{{ 'USER_ROLES.RESPONSIBLE' | translate }}</option>
            </select>
            <div *ngIf="submitted && f['role'].errors" class="error-message">
              <span *ngIf="f['role'].errors['required']">{{ 'USERS.CREATE.ROLE_REQUIRED' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="companyId">{{ 'USERS.CREATE.COMPANY' | translate }}</label>
            <select id="companyId" formControlName="companyId">
              <option value="">{{ 'USERS.CREATE.COMPANY_PLACEHOLDER' | translate }}</option>
              <option *ngFor="let company of companies" [value]="company._id">
                {{company.name}}
              </option>
            </select>
            <div *ngIf="submitted && f['companyId'].errors" class="error-message">
              <span *ngIf="f['companyId'].errors['required']">{{ 'USERS.CREATE.COMPANY_REQUIRED' | translate }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ 'USERS.CREATE.PREFERENCES' | translate }}</label>
            <div class="preferences-container" formGroupName="preferences">
              <div class="pref-item">
                <label for="language">{{ 'USERS.CREATE.LANGUAGE' | translate }}</label>
                <select id="language" formControlName="language">
                  <option value="es">{{ 'GLOBAL.SPANISH' | translate }}</option>
                  <option value="en">{{ 'GLOBAL.ENGLISH' | translate }}</option>
                </select>
              </div>
              
              <div class="pref-item">
                <label for="theme">{{ 'USERS.CREATE.THEME' | translate }}</label>
                <select id="theme" formControlName="theme">
                  <option value="light">{{ 'USERS.CREATE.LIGHT' | translate }}</option>
                  <option value="dark">{{ 'USERS.CREATE.DARK' | translate }}</option>
                </select>
              </div>
              
              <div class="pref-item">
                <label for="defaultView">{{ 'USERS.CREATE.DEFAULT_VIEW' | translate }}</label>
                <select id="defaultView" formControlName="defaultView">
                  <option value="list">{{ 'USERS.CREATE.LIST' | translate }}</option>
                  <option value="grid">{{ 'USERS.CREATE.GRID' | translate }}</option>
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
              {{ 'USERS.CREATE.CANCEL' | translate }}
            </button>
            <button 
              type="submit" 
              class="btn-submit" 
              [disabled]="loading"
            >
              <span *ngIf="loading">{{ 'USERS.CREATE.CREATING' | translate }}</span>
              <span *ngIf="!loading">{{ 'USERS.CREATE.CREATE' | translate }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-user-container {
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
    .preferences-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .pref-item {
      margin-bottom: 10px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 30px;
    }
    .btn-cancel {
      background-color: #f5f5f5;
      color: #555;
      border: none;
      padding: 12px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-submit {
      background-color: #4caf50;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      min-width: 150px;
    }
    .btn-submit:hover {
      background-color: #45a049;
    }
    .btn-submit:disabled {
      background-color: #a5d6a7;
      cursor: not-allowed;
    }
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-top: 5px;
    }
    @media (max-width: 768px) {
      .preferences-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CreateUserComponent implements OnInit {
  userForm!: FormGroup;
  loading = false;
  submitted = false;
  companies: any[] = [];
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private companyService: CompanyService
  ) { }
  
  ngOnInit(): void {
    this.initForm();
    this.loadCompanies();
  }
  
  // Getter para acceder fácilmente a los controles del formulario
  get f() { 
    return this.userForm.controls; 
  }
  
  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (response) => {
        this.companies = response.data || [];
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
  }
  
  initForm(): void {
    this.userForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user_responsible', Validators.required],
      companyId: ['', Validators.required],
      preferences: this.formBuilder.group({
        language: ['es'],
        theme: ['light'],
        defaultView: ['list']
      })
    });
  }
  
  onSubmit(): void {
    this.submitted = true;
    
    // Detener si el formulario es inválido
    if (this.userForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const userData: CreateUserData = {
      ...this.userForm.value
    };
    
    this.userService.createUser(userData).subscribe({
      next: (response) => {
        console.log('Usuario creado con éxito:', response);
        this.loading = false;
        this.router.navigate(['/users']);
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.loading = false;
        
        // Mostrar mensaje de error
        if (error.error && error.error.error && error.error.error.message) {
          alert(`Error: ${error.error.error.message}`);
        } else if (error.error && error.error.message) {
          alert(`Error: ${error.error.message}`);
        } else {
          alert('Error al crear el usuario. Por favor, inténtelo de nuevo.');
        }
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/users']);
  }
} 