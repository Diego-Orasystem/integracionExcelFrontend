import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AreaService } from '../../../core/services/area.service';
import { UserService } from '../../../core/services/user.service';
import { CompanyService } from '../../../core/services/company.service';
import { Area } from '../../../core/models/area.model';
import { User } from '../../../core/models/user.model';
import { Company } from '../../../core/models/company.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule
  ],
  template: `
    <div class="areas-container">
      <div class="header-actions">
        <h1>{{ 'ORGANIZATION.AREAS.TITLE' | translate }}</h1>
        <button class="btn-add-area" (click)="showAreaForm()">
          <i class="fas fa-plus"></i> {{ 'ORGANIZATION.AREAS.ADD_AREA' | translate }}
        </button>
      </div>
      <p>{{ 'ORGANIZATION.AREAS.DESCRIPTION' | translate }}</p>
      
      <!-- Filtro por empresa (solo para administradores del sistema) -->
      <div class="filter-container" *ngIf="isAdmin">
        <div class="filter-section">
          <label for="companyFilter">{{ 'ORGANIZATION.AREAS.FILTER_BY_COMPANY' | translate }}:</label>
          <select 
            id="companyFilter" 
            [ngModel]="selectedCompanyId" 
            (ngModelChange)="onCompanyChange($event)"
            class="company-filter"
          >
            <option value="">{{ 'ORGANIZATION.AREAS.ALL_COMPANIES' | translate }}</option>
            <option *ngFor="let company of companies" [value]="company._id || company.id">
              {{ company.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'ORGANIZATION.AREAS.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage && !isFormVisible">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadAreas()">{{ 'ORGANIZATION.AREAS.RETRY' | translate }}</button>
      </div>
      
      <!-- Formulario para crear/editar área -->
      <div class="entity-form" *ngIf="isFormVisible">
        <div class="form-header">
          <h2>{{ editingArea ? ('ORGANIZATION.AREAS.EDIT_AREA' | translate) : ('ORGANIZATION.AREAS.CREATE_AREA' | translate) }}</h2>
          <button class="btn-close" (click)="cancelForm()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="error-message" *ngIf="errorMessage">
          <p>{{ errorMessage }}</p>
        </div>
        
        <form [formGroup]="areaForm" (ngSubmit)="saveArea()">
          <div class="form-group">
            <label for="name">{{ 'ORGANIZATION.AREAS.AREA_NAME' | translate }}</label>
            <input type="text" id="name" formControlName="name" placeholder="{{ 'ORGANIZATION.AREAS.AREA_NAME' | translate }}">
            <div class="validation-error" *ngIf="areaForm.get('name')?.invalid && areaForm.get('name')?.touched">
              {{ 'ORGANIZATION.AREAS.AREA_NAME_REQUIRED' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">{{ 'ORGANIZATION.AREAS.DESCRIPTION' | translate }}</label>
            <textarea id="description" formControlName="description" placeholder="{{ 'ORGANIZATION.AREAS.DESCRIPTION' | translate }}"></textarea>
          </div>
          
          <div class="form-group" *ngIf="isAdmin">
            <label for="companyId">{{ 'ORGANIZATION.AREAS.COMPANY' | translate }}</label>
            <select id="companyId" formControlName="companyId">
              <option value="">{{ 'ORGANIZATION.AREAS.SELECT_COMPANY' | translate }}</option>
              <option *ngFor="let company of companies" [value]="company._id || company.id">
                {{ company.name }}
              </option>
            </select>
            <div class="validation-error" *ngIf="areaForm.get('companyId')?.invalid && areaForm.get('companyId')?.touched">
              {{ 'ORGANIZATION.AREAS.COMPANY_REQUIRED' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="responsibleUserId">{{ 'ORGANIZATION.AREAS.RESPONSIBLE' | translate }}</label>
            <select id="responsibleUserId" formControlName="responsibleUserId">
              <option value="">{{ 'ORGANIZATION.AREAS.NO_RESPONSIBLE' | translate }}</option>
              <option *ngFor="let user of users" [value]="user._id || user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="expectedFiles">{{ 'ORGANIZATION.AREAS.EXPECTED_FILES' | translate }}</label>
            <input type="number" id="expectedFiles" formControlName="expectedFiles" placeholder="{{ 'ORGANIZATION.AREAS.EXPECTED_FILES' | translate }}" min="0">
            <div class="validation-error" *ngIf="areaForm.get('expectedFiles')?.invalid && areaForm.get('expectedFiles')?.touched">
              {{ 'ORGANIZATION.AREAS.EXPECTED_FILES_ERROR' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="defaultFileName">{{ 'ORGANIZATION.AREAS.DEFAULT_FILENAME' | translate }}</label>
            <input type="text" id="defaultFileName" formControlName="defaultFileName" placeholder="{{ 'ORGANIZATION.AREAS.DEFAULT_FILENAME_PLACEHOLDER' | translate }}">
            <small class="form-text text-muted">
              {{ 'ORGANIZATION.AREAS.DEFAULT_FILENAME_HELP' | translate }}
            </small>
          </div>
          
          <div class="form-check">
            <input type="checkbox" id="isDefaultFileRequired" formControlName="isDefaultFileRequired">
            <label for="isDefaultFileRequired">{{ 'ORGANIZATION.AREAS.DEFAULT_FILENAME_REQUIRED' | translate }}</label>
          </div>
          
          <div class="form-check">
            <input type="checkbox" id="active" formControlName="active">
            <label for="active">{{ 'ORGANIZATION.AREAS.ACTIVE' | translate }}</label>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelForm()">{{ 'ORGANIZATION.AREAS.CANCEL' | translate }}</button>
            <button type="submit" class="btn-save" [disabled]="areaForm.invalid">{{ 'ORGANIZATION.AREAS.SAVE' | translate }}</button>
          </div>
        </form>
      </div>
      
      <!-- Lista de áreas -->
      <div class="entities-list" *ngIf="!loading && !errorMessage && !isFormVisible">
        <div class="empty-state" *ngIf="areas.length === 0">
          <p>{{ 'ORGANIZATION.AREAS.NO_AREAS' | translate }}</p>
        </div>
        
        <table *ngIf="areas.length > 0" class="entities-table">
          <thead>
            <tr>
              <th>{{ 'ORGANIZATION.AREAS.NAME' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.DESCRIPTION' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.COMPANY_COLUMN' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.RESPONSIBLE_COLUMN' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.SUBAREAS' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.EXPECTED_FILES_COLUMN' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.STATUS' | translate }}</th>
              <th>{{ 'ORGANIZATION.AREAS.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let area of areas">
              <td>{{ area.name }}</td>
              <td>{{ area.description || '-' }}</td>
              <td>{{ area.companyName || '-' }}</td>
              <td>{{ area.responsibleUserName || ('ORGANIZATION.AREAS.UNASSIGNED' | translate) }}</td>
              <td>
                <span class="count-badge">
                  {{ area.subareaCount || 0 }}
                </span>
                <button class="btn-view-subareas" (click)="viewSubareas(area)">
                  <i class="fas fa-list"></i>
                </button>
              </td>
              <td>{{ area.expectedFiles || 0 }}</td>
              <td>
                <span class="status" [ngClass]="{'active': area.active, 'inactive': !area.active}">
                  {{ area.active ? ('ORGANIZATION.AREAS.ACTIVE' | translate) : ('USERS.INACTIVE' | translate) }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" (click)="editArea(area)" *ngIf="canEdit" title="{{ 'ORGANIZATION.AREAS.EDIT_AREA' | translate }}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-assign" (click)="assignResponsible(area)" *ngIf="canEdit" title="{{ 'ORGANIZATION.AREAS.ASSIGN_RESPONSIBLE' | translate }}">
                  <i class="fas fa-user-check"></i>
                </button>
                <button class="btn-toggle" (click)="toggleAreaStatus(area)" *ngIf="canEdit" title="{{ 'ORGANIZATION.AREAS.TOGGLE_STATUS' | translate }}">
                  <i class="fas" [ngClass]="area.active ? 'fa-ban' : 'fa-check'"></i>
                </button>
                <button class="btn-delete" (click)="deleteArea(area)" *ngIf="canDelete" title="{{ 'ORGANIZATION.AREAS.DELETE_AREA' | translate }}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .areas-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .filter-container {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .filter-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .filter-section label {
      font-weight: 500;
      color: #495057;
      min-width: 130px;
    }
    .company-filter {
      flex: 1;
      max-width: 300px;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      background-color: white;
    }
    .btn-add-area {
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
    .btn-add-area:hover {
      background-color: #45a049;
    }
    .entities-list {
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
    .entities-table {
      width: 100%;
      border-collapse: collapse;
    }
    .entities-table th, .entities-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .entities-table th {
      font-weight: 500;
      color: #666;
    }
    .entities-table tr:hover {
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
    .btn-edit, .btn-toggle, .btn-assign, .btn-delete, .btn-view-subareas {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
    }
    .btn-edit {
      color: #2196F3;
    }
    .btn-assign {
      color: #9c27b0;
    }
    .btn-toggle {
      color: #FF9800;
    }
    .btn-delete {
      color: #F44336;
    }
    .btn-view-subareas {
      color: #3f51b5;
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
    .error-message p {
      margin: 0;
    }
    .entity-form .error-message {
      margin-bottom: 15px;
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
    .entity-form {
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
    .form-group input, .form-group textarea, .form-group select {
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
    .form-check {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .form-check input {
      margin-right: 8px;
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
    .count-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      margin-right: 5px;
    }
  `]
})
export class AreasComponent implements OnInit {
  areas: Area[] = [];
  companies: Company[] = [];
  users: User[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  isFormVisible: boolean = false;
  areaForm: FormGroup;
  editingArea: Area | null = null;
  isAdmin: boolean = false;
  canCreate: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  currentUserCompanyId: string = '';
  selectedCompanyId: string = '';
  isCollapsed: boolean = false;

  constructor(
    private router: Router,
    private areaService: AreaService,
    private userService: UserService,
    private companyService: CompanyService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.areaForm = this.createAreaForm();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadAreas();
    this.loadUsers();
  }

  checkPermissions(): void {
    const currentUser = this.authService.currentUser;
    this.isAdmin = this.authService.hasPermission('admin');
    this.canCreate = this.authService.hasPermission('area_create');
    this.canEdit = this.authService.hasPermission('area_edit');
    this.canDelete = this.authService.hasPermission('area_delete');
    
    if (currentUser?.companyId) {
      this.currentUserCompanyId = currentUser.companyId;
    }
  }

  createAreaForm(area?: Area): FormGroup {
    const companyId = area?.companyId || this.currentUserCompanyId || '';
    
    return this.fb.group({
      name: [area?.name || '', [Validators.required]],
      description: [area?.description || ''],
      companyId: [companyId, [Validators.required]],
      responsibleUserId: [area?.responsibleUserId || ''],
      expectedFiles: [area?.expectedFiles || 0, [Validators.min(0)]],
      defaultFileName: [area?.defaultFileName || ''],
      isDefaultFileRequired: [area?.isDefaultFileRequired || false],
      active: [area?.active !== undefined ? area.active : true]
    });
  }

  loadAreas(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Si no es admin, filtrar por la compañía del usuario
    // Si es admin y hay una empresa seleccionada, filtrar por esa empresa
    let companyId: string | undefined;
    
    if (!this.isAdmin) {
      companyId = this.currentUserCompanyId;
    } else if (this.selectedCompanyId) {
      companyId = this.selectedCompanyId;
    }
    
    // Primero cargamos todas las compañías para tener sus nombres
    this.loadCompanies(() => {
      // Después cargamos las áreas
      this.areaService.getAreas(companyId).subscribe({
        next: (response) => {
          // Procesar los datos para asegurar que la información se muestre correctamente
          this.areas = response.data.map((area: any) => {
            // Extracción de datos anidados
            const responsibleUserName = area.responsibleUserId && typeof area.responsibleUserId === 'object' 
              ? area.responsibleUserId.name 
              : area.responsibleUserName || '';
              
            // Buscar el nombre de la compañía por su ID
            let companyName = '';
            if (area.companyId) {
              if (typeof area.companyId === 'object') {
                companyName = area.companyId.name || '';
              } else {
                // Buscar la compañía en la lista de compañías cargadas
                const foundCompany = this.companies.find(c => 
                  (c._id || c.id) === area.companyId
                );
                companyName = foundCompany ? foundCompany.name : '';
              }
            }
              
            return {
              ...area,
              responsibleUserName,
              companyName,
              subareaCount: 0 // Inicialmente lo dejamos en 0, después lo actualizamos
            };
          });
          
          // Cargar conteo de subáreas para cada área
          this.loadSubareaCounts();
          
          console.log('Áreas procesadas:', this.areas);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar áreas:', error);
          this.errorMessage = 'No se pudieron cargar las áreas. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
    });
  }

  loadCompanies(callback?: () => void): void {
    // Si no es admin, no necesitamos cargar las compañías para el formulario
    // pero sí las necesitamos para mostrar los nombres
    
    this.companyService.getCompanies().subscribe({
      next: (response) => {
        this.companies = response.data;
        if (callback) callback();
      },
      error: (error) => {
        console.error('Error al cargar compañías:', error);
        // Llamar al callback incluso si hay error para no bloquear la carga de áreas
        if (callback) callback();
      }
    });
  }

  loadUsers(): void {
    // Si no es admin, filtrar usuarios por la compañía del usuario actual
    const companyId = !this.isAdmin ? this.currentUserCompanyId : undefined;
    
    this.userService.getUsers(companyId).subscribe({
      next: (response) => {
        this.users = response.data;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  showAreaForm(): void {
    this.isFormVisible = true;
    this.editingArea = null;
    this.areaForm = this.createAreaForm();
    this.errorMessage = '';
  }

  cancelForm(): void {
    this.isFormVisible = false;
    this.editingArea = null;
    this.errorMessage = '';
  }

  editArea(area: Area): void {
    try {
      // Crear una copia del área para la edición
      const areaCopy = { ...area };
      
      // Extraer el ID del responsable si viene como objeto
      if (areaCopy.responsibleUserId && typeof areaCopy.responsibleUserId === 'object') {
        areaCopy.responsibleUserId = (areaCopy.responsibleUserId as any)._id || '';
      }
      
      // Extraer el ID de la compañía si viene como objeto
      if (areaCopy.companyId && typeof areaCopy.companyId === 'object') {
        areaCopy.companyId = (areaCopy.companyId as any)._id || '';
      }
      
      console.log('Área para editar:', areaCopy);
      
      this.editingArea = areaCopy;
      this.areaForm = this.createAreaForm(areaCopy);
      this.isFormVisible = true;
    } catch (error) {
      console.error('Error al preparar área para edición:', error);
      this.errorMessage = 'Error al preparar el área para edición. Por favor, intente nuevamente.';
    }
  }

  saveArea(): void {
    if (this.areaForm.invalid) return;
    
    const areaData: Partial<Area> = {
      ...this.areaForm.value
    };
    
    if (this.editingArea) {
      // Actualizar área existente
      const areaId = this.editingArea.id || this.editingArea._id || '';
      this.areaService.updateArea(areaId, areaData).subscribe({
        next: (response) => {
          console.log('Área actualizada correctamente:', response);
          this.loadAreas();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al actualizar área:', error);
          if (error.error && error.error.error && error.error.error.code === 'AREA_NAME_EXISTS') {
            this.errorMessage = 'Ya existe un área con ese nombre en esta compañía';
          } else {
            this.errorMessage = 'No se pudo actualizar el área. Por favor, intente nuevamente.';
          }
        }
      });
    } else {
      // Crear nueva área
      this.areaService.createArea(areaData).subscribe({
        next: (response) => {
          console.log('Área creada correctamente:', response);
          this.loadAreas();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al crear área:', error);
          if (error.error && error.error.error && error.error.error.code === 'AREA_NAME_EXISTS') {
            this.errorMessage = 'Ya existe un área con ese nombre en esta compañía';
          } else {
            this.errorMessage = 'No se pudo crear el área. Por favor, intente nuevamente.';
          }
        }
      });
    }
  }

  deleteArea(area: Area): void {
    if (confirm(`¿Está seguro de eliminar el área "${area.name}"? Esta acción puede afectar a las subáreas asociadas.`)) {
      // Obtener el ID del área, considerando si el _id viene directamente o dentro de un objeto
      const areaId = this.getEntityId(area);
      
      this.areaService.deleteArea(areaId).subscribe({
        next: (response) => {
          this.loadAreas();
        },
        error: (error) => {
          console.error('Error al eliminar área:', error);
          this.errorMessage = 'No se pudo eliminar el área. Por favor, intente nuevamente.';
        }
      });
    }
  }

  toggleAreaStatus(area: Area): void {
    // Obtener el ID del área, considerando si el _id viene directamente o dentro de un objeto
    const areaId = this.getEntityId(area);
    
    const updatedArea: Partial<Area> = {
      active: !area.active
    };
    
    this.areaService.updateArea(areaId, updatedArea).subscribe({
      next: (response) => {
        this.loadAreas();
      },
      error: (error) => {
        console.error('Error al cambiar estado del área:', error);
        this.errorMessage = 'No se pudo cambiar el estado del área. Por favor, intente nuevamente.';
      }
    });
  }

  // Método auxiliar para obtener el ID de una entidad
  private getEntityId(entity: any): string {
    if (!entity) return '';
    
    // Si la entidad tiene un id o _id, usarlo directamente
    if (entity.id) return entity.id;
    if (entity._id) return entity._id;
    
    return '';
  }

  assignResponsible(area: Area): void {
    this.editArea(area);
  }

  viewSubareas(area: Area): void {
    const areaId = this.getEntityId(area);
    this.router.navigate(['/organization/subareas'], { queryParams: { areaId } });
  }

  // Método para cargar y actualizar el conteo de subáreas
  loadSubareaCounts(): void {
    // Para cada área, obtenemos sus subáreas
    this.areas.forEach(area => {
      const areaId = this.getEntityId(area);
      if (!areaId) return;
      
      this.areaService.getSubareas(areaId).subscribe({
        next: (response) => {
          if (response && response.data) {
            // Encontrar el área correspondiente y actualizar su contador de subáreas
            const areaIndex = this.areas.findIndex(a => this.getEntityId(a) === areaId);
            if (areaIndex !== -1) {
              this.areas[areaIndex].subareaCount = response.data.length;
            }
          }
        },
        error: (error) => {
          console.error(`Error al obtener subáreas para el área ${areaId}:`, error);
        }
      });
    });
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  // Método para cambiar la empresa seleccionada y recargar las áreas
  onCompanyChange(companyId: string): void {
    this.selectedCompanyId = companyId;
    this.loadAreas();
  }
} 