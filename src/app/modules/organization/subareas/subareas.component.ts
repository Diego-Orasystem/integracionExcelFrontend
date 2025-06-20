import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SubareaService } from '../../../core/services/subarea.service';
import { AreaService } from '../../../core/services/area.service';
import { UserService } from '../../../core/services/user.service';
import { Subarea } from '../../../core/models/subarea.model';
import { Area } from '../../../core/models/area.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-subareas',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  template: `
    <div class="subareas-container">
      <div class="header-actions">
        <div class="header-title">
          <h1>{{ 'ORGANIZATION.SUBAREAS.TITLE' | translate }}</h1>
          <span *ngIf="selectedArea" class="area-badge">
            {{ 'ORGANIZATION.SUBAREAS.AREA_FILTER' | translate }}: {{ selectedArea?.name }}
            <button class="btn-clear-filter" (click)="clearAreaFilter()">
              <i class="fas fa-times"></i>
            </button>
          </span>
        </div>
        <button class="btn-add-subarea" (click)="showSubareaForm()">
          <i class="fas fa-plus"></i> {{ 'ORGANIZATION.SUBAREAS.ADD_SUBAREA' | translate }}
        </button>
      </div>
      <p>{{ 'ORGANIZATION.SUBAREAS.DESCRIPTION' | translate }}</p>
      
      <div class="loading" *ngIf="loading">
        <p>{{ 'ORGANIZATION.SUBAREAS.LOADING' | translate }}</p>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn-retry" (click)="loadSubareas()">{{ 'ORGANIZATION.SUBAREAS.RETRY' | translate }}</button>
      </div>
      
      <!-- Formulario para crear/editar subárea -->
      <div class="entity-form" *ngIf="isFormVisible">
        <div class="form-header">
          <h2>{{ editingSubarea ? ('ORGANIZATION.SUBAREAS.EDIT_SUBAREA' | translate) : ('ORGANIZATION.SUBAREAS.CREATE_SUBAREA' | translate) }}</h2>
          <button class="btn-close" (click)="cancelForm()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form [formGroup]="subareaForm" (ngSubmit)="saveSubarea()">
          <div class="form-group">
            <label for="name">{{ 'ORGANIZATION.SUBAREAS.NAME' | translate }}</label>
            <input type="text" id="name" formControlName="name" placeholder="{{ 'ORGANIZATION.SUBAREAS.NAME' | translate }}">
            <div class="validation-error" *ngIf="subareaForm.get('name')?.invalid && subareaForm.get('name')?.touched">
              {{ 'ORGANIZATION.SUBAREAS.NAME_REQUIRED' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">{{ 'ORGANIZATION.SUBAREAS.DESCRIPTION' | translate }}</label>
            <textarea id="description" formControlName="description" placeholder="{{ 'ORGANIZATION.SUBAREAS.DESCRIPTION' | translate }}"></textarea>
          </div>
          
          <div class="form-group">
            <label for="areaId">{{ 'ORGANIZATION.SUBAREAS.AREA' | translate }}</label>
            <select id="areaId" formControlName="areaId">
              <option value="">{{ 'ORGANIZATION.SUBAREAS.SELECT_AREA' | translate }}</option>
              <option *ngFor="let area of areas" [value]="area._id || area.id">
                {{ area.name }}
              </option>
            </select>
            <div class="validation-error" *ngIf="subareaForm.get('areaId')?.invalid && subareaForm.get('areaId')?.touched">
              {{ 'ORGANIZATION.SUBAREAS.AREA_REQUIRED' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="responsibleUserId">{{ 'ORGANIZATION.SUBAREAS.RESPONSIBLE' | translate }}</label>
            <select id="responsibleUserId" formControlName="responsibleUserId">
              <option value="">{{ 'ORGANIZATION.SUBAREAS.NO_RESPONSIBLE' | translate }}</option>
              <option *ngFor="let user of users" [value]="user._id || user.id">
                {{ user.firstName && user.lastName ? (user.firstName + ' ' + user.lastName) : 
                   user.name || 'Usuario sin nombre' }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="expectedFiles">{{ 'ORGANIZATION.SUBAREAS.EXPECTED_FILES' | translate }}</label>
            <input type="number" id="expectedFiles" formControlName="expectedFiles" placeholder="{{ 'ORGANIZATION.SUBAREAS.EXPECTED_FILES' | translate }}" min="0">
            <div class="validation-error" *ngIf="subareaForm.get('expectedFiles')?.invalid && subareaForm.get('expectedFiles')?.touched">
              {{ 'ORGANIZATION.SUBAREAS.EXPECTED_FILES_ERROR' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="defaultFileName">{{ 'ORGANIZATION.SUBAREAS.DEFAULT_FILENAME' | translate }}</label>
            <input type="text" id="defaultFileName" formControlName="defaultFileName" placeholder="{{ 'ORGANIZATION.SUBAREAS.DEFAULT_FILENAME_PLACEHOLDER' | translate }}">
            <small class="form-text text-muted">
              {{ 'ORGANIZATION.SUBAREAS.DEFAULT_FILENAME_HELP' | translate }}
            </small>
          </div>
          
          <div class="form-check mb-3">
            <input type="checkbox" id="isDefaultFileRequired" formControlName="isDefaultFileRequired" class="form-check-input">
            <label class="form-check-label" for="isDefaultFileRequired">
              {{ 'ORGANIZATION.SUBAREAS.DEFAULT_FILENAME_REQUIRED' | translate }}
            </label>
          </div>
          
          <div class="form-check">
            <input type="checkbox" id="active" formControlName="active">
            <label for="active">{{ 'ORGANIZATION.SUBAREAS.ACTIVE' | translate }}</label>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelForm()">{{ 'ORGANIZATION.SUBAREAS.CANCEL' | translate }}</button>
            <button type="submit" class="btn-save" [disabled]="subareaForm.invalid">{{ 'ORGANIZATION.SUBAREAS.SAVE' | translate }}</button>
          </div>
        </form>
      </div>
      
      <!-- Lista de subáreas -->
      <div class="entities-list" *ngIf="!loading && !errorMessage && !isFormVisible">
        <div class="empty-state" *ngIf="subareas.length === 0">
          <p>{{ 'ORGANIZATION.SUBAREAS.NO_SUBAREAS' | translate }}</p>
        </div>
        
        <table *ngIf="subareas.length > 0" class="entities-table">
          <thead>
            <tr>
              <th>{{ 'ORGANIZATION.SUBAREAS.NAME' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.DESCRIPTION' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.AREA_COLUMN' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.RESPONSIBLE_COLUMN' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.FILES_COUNT' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.STATUS' | translate }}</th>
              <th>{{ 'ORGANIZATION.SUBAREAS.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let subarea of subareas">
              <td>{{ subarea.name }}</td>
              <td>{{ subarea.description || '-' }}</td>
              <td>{{ subarea.areaName || '-' }}</td>
              <td>{{ subarea.responsibleUserName || ('ORGANIZATION.SUBAREAS.UNASSIGNED' | translate) }}</td>
              <td>
                <span class="count-badge" [ngClass]="{'count-complete': (subarea.fileCount || 0) >= (subarea.expectedFiles || 0), 'count-incomplete': (subarea.fileCount || 0) < (subarea.expectedFiles || 0)}">
                  {{ subarea.fileCount || 0 }} / {{ subarea.expectedFiles || 0 }}
                </span>
              </td>
              <td>
                <span class="status" [ngClass]="{'active': subarea.active, 'inactive': !subarea.active}">
                  {{ subarea.active ? ('ORGANIZATION.SUBAREAS.ACTIVE_STATUS' | translate) : ('ORGANIZATION.SUBAREAS.INACTIVE' | translate) }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" (click)="editSubarea(subarea)" *ngIf="canEdit" title="{{ 'ORGANIZATION.SUBAREAS.EDIT' | translate }}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-assign" (click)="assignResponsible(subarea)" *ngIf="canEdit" title="{{ 'ORGANIZATION.SUBAREAS.ASSIGN' | translate }}">
                  <i class="fas fa-user-check"></i>
                </button>
                <button class="btn-toggle" (click)="toggleSubareaStatus(subarea)" *ngIf="canEdit" title="{{ 'ORGANIZATION.SUBAREAS.TOGGLE_STATUS' | translate }}">
                  <i class="fas" [ngClass]="subarea.active ? 'fa-ban' : 'fa-check'"></i>
                </button>
                <button class="btn-delete" (click)="deleteSubarea(subarea)" *ngIf="canDelete" title="{{ 'ORGANIZATION.SUBAREAS.DELETE' | translate }}">
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
    .subareas-container {
      padding: 20px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .area-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .btn-clear-filter {
      background: none;
      border: none;
      color: #1976d2;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px;
    }
    .btn-add-subarea {
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
    .btn-add-subarea:hover {
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
    .btn-edit, .btn-toggle, .btn-assign, .btn-delete {
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
    }
    .count-complete {
      background-color: #e6f7e6;
      color: #2e7d32;
    }
    .count-incomplete {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class SubareasComponent implements OnInit {
  subareas: Subarea[] = [];
  areas: Area[] = [];
  users: User[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  isFormVisible: boolean = false;
  subareaForm: FormGroup;
  editingSubarea: Subarea | null = null;
  selectedArea: Area | null = null;
  selectedAreaId: string = '';
  isAdmin: boolean = false;
  canCreate: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  currentUserCompanyId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private subareaService: SubareaService,
    private areaService: AreaService,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.subareaForm = this.createSubareaForm();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadAreas();
    this.loadUsers();
    
    // Verificar si hay un área seleccionada desde la URL
    this.route.queryParams.subscribe(params => {
      console.log('Parámetros de URL recibidos:', params);
      
      if (params['areaId']) {
        this.selectedAreaId = params['areaId'];
        console.log(`Área seleccionada de la URL: ${this.selectedAreaId}`);
        
        // Primero cargar los detalles del área y después las subáreas
        this.loadAreaDetails(this.selectedAreaId);
      } else {
        console.log('No hay área seleccionada en la URL, cargando todas las subáreas');
        // Si no hay área seleccionada, cargar todas las subáreas
        this.loadSubareas();
      }
    });
  }

  checkPermissions(): void {
    const currentUser = this.authService.currentUser;
    this.isAdmin = this.authService.hasPermission('admin');
    this.canCreate = this.authService.hasPermission('subarea_create');
    this.canEdit = this.authService.hasPermission('subarea_edit');
    this.canDelete = this.authService.hasPermission('subarea_delete');
    
    if (currentUser?.companyId) {
      this.currentUserCompanyId = currentUser.companyId;
    }
  }

  createSubareaForm(subarea?: Subarea): FormGroup {
    return this.fb.group({
      name: [subarea?.name || '', [Validators.required]],
      description: [subarea?.description || ''],
      areaId: [subarea?.areaId || this.selectedAreaId, [Validators.required]],
      responsibleUserId: [subarea?.responsibleUserId || ''],
      expectedFiles: [subarea?.expectedFiles || 0, [Validators.min(0)]],
      defaultFileName: [subarea?.defaultFileName || ''],
      isDefaultFileRequired: [subarea?.isDefaultFileRequired || false],
      active: [subarea?.active !== undefined ? subarea.active : true]
    });
  }

  loadAreaDetails(areaId: string): void {
    this.loading = true;
    this.errorMessage = '';
    
    console.log(`Cargando detalles del área con ID: ${areaId}`);
    
    this.areaService.getArea(areaId).subscribe({
      next: (response) => {
        console.log('Respuesta de getArea:', response);
        
        if (response && response.data) {
          this.selectedArea = response.data;
          console.log('Área cargada correctamente:', this.selectedArea);
          
          // Cargar las subáreas una vez que tenemos los detalles del área
          this.loadSubareas();
        } else {
          console.error('No se encontraron datos del área en la respuesta:', response);
          this.errorMessage = 'No se encontró información del área seleccionada.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar detalles del área:', error);
        this.errorMessage = 'Error al cargar información del área. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  loadSubareas(): void {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('Cargando subáreas con areaId:', this.selectedAreaId);
    
    // Si hay un área seleccionada, usar el servicio de área para obtener sus subáreas
    if (this.selectedAreaId) {
      console.log(`Usando servicio de área para cargar subáreas del área: ${this.selectedAreaId}`);
      
      this.areaService.getSubareas(this.selectedAreaId).subscribe({
        next: (response) => {
          console.log('Respuesta de getSubareas usando AreaService:', response);
          
          if (response && response.data) {
            // Procesar los datos para asegurar que se muestren correctamente
            this.subareas = response.data.map((subarea: any) => {
              // Procesar el nombre del responsable si viene como objeto
              let responsibleUserName = 'Sin asignar';
              if (subarea.responsibleUserId) {
                if (typeof subarea.responsibleUserId === 'object') {
                  const user = subarea.responsibleUserId;
                  if (user.firstName && user.lastName) {
                    responsibleUserName = `${user.firstName} ${user.lastName}`;
                  } else if (user.name) {
                    responsibleUserName = user.name;
                  }
                } else if (subarea.responsibleUserName) {
                  responsibleUserName = subarea.responsibleUserName;
                }
              }
              
              // El área es la seleccionada
              const areaName = this.selectedArea ? this.selectedArea.name : '-';
              
              return {
                ...subarea,
                responsibleUserName,
                areaName
              };
            });
          } else {
            console.warn('La respuesta no contiene datos de subáreas:', response);
            this.subareas = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar subáreas usando AreaService:', error);
          this.errorMessage = 'No se pudieron cargar las subáreas. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
    } else {
      // Si no hay área seleccionada, usar el servicio de subárea para obtener todas las subáreas
      console.log('Usando servicio de subárea para cargar todas las subáreas');
      
      this.subareaService.getSubareas().subscribe({
        next: (response) => {
          console.log('Respuesta de getSubareas usando SubareaService:', response);
          
          if (response && response.data) {
            // Procesar los datos para asegurar que se muestren correctamente
            this.subareas = response.data.map((subarea: any) => {
              // Procesar el nombre del responsable si viene como objeto
              let responsibleUserName = 'Sin asignar';
              if (subarea.responsibleUserId) {
                if (typeof subarea.responsibleUserId === 'object') {
                  const user = subarea.responsibleUserId;
                  if (user.firstName && user.lastName) {
                    responsibleUserName = `${user.firstName} ${user.lastName}`;
                  } else if (user.name) {
                    responsibleUserName = user.name;
                  }
                } else if (subarea.responsibleUserName) {
                  responsibleUserName = subarea.responsibleUserName;
                }
              }
              
              // Procesar el nombre del área si viene como objeto
              let areaName = '-';
              if (subarea.areaId) {
                if (typeof subarea.areaId === 'object') {
                  areaName = subarea.areaId.name || '-';
                } else if (subarea.areaName) {
                  areaName = subarea.areaName;
                }
              }
              
              return {
                ...subarea,
                responsibleUserName,
                areaName
              };
            });
          } else {
            console.warn('La respuesta no contiene datos de subáreas:', response);
            this.subareas = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar subáreas usando SubareaService:', error);
          this.errorMessage = 'No se pudieron cargar las subáreas. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
    }
  }

  loadAreas(): void {
    // Si no es admin, filtrar por la compañía del usuario
    const companyId = !this.isAdmin ? this.currentUserCompanyId : undefined;
    
    this.areaService.getAreas(companyId).subscribe({
      next: (response) => {
        this.areas = response.data;
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
      }
    });
  }

  loadUsers(): void {
    // Si no es admin, filtrar usuarios por la compañía del usuario actual
    const companyId = !this.isAdmin ? this.currentUserCompanyId : undefined;
    
    this.userService.getUsers(companyId).subscribe({
      next: (response) => {
        this.users = response.data;
        console.log('Usuarios cargados:', this.users);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  showSubareaForm(): void {
    this.isFormVisible = true;
    this.editingSubarea = null;
    this.subareaForm = this.createSubareaForm();
  }

  cancelForm(): void {
    this.isFormVisible = false;
    this.editingSubarea = null;
  }

  editSubarea(subarea: Subarea): void {
    try {
      // Crear una copia del área para la edición
      const subareaCopy = { ...subarea };
      
      // Extraer el ID del responsable si viene como objeto
      if (subareaCopy.responsibleUserId && typeof subareaCopy.responsibleUserId === 'object') {
        subareaCopy.responsibleUserId = (subareaCopy.responsibleUserId as any)._id || '';
      }
      
      // Extraer el ID del área si viene como objeto
      if (subareaCopy.areaId && typeof subareaCopy.areaId === 'object') {
        subareaCopy.areaId = (subareaCopy.areaId as any)._id || '';
      }
      
      console.log('Subárea para editar:', subareaCopy);
      
      this.editingSubarea = subareaCopy;
      this.subareaForm = this.createSubareaForm(subareaCopy);
      this.isFormVisible = true;
    } catch (error) {
      console.error('Error al preparar subárea para edición:', error);
      this.errorMessage = 'Error al preparar la subárea para edición. Por favor, intente nuevamente.';
    }
  }

  saveSubarea(): void {
    if (this.subareaForm.invalid) return;
    
    const subareaData: Partial<Subarea> = {
      ...this.subareaForm.value
    };
    
    if (this.editingSubarea) {
      // Actualizar subárea existente
      const subareaId = this.editingSubarea.id || this.editingSubarea._id || '';
      this.subareaService.updateSubarea(subareaId, subareaData).subscribe({
        next: (response) => {
          console.log('Subárea actualizada correctamente:', response);
          this.loadSubareas();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al actualizar subárea:', error);
          this.errorMessage = 'No se pudo actualizar la subárea. Por favor, intente nuevamente.';
        }
      });
    } else {
      // Crear nueva subárea
      this.subareaService.createSubarea(subareaData).subscribe({
        next: (response) => {
          console.log('Subárea creada correctamente:', response);
          this.loadSubareas();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error al crear subárea:', error);
          this.errorMessage = 'No se pudo crear la subárea. Por favor, intente nuevamente.';
        }
      });
    }
  }

  deleteSubarea(subarea: Subarea): void {
    if (confirm(`¿Está seguro de eliminar la subárea "${subarea.name}"? Esta acción puede afectar a los archivos asociados.`)) {
      const subareaId = subarea.id || subarea._id || '';
      this.subareaService.deleteSubarea(subareaId).subscribe({
        next: (response) => {
          this.loadSubareas();
        },
        error: (error) => {
          console.error('Error al eliminar subárea:', error);
          this.errorMessage = 'No se pudo eliminar la subárea. Por favor, intente nuevamente.';
        }
      });
    }
  }

  toggleSubareaStatus(subarea: Subarea): void {
    const subareaId = subarea.id || subarea._id || '';
    const updatedSubarea: Partial<Subarea> = {
      active: !subarea.active
    };
    
    this.subareaService.updateSubarea(subareaId, updatedSubarea).subscribe({
      next: (response) => {
        this.loadSubareas();
      },
      error: (error) => {
        console.error('Error al cambiar estado de la subárea:', error);
        this.errorMessage = 'No se pudo cambiar el estado de la subárea. Por favor, intente nuevamente.';
      }
    });
  }

  assignResponsible(subarea: Subarea): void {
    this.editSubarea(subarea);
  }

  clearAreaFilter(): void {
    this.selectedAreaId = '';
    this.selectedArea = null;
    this.loadSubareas();
    this.router.navigate(['/organization/subareas']);
  }

  clearErrorMessage(): void {
    this.errorMessage = '';
  }
} 