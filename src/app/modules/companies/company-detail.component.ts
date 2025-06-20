import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from '../../core/services/company.service';
import { Company, CompanyStats } from '../../core/models/company.model';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="company-detail-container">
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
        <h1>{{ company?.name || 'Detalles de empresa' }}</h1>
      </div>
      
      <div *ngIf="loading" class="loading">
        <p>Cargando información de la empresa...</p>
      </div>
      
      <div *ngIf="!loading && !company" class="error-state">
        <p>No se pudo cargar la información de la empresa</p>
        <button (click)="loadCompany()">Reintentar</button>
      </div>
      
      <div *ngIf="!loading && company" class="company-content">
        <div class="company-info">
          <div class="card">
            <div class="card-header">
              <h2>Información general</h2>
              <button (click)="editMode = !editMode" class="edit-button">
                <i class="fas" [ngClass]="editMode ? 'fa-times' : 'fa-edit'"></i>
                {{ editMode ? 'Cancelar' : 'Editar' }}
              </button>
            </div>
            
            <div *ngIf="!editMode" class="company-details">
              <div class="detail-item">
                <span class="label">Nombre:</span>
                <span>{{ company.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Dominio de correo:</span>
                <span>{{ company.emailDomain }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Descripción:</span>
                <span>{{ company.description || 'Sin descripción' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Estado:</span>
                <span class="status-badge" [ngClass]="{'status-active': company.active, 'status-inactive': !company.active}">
                  {{ company.active ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="label">Creada el:</span>
                <span>{{ formatDate(company.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Última actualización:</span>
                <span>{{ formatDate(company.updatedAt) }}</span>
              </div>
            </div>
            
            <form *ngIf="editMode" [formGroup]="companyForm" (ngSubmit)="saveCompany()" class="edit-form">
              <div class="form-group">
                <label for="name">Nombre:</label>
                <input 
                  type="text" 
                  id="name" 
                  formControlName="name" 
                  placeholder="Nombre de la empresa">
                <div class="error-message" *ngIf="companyForm.get('name')?.invalid && companyForm.get('name')?.touched">
                  El nombre de la empresa es obligatorio
                </div>
              </div>
              
              <div class="form-group">
                <label for="emailDomain">Dominio de correo:</label>
                <input 
                  type="text" 
                  id="emailDomain" 
                  formControlName="emailDomain" 
                  placeholder="example.com">
                <div class="error-message" *ngIf="companyForm.get('emailDomain')?.invalid && companyForm.get('emailDomain')?.touched">
                  El dominio de correo es obligatorio y debe tener un formato válido
                </div>
              </div>
              
              <div class="form-group">
                <label for="description">Descripción:</label>
                <textarea 
                  id="description" 
                  formControlName="description" 
                  rows="3" 
                  placeholder="Descripción de la empresa"></textarea>
              </div>
              
              <div class="form-group">
                <label for="logo">URL del logo:</label>
                <input 
                  type="text" 
                  id="logo" 
                  formControlName="logo" 
                  placeholder="URL del logo">
              </div>
              
              <div class="form-group">
                <label>Estado:</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" formControlName="active" [value]="true"> Activa
                  </label>
                  <label>
                    <input type="radio" formControlName="active" [value]="false"> Inactiva
                  </label>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-cancel" (click)="editMode = false">Cancelar</button>
                <button 
                  type="submit" 
                  class="btn-save" 
                  [disabled]="companyForm.invalid || saving">
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h2>Estadísticas</h2>
            </div>
            
            <div class="stats-container">
              <div class="stat-item">
                <div class="stat-value">{{ stats?.userStats?.total || 0 }}</div>
                <div class="stat-label">Usuarios</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ stats?.storageStats?.totalFiles || 0 }}</div>
                <div class="stat-label">Archivos</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatSize(stats?.storageStats?.totalSize || 0) }}</div>
                <div class="stat-label">Almacenamiento</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ stats?.storageStats?.totalFolders || 0 }}</div>
                <div class="stat-label">Carpetas</div>
              </div>
            </div>
            
            <div class="usage-bar">
              <div class="usage-fill" [style.width.%]="stats?.storageStats?.usedPercentage || 0"></div>
              <span class="usage-text">{{ stats?.storageStats?.usedPercentage || 0 }}% utilizado</span>
            </div>
          </div>
          
         <!--  <div class="card">
            <div class="card-header">
              <h2>Configuración SFTP</h2>
              <button (click)="editSftpMode = !editSftpMode" class="edit-button">
                <i class="fas" [ngClass]="editSftpMode ? 'fa-times' : 'fa-edit'"></i>
                {{ editSftpMode ? 'Cancelar' : 'Editar' }}
              </button>
            </div>
            
            <div *ngIf="!editSftpMode" class="sftp-details">
              <div *ngIf="!company.sftp || !company.sftp.enabled" class="empty-state">
                <p>Configuración SFTP no habilitada</p>
              </div>
              
              <div *ngIf="company.sftp && company.sftp.enabled" class="detail-list">
                <div class="detail-item">
                  <span class="label">Servidor:</span>
                  <span>{{ company.sftp.host }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Puerto:</span>
                  <span>{{ company.sftp.port }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Usuario:</span>
                  <span>{{ company.sftp.username }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Directorio raíz:</span>
                  <span>{{ company.sftp.rootDirectory }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Estado:</span>
                  <span class="status-badge" [ngClass]="{'status-active': company.sftp.enabled, 'status-inactive': !company.sftp.enabled}">
                    {{ company.sftp.enabled ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
            </div>
            
            <form *ngIf="editSftpMode" [formGroup]="sftpForm" (ngSubmit)="saveSftpConfig()" class="edit-form">
              <div class="form-group">
                <label>
                  <input type="checkbox" formControlName="enabled"> Habilitar SFTP
                </label>
              </div>
              
              <div *ngIf="sftpForm.get('enabled')?.value" class="sftp-fields">
                <div class="form-group">
                  <label for="host">Servidor:</label>
                  <input type="text" id="host" formControlName="host" placeholder="sftp.example.com">
                  <div class="error-message" *ngIf="sftpForm.get('host')?.invalid && sftpForm.get('host')?.touched">
                    El servidor es obligatorio
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="port">Puerto:</label>
                  <input type="number" id="port" formControlName="port" placeholder="22">
                  <div class="error-message" *ngIf="sftpForm.get('port')?.invalid && sftpForm.get('port')?.touched">
                    El puerto es obligatorio
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="username">Usuario:</label>
                  <input type="text" id="username" formControlName="username" placeholder="username">
                  <div class="error-message" *ngIf="sftpForm.get('username')?.invalid && sftpForm.get('username')?.touched">
                    El usuario es obligatorio
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="password">Contraseña:</label>
                  <input type="password" id="password" formControlName="password" placeholder="********">
                </div>
                
                <div class="form-group">
                  <label for="rootDirectory">Directorio raíz:</label>
                  <input type="text" id="rootDirectory" formControlName="rootDirectory" placeholder="/home/user">
                  <div class="error-message" *ngIf="sftpForm.get('rootDirectory')?.invalid && sftpForm.get('rootDirectory')?.touched">
                    El directorio raíz es obligatorio
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-cancel" (click)="editSftpMode = false">Cancelar</button>
                <button 
                  type="submit" 
                  class="btn-save" 
                  [disabled]="sftpForm.invalid || savingSftp">
                  {{ savingSftp ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div> -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-detail-container {
      padding: 20px;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      gap: 15px;
    }
    
    .back-button {
      background: none;
      border: none;
      color: #4a63a9;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .loading, .error-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #777;
    }
    
    .error-state button {
      margin-top: 10px;
      padding: 8px 15px;
      background-color: #4a63a9;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .company-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .card-header h2 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }
    
    .edit-button {
      background: none;
      border: none;
      color: #4a63a9;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .company-details, .sftp-details {
      padding: 10px 0;
    }
    
    .detail-item {
      margin-bottom: 15px;
      display: flex;
      flex-wrap: wrap;
    }
    
    .detail-item .label {
      font-weight: 600;
      width: 150px;
      color: #555;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
    }
    
    .status-active {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-inactive {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .edit-form {
      padding: 10px 0;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .radio-group {
      display: flex;
      gap: 20px;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 0.85em;
      margin-top: 5px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn-cancel {
      background-color: #f8f9fa;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
    }
    
    .btn-save {
      background-color: #4a63a9;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
    }
    
    .btn-save:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .stat-item {
      text-align: center;
      padding: 15px 10px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #4a63a9;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #555;
      font-size: 14px;
    }
    
    .usage-bar {
      height: 20px;
      background-color: #e9ecef;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      margin-top: 20px;
    }
    
    .usage-fill {
      height: 100%;
      background-color: #4a63a9;
      border-radius: 10px;
    }
    
    .usage-text {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
    
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      color: #777;
    }
    
    .sftp-fields {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    
    @media (min-width: 768px) {
      .company-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CompanyDetailComponent implements OnInit {
  companyId: string | null = null;
  company: Company | null = null;
  stats: CompanyStats | null = null;
  loading = false;
  editMode = false;
  editSftpMode = false;
  saving = false;
  savingSftp = false;
  
  companyForm: FormGroup;
  sftpForm: FormGroup;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private fb: FormBuilder
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      emailDomain: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)
      ]],
      description: [''],
      logo: [''],
      active: [true]
    });
    
    this.sftpForm = this.fb.group({
      enabled: [false],
      host: ['', Validators.required],
      port: [22, Validators.required],
      username: ['', Validators.required],
      password: [''],
      rootDirectory: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.companyId = this.route.snapshot.paramMap.get('id');
    if (this.companyId) {
      this.loadCompany();
    } else {
      this.router.navigate(['/companies']);
    }
  }
  
  loadCompany(): void {
    if (!this.companyId) return;
    
    this.loading = true;
    this.companyService.getCompanyById(this.companyId).subscribe({
      next: (response) => {
        this.company = response.data;
        this.updateForms();
        this.loadStats();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error cargando empresa:', error);
      }
    });
  }
  
  loadStats(): void {
    if (!this.companyId) return;
    
    this.companyService.getCompanyStats(this.companyId).subscribe({
      next: (response) => {
        this.loading = false;
        this.stats = response.data;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error cargando estadísticas:', error);
      }
    });
  }
  
  updateForms(): void {
    if (!this.company) return;
    
    this.companyForm.patchValue({
      name: this.company.name,
      emailDomain: this.company.emailDomain || '',
      description: this.company.description || '',
      logo: this.company.logo || '',
      active: this.company.active
    });
    
    if (this.company.sftp) {
      this.sftpForm.patchValue({
        enabled: this.company.sftp.enabled,
        host: this.company.sftp.host,
        port: this.company.sftp.port,
        username: this.company.sftp.username,
        password: '',
        rootDirectory: this.company.sftp.rootDirectory
      });
    }
  }
  
  saveCompany(): void {
    if (this.companyForm.invalid || !this.companyId) return;
    
    this.saving = true;
    const companyData = this.companyForm.value;
    
    this.companyService.updateCompany(this.companyId, companyData).subscribe({
      next: (response) => {
        this.saving = false;
        this.editMode = false;
        this.company = response.data;
      },
      error: (error) => {
        this.saving = false;
        console.error('Error actualizando empresa:', error);
      }
    });
  }
  
  saveSftpConfig(): void {
    if (this.sftpForm.invalid || !this.companyId) return;
    
    // Si no está habilitado, solo validamos el campo enabled
    if (!this.sftpForm.value.enabled) {
      const sftpData = { 
        enabled: false 
      };
      this.updateSftp(sftpData);
      return;
    }
    
    // Si está habilitado, validamos todos los campos
    const { enabled, host, port, username, password, rootDirectory } = this.sftpForm.value;
    
    const sftpData: any = {
      enabled,
      host,
      port,
      username,
      rootDirectory
    };
    
    // Solo incluir password si se proporciona
    if (password) {
      sftpData.password = password;
    }
    
    this.updateSftp(sftpData);
  }
  
  updateSftp(sftpData: any): void {
    this.savingSftp = true;
    this.companyService.updateSftpConfig(this.companyId!, sftpData).subscribe({
      next: (response) => {
        this.savingSftp = false;
        this.editSftpMode = false;
        this.company = response.data;
        // Limpiar password del formulario por seguridad
        this.sftpForm.get('password')?.setValue('');
      },
      error: (error) => {
        this.savingSftp = false;
        console.error('Error actualizando configuración SFTP:', error);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/companies']);
  }
  
  formatDate(dateString?: string | Date): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 