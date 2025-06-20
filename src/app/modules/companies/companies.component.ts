import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { CompanyService } from '../../core/services/company.service';
import { Company } from '../../core/models/company.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="companies-container">
      <h1>Gestión de Empresas</h1>
      <p>Administra las empresas del sistema.</p>
      
      <!-- Barra de acciones -->
      <div class="action-bar">
        <button class="btn-create" (click)="showCreateModal = true">
          <i class="fas fa-plus"></i> Nueva Empresa
        </button>
        
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Buscar empresas..." 
            [(ngModel)]="searchTerm"
            (keyup.enter)="searchCompanies()">
          <button (click)="searchCompanies()">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>
      
      <!-- Lista de empresas -->
      <div class="companies-list">
        <div *ngIf="loading" class="loading">
          <p>Cargando empresas...</p>
        </div>
        
        <div *ngIf="!loading && (!companies || companies.length === 0)" class="empty-state">
          <p>No hay empresas registradas</p>
        </div>
        
        <table *ngIf="!loading && companies && companies.length > 0" class="companies-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dominio</th>
              <th>Estado</th>
              <th>Usuarios</th>
              <th>Archivos</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let company of companies">
              <td>
                <div class="company-name">
                  <img *ngIf="company.logo" [src]="company.logo" alt="Logo" class="company-logo">
                  <div class="company-icon" *ngIf="!company.logo">
                    {{ getInitials(company.name) }}
                  </div>
                  <span>{{ company.name }}</span>
                </div>
              </td>
              <td>{{ company.emailDomain }}</td>
              <td>
                <span class="status-badge" [ngClass]="{'status-active': company.active, 'status-inactive': !company.active}">
                  {{ company.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>{{ getUserCount(company) }}</td>
              <td>{{ getFileCount(company) }}</td>
              <td>{{ formatDate(company.createdAt) }}</td>
              <td class="actions">
                <button title="Ver detalles" (click)="viewCompanyDetails(company._id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button title="Editar" (click)="editCompany(company)">
                  <i class="fas fa-edit"></i>
                </button>
                <button title="Eliminar" (click)="confirmDeleteCompany(company)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Paginación -->
        <div *ngIf="pagination && pagination.total > 0" class="pagination">
          <button 
            [disabled]="currentPage === 1" 
            (click)="goToPage(currentPage - 1)">
            Anterior
          </button>
          <span>Página {{ currentPage }} de {{ pagination.pages }}</span>
          <button 
            [disabled]="currentPage === pagination.pages" 
            (click)="goToPage(currentPage + 1)">
            Siguiente
          </button>
        </div>
      </div>
      
      <!-- Modal de creación/edición -->
      <div *ngIf="showCreateModal || editingCompany" class="company-modal">
        <div class="modal-content">
          <h3>{{ editingCompany ? 'Editar Empresa' : 'Nueva Empresa' }}</h3>
          
          <form [formGroup]="companyForm" (ngSubmit)="saveCompany()">
            <div class="form-group">
              <label for="name">Nombre de la empresa:</label>
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
            
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="cancelCompanyEdit()">Cancelar</button>
              <button 
                type="submit" 
                class="btn-save" 
                [disabled]="companyForm.invalid || saving">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Modal de confirmación de eliminación -->
      <div *ngIf="showDeleteConfirm" class="delete-confirm-modal">
        <div class="modal-content">
          <h3>Confirmar Eliminación</h3>
          <p>¿Está seguro que desea eliminar la empresa <strong>{{ companyToDelete?.name }}</strong>?</p>
          <p class="warning">Esta acción no se puede deshacer y eliminará todos los datos asociados a esta empresa.</p>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="showDeleteConfirm = false">Cancelar</button>
            <button 
              type="button" 
              class="btn-delete" 
              [disabled]="deleting"
              (click)="deleteCompany()">
              {{ deleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .companies-container {
      padding: 20px;
    }
    
    .action-bar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .btn-create {
      background-color: #4a63a9;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .search-box {
      display: flex;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .search-box input {
      padding: 8px 12px;
      border: none;
      min-width: 250px;
    }
    
    .search-box button {
      background-color: #f5f5f5;
      border: none;
      padding: 0 15px;
      cursor: pointer;
    }
    
    .companies-list {
      margin-top: 20px;
      min-height: 300px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    
    .companies-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .companies-table th, .companies-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .companies-table th {
      background-color: #f9f9f9;
      font-weight: 600;
    }
    
    .company-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .company-logo {
      width: 30px;
      height: 30px;
      object-fit: contain;
    }
    
    .company-icon {
      width: 30px;
      height: 30px;
      background-color: #4a63a9;
      color: white;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      font-weight: bold;
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
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    .actions button {
      background: none;
      border: none;
      color: #4a63a9;
      cursor: pointer;
      font-size: 16px;
    }
    
    .empty-state, .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #777;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 20px;
      gap: 15px;
    }
    
    .pagination button {
      padding: 8px 15px;
      border-radius: 4px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      cursor: pointer;
    }
    
    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .company-modal, .delete-confirm-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      width: 500px;
      max-width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
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
    
    .modal-actions {
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
    
    .btn-delete {
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
    }
    
    .warning {
      color: #dc3545;
      font-size: 0.9em;
    }
    
    h1 {
      margin-bottom: 15px;
      color: #333;
    }
  `]
})
export class CompaniesComponent implements OnInit {
  companies: Company[] = [];
  loading = false;
  showCreateModal = false;
  editingCompany: Company | null = null;
  companyForm!: FormGroup;
  showDeleteConfirm = false;
  companyToDelete: Company | null = null;
  saving = false;
  deleting = false;
  currentPage = 1;
  itemsPerPage = 10;
  searchTerm = '';
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null = null;
  
  constructor(
    private companyService: CompanyService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCompanies();
  }
  
  initForm(): void {
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
  }
  
  loadCompanies(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    
    this.companyService.getCompanies(params).subscribe({
      next: (response) => {
        this.loading = false;
        this.companies = response.data;
        this.pagination = response.pagination || null;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error cargando empresas:', error);
      }
    });
  }
  
  searchCompanies(): void {
    this.currentPage = 1;
    this.loadCompanies();
  }
  
  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCompanies();
  }
  
  editCompany(company: Company): void {
    this.editingCompany = company;
    
    this.companyForm.patchValue({
      name: company.name,
      emailDomain: company.emailDomain || '',
      description: company.description || '',
      logo: company.logo || '',
      active: company.active
    });
  }
  
  confirmDeleteCompany(company: Company): void {
    this.companyToDelete = company;
    this.showDeleteConfirm = true;
  }
  
  deleteCompany(): void {
    if (!this.companyToDelete) return;
    
    this.deleting = true;
    this.companyService.deleteCompany(this.companyToDelete._id).subscribe({
      next: (response) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.companyToDelete = null;
        this.loadCompanies();
      },
      error: (error) => {
        this.deleting = false;
        console.error('Error eliminando empresa:', error);
      }
    });
  }
  
  viewCompanyDetails(companyId: string): void {
    // Navegación a la vista detallada de la empresa
    this.router.navigate(['/companies', companyId]);
  }
  
  saveCompany(): void {
    if (this.companyForm.invalid) return;
    
    this.saving = true;
    const companyData = this.companyForm.value;
    
    if (this.editingCompany) {
      // Actualizar empresa existente
      this.companyService.updateCompany(this.editingCompany._id, companyData).subscribe({
        next: (response) => {
          this.saving = false;
          this.cancelCompanyEdit();
          this.loadCompanies();
        },
        error: (error) => {
          this.saving = false;
          console.error('Error actualizando empresa:', error);
        }
      });
    } else {
      // Crear nueva empresa
      this.companyService.createCompany(companyData).subscribe({
        next: (response) => {
          this.saving = false;
          this.cancelCompanyEdit();
          this.loadCompanies();
        },
        error: (error) => {
          this.saving = false;
          console.error('Error creando empresa:', error);
        }
      });
    }
  }
  
  cancelCompanyEdit(): void {
    this.showCreateModal = false;
    this.editingCompany = null;
    this.companyForm.reset({
      active: true
    });
  }
  
  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  formatDate(dateString?: string | Date): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  getUserCount(company: Company): number {
    // @ts-ignore - La propiedad puede venir del backend aunque no esté en el modelo
    return company.userCount || 0;
  }
  
  getFileCount(company: Company): number {
    // @ts-ignore - La propiedad puede venir del backend aunque no esté en el modelo
    return company.fileCount || 0;
  }
} 