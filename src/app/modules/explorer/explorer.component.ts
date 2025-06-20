import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { FolderService } from '../../core/services/folder.service';
import { CompanyService } from '../../core/services/company.service';
import { AuthService } from '../../core/services/auth.service';
import { FileUploadService } from '../../core/services/file-upload.service';
import { Company } from '../../core/models/company.model';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Folder, FolderContentResponse } from '../../core/models/folder.model';
import { TranslateModule } from '@ngx-translate/core';
import { FileVersionsComponent } from '../../shared/components/files/file-versions/file-versions.component';
import { TranslateService } from '@ngx-translate/core';

interface FileItem {
  _id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  extension: string;
  createdAt: string;
  url?: string;
  path?: string;
  isFolder?: false;
}

interface Breadcrumb {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    HasPermissionDirective,
    TranslateModule,
    FileVersionsComponent
  ],
  template: `
    <div class="explorer-container">
      <h1>{{ 'EXPLORER.TITLE' | translate }}</h1>
      <p>{{ 'EXPLORER.DESCRIPTION' | translate }}</p>
      
      <!-- Selector de empresa para administradores globales -->
      <div class="company-filter" *ngIf="authService.currentUser?.role === 'admin'">
        <label for="companySelect">{{ 'EXPLORER.SELECT_COMPANY' | translate }}:</label>
        <select 
          id="companySelect" 
          [ngModel]="selectedCompanyId" 
          (ngModelChange)="onCompanyChange($event)"
          class="company-select"
        >
          <option value="">-- {{ 'EXPLORER.SELECT_COMPANY_OPTION' | translate }} --</option>
          <option *ngFor="let company of companies" [value]="company._id">
            {{ company.name }}
          </option>
        </select>
      </div>
      
      <!-- Mensaje cuando no hay empresa seleccionada (solo para admin global) -->
      <div class="empty-state" *ngIf="authService.currentUser?.role === 'admin' && !selectedCompanyId">
        <div class="message-box">
          <i class="fas fa-building"></i>
          <p>{{ 'EXPLORER.SELECT_COMPANY_PROMPT' | translate }}</p>
        </div>
      </div>
      
      <!-- Breadcrumbs de navegación -->
      <div class="breadcrumbs" *ngIf="selectedCompanyId || authService.currentUser?.role === 'company_admin' || authService.currentUser?.role === 'user_responsible'">
        <span class="breadcrumb-item" (click)="navigateToRoot()">{{ 'EXPLORER.HOME' | translate }}</span>
        <ng-container *ngFor="let crumb of breadcrumbs; let i = index">
          <span class="breadcrumb-separator">></span>
          <span class="breadcrumb-item" (click)="navigateToFolder(crumb._id)">{{ crumb.name }}</span>
        </ng-container>
      </div>
      
      <div class="action-bar" *ngIf="selectedCompanyId || authService.currentUser?.role === 'company_admin' || authService.currentUser?.role === 'user_responsible'">
        <div class="left-actions">
          <!-- Botón de subir archivos - disponible para todos los usuarios con permiso -->
          <button 
            class="upload-btn" 
            (click)="openUploadDialog()" 
            [disabled]="!currentFolderId"
            *ngIf="authService.hasPermission('file_write')"
          >
            <i class="fas fa-upload"></i> {{ 'EXPLORER.UPLOAD_FILE' | translate }}
          </button>
          
          <!-- Botón de crear carpeta - solo para usuarios con permiso -->
          <button 
            class="create-folder-btn" 
            (click)="showCreateFolderDialog = true" 
            *ngIf="authService.hasPermission('folder_create')"
          >
            <i class="fas fa-folder-plus"></i> {{ 'EXPLORER.NEW_FOLDER' | translate }}
          </button>
        </div>
        
        <!-- Botón de gestionar carpetas - solo para administradores -->
        <a 
          routerLink="/explorer/folders" 
          class="manage-folders-btn" 
          *ngIf="authService.currentUser?.role === 'admin' || authService.currentUser?.role === 'company_admin'"
        >
          <i class="fas fa-cog"></i> {{ 'EXPLORER.MANAGE_FOLDERS' | translate }}
        </a>
      </div>
      
      <!-- Diálogo para crear carpeta -->
      <div *ngIf="showCreateFolderDialog && authService.hasPermission('folder_create')" class="dialog-overlay">
        <div class="dialog-content">
          <h3>{{ 'EXPLORER.CREATE_FOLDER' | translate }}</h3>
          <form [formGroup]="folderCreateForm" (ngSubmit)="createFolder()">
            <div class="form-group">
              <label for="folderName">{{ 'EXPLORER.FOLDER_NAME' | translate }}:</label>
              <input type="text" id="folderName" formControlName="name" placeholder="{{ 'EXPLORER.FOLDER_NAME_PLACEHOLDER' | translate }}">
              <div class="validation-error" *ngIf="folderCreateForm.get('name')?.invalid && folderCreateForm.get('name')?.touched">
                {{ 'EXPLORER.FOLDER_NAME_REQUIRED' | translate }}
              </div>
            </div>
            
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="showCreateFolderDialog = false">{{ 'GLOBAL.CANCEL' | translate }}</button>
              <button type="submit" class="btn-primary" [disabled]="folderCreateForm.invalid || creatingFolder">
                {{ creatingFolder ? ('EXPLORER.CREATING' | translate) : ('EXPLORER.CREATE' | translate) }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Diálogo para subir archivo -->
      <div *ngIf="showUploadDialog" class="dialog-overlay">
        <div class="dialog-content">
          <h3>{{ 'EXPLORER.UPLOAD_EXCEL' | translate }}</h3>
          <form [formGroup]="uploadForm">
            <div class="form-group">
              <label for="file">{{ 'EXPLORER.FILE' | translate }}:</label>
              <input type="file" id="file" (change)="onFileSelected($event)" accept=".xlsx,.xls,.ods">
            </div>
            <div class="form-group" *ngIf="selectedFile">
              <label for="customName">{{ 'EXPLORER.CUSTOM_FILENAME' | translate }}:</label>
              <input type="text" id="customName" formControlName="customName" placeholder="{{ selectedFile?.name }}">
            </div>
            <div class="form-group">
              <label for="description">{{ 'EXPLORER.DESCRIPTION' | translate }}:</label>
              <textarea id="description" formControlName="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label for="tags">{{ 'EXPLORER.TAGS' | translate }}:</label>
              <input type="text" id="tags" formControlName="tags">
            </div>
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="showUploadDialog = false">{{ 'GLOBAL.CANCEL' | translate }}</button>
              <button 
                type="button" 
                class="btn-primary" 
                (click)="uploadFile()" 
                [disabled]="!selectedFile || uploading || !authService.hasPermission('file_write')"
              >
                <i class="fas fa-upload"></i> {{ uploading ? ('EXPLORER.UPLOADING' | translate) : ('EXPLORER.UPLOAD' | translate) }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="explorer-content">
        <div class="loading" *ngIf="loading">
          <p>{{ 'GLOBAL.LOADING_DATA' | translate }}</p>
        </div>
        
        <div class="empty-state" *ngIf="!loading && folders.length === 0 && files.length === 0">
          <p>{{ 'EXPLORER.NO_FILES' | translate }}</p>
        </div>
        
        <div *ngIf="!loading" class="explorer-items">
          <!-- Carpetas -->
          <div *ngFor="let folder of folders" class="item folder" (click)="navigateToFolder(folder._id)" [id]="'folder-' + folder._id">
            <div class="item-icon">
              <i class="fas fa-folder"></i>
            </div>
            <div class="item-details">
              <div class="item-name">{{ folder.name }}</div>
              <div class="item-meta">{{ 'EXPLORER.FOLDER' | translate }}{{ folder.itemCount ? ' | ' + folder.itemCount + ' ' + ('EXPLORER.ELEMENTS' | translate) : '' }}</div>
            </div>
          </div>
          
          <!-- Archivos -->
          <div *ngFor="let file of files" class="item file">
            <div class="item-icon" [ngClass]="file.extension">
              <i class="fas fa-file-excel"></i>
            </div>
            <div class="item-details">
              <div class="item-name">{{ file.originalName || file.name }}</div>
              <div class="item-meta">{{ formatFileSize(file.size || 0) }} | {{ formatDate(file.createdAt) }}</div>
            </div>
            <div class="item-actions">
              <button class="btn-action" (click)="downloadFile(file._id, $event)" title="{{ 'EXPLORER.DOWNLOAD' | translate }}">
                <i class="fas fa-download"></i>
              </button>
              <button class="btn-action" (click)="showVersions(file._id, $event)" title="{{ 'VERSION.HISTORY' | translate }}">
                <i class="fas fa-history"></i>
              </button>
              <button 
                *ngIf="authService.hasPermission('file_delete')" 
                class="btn-action delete" 
                (click)="confirmDelete(file)" 
                title="{{ 'EXPLORER.DELETE' | translate }}"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="showDeleteConfirm" class="dialog-overlay">
        <div class="dialog-content">
          <h3>{{ 'EXPLORER.CONFIRM_DELETE' | translate }}</h3>
          <p>{{ 'EXPLORER.DELETE_CONFIRMATION' | translate }} "{{ fileToDelete?.originalName }}"?</p>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="showDeleteConfirm = false">{{ 'GLOBAL.CANCEL' | translate }}</button>
            <button class="btn-danger" (click)="deleteFile()">{{ 'GLOBAL.DELETE' | translate }}</button>
          </div>
        </div>
      </div>

      <div *ngIf="showVersionDialog && selectedFileId" class="dialog-overlay">
        <div class="dialog-content versions-dialog">
          <div class="dialog-header">
            <h3>{{ 'VERSION.HISTORY_TITLE' | translate }}</h3>
            <button class="close-btn" (click)="showVersionDialog = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <app-file-versions 
            [fileId]="selectedFileId" 
            (versionsUpdated)="refreshFileList()">
          </app-file-versions>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit {
  loading = false;
  folders: Folder[] = [];
  files: FileItem[] = [];
  currentFolderId: string = '';
  breadcrumbs: Breadcrumb[] = [];
  
  // Propiedades para filtrado por empresa
  companies: Company[] = [];
  selectedCompanyId: string = '';
  isAdmin: boolean = false;
  
  // Formularios
  uploadForm: FormGroup;
  folderCreateForm: FormGroup;
  
  // Estados de UI
  showUploadDialog = false;
  showCreateFolderDialog = false;
  showDeleteConfirm = false;
  showVersionDialog = false;
  
  // Estados de operaciones
  selectedFile: globalThis.File | null = null;
  uploading = false;
  creatingFolder = false;
  fileToDelete: FileItem | null = null;
  selectedFileId: string = '';
  
  // Debug
  environment = environment;
  
  // Propiedad para determinar si estamos en modo de gestión de carpetas
  isManagementMode = false;

  constructor(
    private apiService: ApiService,
    private folderService: FolderService,
    private companyService: CompanyService,
    public authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService,
    private fileUploadService: FileUploadService
  ) {
    this.uploadForm = this.fb.group({
      description: [''],
      tags: [''],
      customName: ['']
    });
    
    this.folderCreateForm = this.fb.group({
      name: ['', []]
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo de gestión de carpetas basado en la ruta actual
    this.isManagementMode = this.router.url.includes('/explorer/folders');
    console.log('Modo gestión:', this.isManagementMode);
    
    // Obtener información del usuario actual
    const currentUser = this.authService.currentUser;
    console.log('Usuario actual:', currentUser?.name, 'Rol:', currentUser?.role, 'CompanyId:', currentUser?.companyId);
    
    // Verificar tipo de usuario
    const isGlobalAdmin = currentUser?.role === 'admin';
    const isCompanyAdmin = currentUser?.role === 'company_admin';
    const isResponsible = currentUser?.role === 'user_responsible';
    const isControlUser = currentUser?.role === 'user_control';
    this.isAdmin = isGlobalAdmin || isCompanyAdmin;
    
    console.log('TIPO DE USUARIO:');
    console.log('- Administrador:', this.isAdmin, 'Global:', isGlobalAdmin, 'Compañía:', isCompanyAdmin);
    console.log('- Responsable:', isResponsible);
    console.log('- Control:', isControlUser);
    console.log('PERMISOS:');
    console.log('- Permiso folder_read:', this.authService.hasPermission('folder_read'));
    console.log('- Permiso folder_list:', this.authService.hasPermission('folder_list'));
    
    // Escuchar cambios en los parámetros de URL
    this.route.queryParams.subscribe(params => {
      console.log('Parámetros de URL recibidos:', params);
      
      // Si hay un parámetro de carpeta en la URL, guardar ese ID
      const folderIdFromUrl = params['folder'];
      if (folderIdFromUrl) {
        console.log('Detectado ID de carpeta en URL:', folderIdFromUrl);
        this.currentFolderId = folderIdFromUrl;
      }
    });
    
    // INICIALIZACIÓN SEGÚN TIPO DE USUARIO
    
    // Para todos los usuarios con compañía asignada, asegurarnos de establecer la compañía
    if (currentUser?.companyId) {
      console.log('Usuario con compañía asignada:', currentUser.companyId);
      this.selectedCompanyId = currentUser.companyId;
    }
    
    // Si es admin global y no estamos en modo gestión, necesita seleccionar empresa
    if (isGlobalAdmin && !this.isManagementMode) {
      this.loadCompanies();
    } 
    // Si tenemos ID de carpeta en la URL, navegar directamente a esa carpeta
    else if (this.currentFolderId) {
      console.log('Navegando a carpeta desde URL:', this.currentFolderId);
      this.navigateToFolder(this.currentFolderId);
    }
    // Si el usuario tiene compañía asignada, cargar carpetas raíz
    else if (this.selectedCompanyId) {
      console.log('Cargando carpetas raíz de la empresa:', this.selectedCompanyId);
      this.loadRootFolders();
    }
    // Otros casos (fallback)
    else {
      console.log('Cargando contenido general (fallback)');
      this.loadFolderContent();
    }
  }
  
  // Método dedicado a cargar carpetas de la raíz
  loadRootFolders() {
    console.log('Cargando carpetas raíz para compañía:', this.selectedCompanyId);
    this.loading = true;
    
    const params = {
      companyId: this.selectedCompanyId,
      root: true
    };
    
    // Llamada directa a la API para obtener carpetas raíz
    this.apiService.get('/folders', params).subscribe({
      next: (response: any) => {
        console.log('RESPUESTA DE CARPETAS RAÍZ:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          // Filtrar carpetas por permisos de acceso
          const filteredFolders = response.data.filter((folder: any) => 
            this.authService.canAccessFolder(folder)
          );
          
          this.folders = filteredFolders;
          console.log('Carpetas raíz cargadas y filtradas:', this.folders.length, 'de', response.data.length);
          
          // Si no hay carpetas, intentar cargar carpetas asignadas específicamente al usuario
          if (this.folders.length === 0 && this.authService.currentUser?.role === 'user_responsible') {
            console.log('No se encontraron carpetas con filtro de permisos. Intentando cargar carpetas asignadas al usuario responsable.');
            this.loadUserResponsibleFolders(this.authService.currentUser?.id, this.selectedCompanyId);
          }
        } else {
          console.warn('Formato de respuesta no esperado:', response);
          this.folders = [];
        }
        
        // También cargar los archivos de la carpeta raíz
        this.loadFiles();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carpetas raíz:', error);
        this.loading = false;
        
        // En caso de error, intentar el método alternativo
        if (this.authService.currentUser?.role === 'user_responsible') {
          this.loadUserResponsibleFolders(this.authService.currentUser?.id, this.selectedCompanyId);
        }
      }
    });
  }

  loadFolderContent(folderId?: string) {
    this.loading = true;
      this.folders = [];
      this.files = [];
    
    // Guardar el folderId actual
    this.currentFolderId = folderId || '';
    
    // Si no hay companyId seleccionada y el usuario no es admin de compañía, no cargar nada
    const companyId = this.selectedCompanyId || 
      (this.authService.currentUser?.role === 'company_admin' ? this.authService.currentUser?.companyId : '');
    
    if (!companyId && this.authService.currentUser?.role !== 'admin') {
      this.loading = false;
      return;
    }
    
    // Manejo especial para usuarios responsables en la raíz
    if (!folderId && this.authService.currentUser?.role === 'user_responsible') {
      console.log('Usuario responsable en raíz - cargando contenido específico');
      
      // Si el usuario tiene un área asignada, cargar carpetas de esa área
      if ((this.authService.currentUser as any).areaId) {
        this.loadResponsibleAreaFolders(
          (this.authService.currentUser as any).areaId, 
          this.authService.currentUser?.companyId
        );
        return;
      }
      
      // Cargar también carpetas donde el usuario es responsable
      this.loadUserResponsibleFolders(this.authService.currentUser?.id, companyId);
      return;
    }
    
    const params: any = { 
      companyId: companyId || undefined
    };
    
    if (folderId) {
      params.parentId = folderId;
        } else {
      params.root = true;
    }
    
    console.log('Solicitando contenido de carpeta con parámetros:', params);
    
    this.folderService.getFolderContents(params).subscribe({
      next: (response) => {
        console.log('RESPUESTA DE API - CONTENIDO DE CARPETA:', response);
        this.processResponseContent(response, folderId);
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CONTENIDO DE CARPETA:', error);
        this.loading = false;
      }
    });
  }
  
  loadFolderPath(folderId: string) {
    this.folderService.getFolderPath(folderId).subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.breadcrumbs = response.data;
        } else {
          console.warn('Formato de respuesta inesperado para la ruta de carpetas:', response);
          this.breadcrumbs = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar ruta de carpeta:', error);
        this.breadcrumbs = [];
      }
    });
  }

  loadFiles() {
    let endpoint = '/files';
    let params: any = {};
    
    if (this.currentFolderId) {
      params.folderId = this.currentFolderId;
    }
    
    // Añadir parámetro management si estamos en modo gestión
    if (this.isManagementMode && this.isAdmin) {
      params.management = true;
    } 
    // Si es admin y hay una empresa seleccionada, filtrar por empresa (solo en modo no gestión)
    else if (this.isAdmin && this.selectedCompanyId && !this.isManagementMode) {
      params.companyId = this.selectedCompanyId;
    }
    
    console.log('Parámetros de búsqueda de archivos:', params);
    
    this.apiService.get(endpoint, params).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          // Verificar si los elementos son carpetas o archivos
          const processedItems = response.data.map((item: any) => {
            // Crear un objeto base con propiedades comunes
            const processedItem: any = {
              _id: item._id || '',
              name: item.name || item.originalName || 'Sin nombre',
              path: item.path || '',
              createdAt: item.createdAt || new Date().toISOString()
            };
            
            // Verificar si es una carpeta basado en el campo isFolder
            if (item.isFolder === true) {
              // Es una carpeta, añadir a la lista de carpetas
              return {
                ...processedItem,
                isFolder: true,
                itemCount: item.itemCount || 0
              };
            } else {
              // Es un archivo, añadir propiedades específicas de archivo
              return {
                ...processedItem,
                originalName: item.originalName || item.name || 'Sin nombre',
                size: item.size || 0,
                mimeType: item.mimeType || 'application/octet-stream',
                extension: item.extension || 'desconocido',
                url: item.url || '',
                isFolder: false
              };
            }
          });
          
          // Separar carpetas y archivos
          const foldersFromResponse: Folder[] = processedItems.filter((item: any) => item.isFolder);
          const filesFromResponse: FileItem[] = processedItems.filter((item: any) => !item.isFolder);
          
          // Añadir carpetas adicionales encontradas (no deberíamos tener duplicados por _id)
          const existingFolderIds = new Set(this.folders.map(f => f._id));
          const newFolders = foldersFromResponse.filter(f => !existingFolderIds.has(f._id));
          this.folders = [...this.folders, ...newFolders];
          
          // Asignar archivos
          this.files = filesFromResponse;
          
          console.log('Carpetas después de procesar:', this.folders);
          console.log('Archivos después de procesar:', this.files);
        } else {
          // Si no hay datos, mantener las carpetas ya cargadas y limpiar archivos
          this.files = [];
          console.log('No se encontraron archivos');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar archivos:', error);
        this.files = [];
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
      
      // Verificar si hay un nombre personalizado ya establecido desde el defaultFileName
      const customName = this.uploadForm.get('customName')?.value;
      if (!customName) {
        // Solo establecer el nombre original del archivo si no hay un nombre personalizado
        this.uploadForm.get('customName')?.setValue(this.selectedFile.name);
      } else {
        // Si ya hay un nombre personalizado (probablemente del defaultFileName),
        // añadirle la extensión del archivo seleccionado si no la tiene
        const fileExt = this.selectedFile.name.substring(this.selectedFile.name.lastIndexOf('.'));
        if (customName && !customName.toLowerCase().endsWith(fileExt.toLowerCase())) {
          const updatedName = customName + fileExt;
          this.uploadForm.get('customName')?.setValue(updatedName);
          console.log('Nombre personalizado actualizado con extensión:', updatedName);
        }
      }
      
      // Validar tipo de archivo
      const validExtensions = ['.xlsx', '.xls', '.ods'];
      const fileName = this.selectedFile.name.toLowerCase();
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidFile) {
        alert('Por favor, seleccione un archivo Excel válido (.xlsx, .xls o .ods)');
        this.selectedFile = null;
        element.value = '';
      }
    }
  }

  uploadFile() {
    // Verificar permiso antes de subir
    if (!this.authService.hasPermission('file_write')) {
      console.error('Usuario sin permiso para subir archivos');
      return;
    }
    
    // Verificación explícita para TypeScript de que selectedFile no es null
    const selectedFile = this.selectedFile;
    if (!selectedFile || !this.currentFolderId) {
      console.error('No hay archivo seleccionado o carpeta actual');
      return;
    }
    
    this.uploading = true;
    
    // Primero obtenemos los detalles de la carpeta actual para ver si tiene un nombre de archivo por defecto
    this.folderService.getFolderDetails(this.currentFolderId).subscribe({
      next: (folderResponse) => {
        let defaultFileName = '';
        let isDefaultFileRequired = false;
        
        // Verificar si la carpeta tiene configurado un nombre de archivo por defecto
        if (folderResponse && folderResponse.data) {
          const folder = folderResponse.data;
          
          // Obtener defaultFileName directamente o a través del área asociada
          defaultFileName = folder.defaultFileName || '';
          isDefaultFileRequired = folder.isDefaultFileRequired || false;
          
          // Si no tiene defaultFileName directo pero tiene área asociada, obtenerlo de ahí
          if ((!defaultFileName || !isDefaultFileRequired) && folder.associatedArea) {
            defaultFileName = folder.associatedArea.defaultFileName || defaultFileName;
            isDefaultFileRequired = folder.associatedArea.isDefaultFileRequired || isDefaultFileRequired;
            console.log('Usando nombre por defecto del área asociada:', defaultFileName);
          }
          
          // Verificar si se proporcionó un nombre personalizado
          const customNameControl = this.uploadForm.get('customName');
          const customName = customNameControl?.value || '';
          
          // Si el nombre por defecto es requerido, verificar que se haya usado
          if (isDefaultFileRequired && defaultFileName && 
              (!customName || customName === selectedFile.name)) {
            alert('Es obligatorio usar el formato de nombre predefinido para este área/subárea.');
            this.uploading = false;
            return;
          }
          
          // Preparar datos para la subida
          const descriptionControl = this.uploadForm.get('description');
          const description = descriptionControl?.value || '';
          
          const tagsControl = this.uploadForm.get('tags');
          const tags = tagsControl?.value || '';
          
          // Agregar nombre personalizado si existe y es diferente al nombre del archivo
          const customNameToUse = customName || selectedFile.name;
          
          // Subir el archivo con el servicio especializado si hay nombre personalizado,
          // de lo contrario usar el endpoint genérico
          if (customName && customName !== selectedFile.name) {
            console.log('Enviando archivo con nombre personalizado:', customNameToUse);
            console.log('FolderId:', this.currentFolderId);
            
            // Uso de FileUploadService para manejar nombre personalizado
            this.fileUploadService.uploadFileWithCustomName(
              selectedFile,
              customNameToUse,
              this.currentFolderId,  // Pasamos el folderId como parámetro
              description,
              tags
            ).subscribe({
              next: (progress) => {
                console.log('Progreso de carga:', progress.progress);
                
                // Si la carga está completa (100%)
                if (progress.progress === 100 && progress.data) {
                  this.uploading = false;
                  this.showUploadDialog = false;
                  
                  // Limpiar el formulario
                  this.uploadForm.reset();
                  this.selectedFile = null;
                  
                  // Mostrar mensaje de éxito
                  alert('Archivo subido correctamente');
                  
                  // Recargar los archivos de la carpeta actual
                  this.loadFolderContent(this.currentFolderId);
                }
              },
              error: (error) => {
                console.error('Error al subir archivo:', error);
                this.uploading = false;
                alert(error.error?.message || 'Error al subir el archivo. Por favor, intente nuevamente.');
              }
            });
          } else {
            // Preparar para subir el archivo con el endpoint genérico
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('folderId', this.currentFolderId);
            
            // Agregar descripción si existe
            if (description) {
              formData.append('description', description);
            }
            
            // Agregar etiquetas si existen
            if (tags) {
              formData.append('tags', tags);
            }
            
            // Uso del endpoint genérico a través de apiService
            this.apiService.post('/files/upload', formData).subscribe({
              next: (response) => {
                this.uploading = false;
                this.showUploadDialog = false;
                
                // Limpiar el formulario
                this.uploadForm.reset();
                this.selectedFile = null;
                
                // Mostrar mensaje de éxito
                alert('Archivo subido correctamente');
                
                // Recargar los archivos de la carpeta actual
                this.loadFolderContent(this.currentFolderId);
              },
              error: (error) => {
                console.error('Error al subir archivo:', error);
                this.uploading = false;
                alert(error.error?.message || 'Error al subir el archivo. Por favor, intente nuevamente.');
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error al obtener detalles de la carpeta:', error);
        this.uploading = false;
        alert('Error al preparar la subida del archivo. Por favor, intente nuevamente.');
      }
    });
  }
  
  createFolder() {
    // Verificar permiso antes de continuar
    if (!this.authService.hasPermission('folder_create')) {
      console.error('Usuario sin permiso para crear carpetas');
      return;
    }
    
    if (this.folderCreateForm.invalid || this.creatingFolder) return;
    
    this.creatingFolder = true;
    const folderName = this.folderCreateForm.get('name')?.value;
    
    // Para poder incluir el ID de la empresa, necesitamos modificar los datos que enviamos
    const data: any = {
      name: folderName,
      parentId: this.currentFolderId || undefined
    };
    
    // Si es admin y hay una empresa seleccionada, incluir el ID de la empresa
    if (this.isAdmin && this.selectedCompanyId) {
      data.companyId = this.selectedCompanyId;
    }
    
    this.apiService.post('/folders', data).subscribe({
      next: (response) => {
        this.creatingFolder = false;
        this.showCreateFolderDialog = false;
        this.folderCreateForm.reset();
        
        // Recargar carpetas
        this.loadFolderContent(this.currentFolderId);
      },
      error: (error) => {
        console.error('Error al crear carpeta:', error);
        this.creatingFolder = false;
        alert('Error al crear carpeta. Por favor, intente nuevamente.');
      }
    });
  }

  downloadFile(fileId: string, event: Event) {
    event.stopPropagation();
    // Verificar permiso antes de descargar
    if (!this.authService.hasPermission('file_read')) {
      console.error('Usuario sin permiso para descargar archivos');
      return;
    }
    
    window.open(`${environment.apiUrl}/files/${fileId}/download`);
  }

  confirmDelete(file: FileItem) {
    // Verificar permiso antes de mostrar el diálogo de confirmación
    if (!this.authService.hasPermission('file_delete')) {
      console.error('Usuario sin permiso para eliminar archivos');
      return;
    }
    
    this.fileToDelete = file;
    this.showDeleteConfirm = true;
  }

  deleteFile() {
    // Verificar permiso nuevamente como medida de seguridad
    if (!this.authService.hasPermission('file_delete')) {
      console.error('Usuario sin permiso para eliminar archivos');
      this.showDeleteConfirm = false;
      this.fileToDelete = null;
      return;
    }
    
    if (!this.fileToDelete) return;
    
    this.apiService.delete(`/files/${this.fileToDelete._id}`).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.fileToDelete = null;
        this.loadFiles();
      },
      error: (error) => {
        console.error('Error al eliminar archivo:', error);
        alert('Error al eliminar archivo. Por favor, intente nuevamente.');
      }
    });
  }
  
  navigateToRoot() {
    this.loadFolderContent();
  }
  
  navigateToFolder(folderId: string) {
    console.log('***NAVEGACIÓN A CARPETA INICIADA***');
    console.log('ID de carpeta destino:', folderId);
    
    // Mostrar indicador de carga
    this.loading = true;
    
    // Guardar el ID actual
    this.currentFolderId = folderId;
    
    // Actualizar la URL (navegación sin recargar)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { folder: folderId },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    
    // Obtener companyId para las consultas
    const companyId = this.selectedCompanyId || 
      (this.authService.currentUser?.role === 'company_admin' ? this.authService.currentUser?.companyId : '');
    
    // Cargar el contenido de la carpeta (archivos y carpetas)
    this.folders = [];
    this.files = [];
    
    // Vamos a usar un enfoque combinado, primero cargamos las subcarpetas
    // y luego los archivos, para asegurarnos de tener todo
    console.log('Iniciando carga de elementos desde múltiples fuentes');
    
    // 1. Cargar directamente desde /files que pueden contener tanto carpetas como archivos
    this.loadFilesAndFoldersDirectly(folderId, companyId);
    
    // 2. También intentar cargar con /folders para asegurarnos de tener todas las subcarpetas
    this.folderService.getSubfolders(folderId, companyId).subscribe({
      next: (response) => {
        console.log('Respuesta adicional de subcarpetas:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          // Filtrar carpetas por permisos
          const carpetasPermitidas = response.data.filter((folder: any) => 
            this.authService.canAccessFolder(folder)
          );
          
          // Evitar duplicados (verificar IDs existentes)
          const idsActuales = new Set(this.folders.map((f: any) => f._id));
          const nuevasCarpetas = carpetasPermitidas.filter((folder: any) => !idsActuales.has(folder._id));
          
          if (nuevasCarpetas.length > 0) {
            this.folders = [...this.folders, ...nuevasCarpetas];
            console.log('Carpetas adicionales de /folders añadidas:', nuevasCarpetas.length);
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar subcarpetas adicionales:', error);
      }
    });
  }
  
  // Método para cargar directamente elementos (archivos+carpetas) de /files
  private loadFilesAndFoldersDirectly(folderId: string, companyId?: string) {
    const params: any = { 
      folderId: folderId
    };
    
    if (companyId) {
      params.companyId = companyId;
    }
    
    console.log('Cargando elementos (archivos+carpetas) con parámetros:', params);
    
    this.apiService.get('/files', params).subscribe({
      next: (response: any) => {
        console.log('Respuesta de elementos:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          this.procesarElementosMixtos(response.data, folderId);
        } else {
          // Si hay problema con este endpoint, cargar solo los archivos como respaldo
          this.loadFilesForFolder(folderId, companyId);
        }
      },
      error: (error) => {
        console.error('Error al cargar elementos mixtos:', error);
        // Como respaldo, intentar cargar solo archivos
        this.loadFilesForFolder(folderId, companyId);
      }
    });
  }
  
  // Método para procesar elementos mixtos (archivos + carpetas)
  private procesarElementosMixtos(elementos: any[], folderId: string) {
    console.log('PROCESANDO ELEMENTOS MIXTOS:', elementos.length);
    
    // Detectar carpetas: varios criterios posibles
    const carpetas = elementos.filter(item => 
      // La propiedad isFolder es true
      item.isFolder === true || 
      // Tiene un identificador en la propiedad _id
      (item._id && 
        // Tiene nombre pero no tiene las propiedades típicas de un archivo
        (item.name && !item.mimeType && !item.extension) ||
        // O tiene path y subfolderCount
        (item.path && (item.subfolderCount !== undefined || item.itemCount !== undefined))
      )
    );
    
    // Todo lo que no es carpeta se considera archivo
    const archivos = elementos.filter(item => 
      // No tiene isFolder = true
      item.isFolder !== true && 
      // Tiene alguna propiedad típica de archivos
      (item.mimeType || item.extension || item.originalName || item.size)
    );
    
    console.log(`ELEMENTOS MIXTOS PROCESADOS: Total: ${elementos.length} - Carpetas: ${carpetas.length}, Archivos: ${archivos.length}`);
    
    if (carpetas.length > 0) {
      // Mostrar detalles de cada carpeta para depuración
      carpetas.forEach((folder, index) => {
        console.log(`CARPETA ${index}: ID: ${folder._id}, Nombre: ${folder.name}, responsibleUserId: ${folder.responsibleUserId || 'no asignado'}, areaId: ${folder.areaId || 'no asignado'}`);
      });
    }
    
    // Filtrar carpetas por permisos de acceso
    const carpetasPermitidas = carpetas.filter(folder => {
      const canAccess = this.authService.canAccessFolder(folder);
      console.log(`¿PUEDE ACCEDER A CARPETA "${folder.name}"?: ${canAccess ? 'SÍ' : 'NO'}`);
      return canAccess;
    });
    
    console.log('COMPARACIÓN DE CARPETAS: Total detectadas:', carpetas.length, 'Permitidas:', carpetasPermitidas.length);
    
    // Asignar carpetas
    this.folders = carpetasPermitidas;
    
    // Asignar archivos
    this.files = archivos;
    
    // Cargar ruta y finalizar carga
    this.loadFolderPath(folderId);
    this.loading = false;
  }

  // Método para cargar solo los archivos de una carpeta
  private loadFilesForFolder(folderId: string, companyId?: string) {
    const params: any = { 
      folderId: folderId
    };
    
    if (companyId) {
      params.companyId = companyId;
    }
    
    console.log('Cargando archivos con parámetros:', params);
    
    this.apiService.get('/files', params).subscribe({
      next: (response: any) => {
        console.log('Respuesta de archivos:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          // Separar carpetas y archivos en la respuesta
          const carpetasAdicionales = response.data.filter((item: any) => 
            item.isFolder === true || 
            (item._id && item.name && !item.mimeType && !item.extension)
          );
          
          const soloArchivos = response.data.filter((item: any) => 
            !item.isFolder && (item.mimeType || item.extension)
          );
          
          console.log('Items detectados como carpetas en respuesta de archivos:', carpetasAdicionales.length);
          console.log('Items detectados como archivos en respuesta de archivos:', soloArchivos.length);
          
          // Añadir las carpetas adicionales a this.folders
          if (carpetasAdicionales.length > 0) {
            // Filtrar carpetas por permisos
            const carpetasPermitidas = carpetasAdicionales.filter((folder: any) => 
              this.authService.canAccessFolder(folder)
            );
            
            // Asegurarnos de no duplicar carpetas (por ID)
            const idsActuales = new Set(this.folders.map((f: any) => f._id));
            const carpetasNuevas = carpetasPermitidas.filter((folder: any) => 
              !idsActuales.has(folder._id)
            );
            
            // Añadir las nuevas carpetas a la lista
            this.folders = [...this.folders, ...carpetasNuevas];
            console.log('Carpetas adicionales añadidas:', carpetasNuevas.length);
          }
          
          // Asignar solo los archivos reales
          this.files = soloArchivos;
          console.log('Archivos finales:', this.files.length);
        } else {
          this.files = [];
        }
        
        // Cargar la ruta para breadcrumbs
        this.loadFolderPath(folderId);
        
        // Terminar la carga
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar archivos:', error);
        this.files = [];
        this.loading = false;
      }
    });
  }

  // Método auxiliar para procesar respuestas de contenido (usado por loadFolderContent y navigateToFolder)
  private processResponseContent(response: any, folderId?: string) {
    console.log('***PROCESANDO CONTENIDO DE RESPUESTA***');
    
    // Verificar estructura de la respuesta
    if (response && response.success) {
      if (Array.isArray(response.data)) {
        console.log('FORMATO DETECTADO: Array plano de elementos');
        console.log('Cantidad total de elementos:', response.data.length);
        
        // Procesar formato de array plano
        const items = response.data;
        
        // Enumerar todos los elementos para diagnóstico
        items.forEach((item: any, index: number) => {
          console.log(`Elemento ${index}:`, 
                     `ID: ${item._id}`, 
                     `Nombre: ${item.name}`, 
                     `¿Carpeta?: ${!!item.isFolder || (!item.mimeType && !item.extension) || (item.subfolderCount !== undefined)}`,
                     `isFolder: ${item.isFolder}`,
                     `mimeType: ${item.mimeType}`,
                     `extension: ${item.extension}`,
                     `subfolderCount: ${item.subfolderCount}`);
        });
        
        // Separar carpetas y archivos para procesar
        const detectedFolders = items.filter((item: any) => {
          const isFolder = item.isFolder === true || 
                           (!item.mimeType && !item.extension) || 
                           (item.subfolderCount !== undefined);
          return isFolder;
        });
        
        const detectedFiles = items.filter((item: any) => !detectedFolders.includes(item));
        
        console.log('CARPETAS DETECTADAS:', detectedFolders.length);
        console.log('ARCHIVOS DETECTADOS:', detectedFiles.length);
        
        // Procesar carpetas según reglas de permisos
        this.folders = detectedFolders.filter((folder: any) => {
          const canAccess = this.authService.canAccessFolder(folder);
          console.log(`¿Puede acceder a carpeta "${folder.name}"?: ${canAccess ? 'SÍ' : 'NO'}`);
          return canAccess;
        });
        
        this.files = detectedFiles;
      } 
      // Estructura anidada (folders + files)
      else if (response.data && typeof response.data === 'object') {
        console.log('FORMATO DETECTADO: Estructura anidada folders/files');
        
        // Imprimir propiedades del objeto data para diagnóstico
        const dataProps = Object.keys(response.data);
        console.log('Propiedades de data:', dataProps.join(', '));
        
        // Para el formato anidado, folders y files ya están separados en la respuesta
        if (Array.isArray(response.data.folders)) {
          const foldersFromAPI = response.data.folders;
          console.log('CARPETAS EN RESPUESTA:', foldersFromAPI.length);
          
          // Enumerar todas las carpetas para diagnóstico
          foldersFromAPI.forEach((folder: any, index: number) => {
            console.log(`Carpeta ${index}:`, 
                      `ID: ${folder._id}`, 
                      `Nombre: ${folder.name}`, 
                      `Path: ${folder.path}`);
          });
          
          this.folders = foldersFromAPI.filter((folder: any) => {
            const canAccess = this.authService.canAccessFolder(folder);
            console.log(`¿Puede acceder a carpeta "${folder.name}"?: ${canAccess ? 'SÍ' : 'NO'}`);
            return canAccess;
          });
        } else {
          this.folders = [];
        }
        
        if (Array.isArray(response.data.files)) {
          this.files = response.data.files;
          console.log('ARCHIVOS EN RESPUESTA:', this.files.length);
        } else {
          this.files = [];
        }
      }
      else {
        console.warn('FORMATO DE RESPUESTA NO RECONOCIDO:', response);
        this.folders = [];
        this.files = [];
      }
    } else {
      console.warn('RESPUESTA INVÁLIDA:', response);
      this.folders = [];
      this.files = [];
    }
    
    // Si estamos en una carpeta, cargar la ruta para breadcrumbs
    if (folderId) {
      this.loadFolderPath(folderId);
    } else {
      this.breadcrumbs = [];
    }
    
    console.log('RESULTADO FINAL:');
    console.log('Carpetas a mostrar:', this.folders.length);
    console.log('Archivos a mostrar:', this.files.length);
    
    this.loading = false;
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error de formato';
    }
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (response) => {
        this.companies = response.data;
        if (this.companies.length > 0) {
          // Inicialmente no seleccionar ninguna empresa para mostrar un mensaje de selección
          this.selectedCompanyId = '';
        }
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
  }

  // Método para manejar el cambio de empresa seleccionada
  onCompanyChange(companyId: string): void {
    this.selectedCompanyId = companyId;
    if (companyId) {
      this.loadFolderContent(); // Cargar carpetas raíz de la empresa
    } else {
      // Si no hay empresa seleccionada, limpiar carpetas y archivos
      this.folders = [];
      this.files = [];
      this.breadcrumbs = [];
      this.currentFolderId = '';
    }
  }

  // Método para cargar carpetas asignadas a un responsable de área
  loadResponsibleAreaFolders(areaId: string, companyId?: string) {
    console.log('Cargando carpetas para responsable de área:', areaId);
    this.loading = true;
    
    this.folderService.getFoldersByArea(areaId, companyId).subscribe({
      next: (response) => {
        console.log('Respuesta de carpetas por área:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log('Carpetas encontradas para área:', response.data.length);
          
          // Filtrar por permisos de acceso
          this.folders = response.data.filter(folder => 
            this.authService.canAccessFolder(folder)
          );
          
          console.log('Carpetas visibles para el usuario:', this.folders.length);
          
          // También cargar carpetas generales sin área (que pueden ser accesibles)
          this.loadGeneralFolders(companyId);
        } else {
          console.log('No se encontraron carpetas para el área');
          // Cargar carpetas generales como respaldo
          this.loadGeneralFolders(companyId);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carpetas de área:', error);
        // Intentar cargar carpetas generales como respaldo
        this.loadGeneralFolders(companyId);
        this.loading = false;
      }
    });
  }
  
  // Cargar carpetas generales (sin área) de la empresa
  loadGeneralFolders(companyId?: string) {
    if (!companyId) return;
    
    console.log('Cargando carpetas generales de la empresa');
    this.loading = true;
    
    const params: any = {
      companyId: companyId,
      noArea: true  // Parámetro para indicar que queremos carpetas sin área asignada
    };
    
    this.folderService.getFolders(undefined, params).subscribe({
      next: (response) => {
        console.log('Respuesta de carpetas generales:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log('Carpetas generales encontradas:', response.data.length);
          
          // Filtrar por permisos y evitar duplicados
          const idsActuales = new Set(this.folders.map(f => f._id));
          const nuevasCarpetas = response.data
            .filter(folder => !idsActuales.has(folder._id))
            .filter(folder => this.authService.canAccessFolder(folder));
          
          // Añadir a las carpetas existentes
          if (nuevasCarpetas.length > 0) {
            this.folders = [...this.folders, ...nuevasCarpetas];
            console.log('Carpetas generales añadidas:', nuevasCarpetas.length);
          }
          
          // También cargar los archivos de la carpeta raíz si no tenemos carpeta actual
          if (!this.currentFolderId) {
            this.loadFiles();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carpetas generales:', error);
        this.loading = false;
        
        // Intentar cargar archivos sin carpeta seleccionada
        if (!this.currentFolderId) {
          this.loadFiles();
        }
      }
    });
  }

  // Método para cargar carpetas donde el usuario es responsable
  loadUserResponsibleFolders(userId?: string, companyId?: string) {
    if (!userId || !companyId) {
      this.loading = false;
      return;
    }
    
    console.log('Cargando carpetas donde el usuario es responsable:', userId);
    this.loading = true;
    
    const params: any = {
      companyId: companyId,
      responsibleUserId: userId
    };
    
    // Primero intentamos cargar carpetas donde el usuario es explícitamente responsable
    this.folderService.getFolders(undefined, params).subscribe({
      next: (response) => {
        console.log('Respuesta de carpetas donde el usuario es responsable:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log('Carpetas encontradas donde el usuario es responsable:', response.data.length);
          
          // Añadir estas carpetas primero (son las más relevantes)
          this.folders = response.data;
          
          // Luego cargar carpetas generales sin área
          this.loadGeneralFolders(companyId);
          
          // También cargar los archivos
          this.loadFiles();
        } else {
          console.log('No se encontraron carpetas donde el usuario es responsable');
          // Cargar carpetas generales como respaldo
          this.loadGeneralFolders(companyId);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carpetas donde el usuario es responsable:', error);
        // Intentar cargar carpetas generales como respaldo
        this.loadGeneralFolders(companyId);
        this.loading = false;
      }
    });
  }

  showVersions(fileId: string, event: Event): void {
    event.stopPropagation();
    this.selectedFileId = fileId;
    this.showVersionDialog = true;
  }

  refreshFileList(): void {
    if (this.currentFolderId) {
      this.loadFolderContent(this.currentFolderId);
    } else {
      this.loadRootFolders();
    }
  }

  // Mostrar el diálogo de subida de archivos y precargar nombre predeterminado si existe
  openUploadDialog(): void {
    // Verificar si tenemos una carpeta seleccionada
    if (!this.currentFolderId) {
      alert('Por favor, primero seleccione una carpeta donde subir los archivos.');
      return;
    }
    
    // Obtener los detalles de la carpeta actual para ver si tiene un nombre de archivo por defecto
    this.folderService.getFolderDetails(this.currentFolderId).subscribe({
      next: (folderResponse) => {
        // Reiniciar el formulario
        this.uploadForm.reset();
        this.selectedFile = null;
        
        // Verificar si la carpeta tiene configurado un nombre de archivo por defecto
        if (folderResponse && folderResponse.data) {
          const folder = folderResponse.data;
          console.log('Datos de carpeta obtenidos:', folder);
          
          // Verificar si tiene el defaultFileName directamente o a través del área asociada
          let defaultFileName = folder.defaultFileName || '';
          let isDefaultFileRequired = folder.isDefaultFileRequired || false;
          
          // Si no tiene defaultFileName directo pero tiene área asociada, obtenerlo de ahí
          if ((!defaultFileName || !isDefaultFileRequired) && folder.associatedArea) {
            console.log('Encontrada área asociada:', folder.associatedArea);
            defaultFileName = folder.associatedArea.defaultFileName || defaultFileName;
            isDefaultFileRequired = folder.associatedArea.isDefaultFileRequired || isDefaultFileRequired;
          }
          
          console.log('Nombre por defecto final:', defaultFileName);
          console.log('¿Es requerido?:', isDefaultFileRequired);
          
          if (defaultFileName) {
            // Preformatear el nombre con las variables comunes
            let formattedName = defaultFileName
              .replace('[FECHA]', new Date().toISOString().split('T')[0])
              .replace('[HORA]', new Date().toISOString().split('T')[1].substring(0, 8).replace(/:/g, ''))
              .replace('[INDEX]', '01');
              
            // Establecer el nombre preformateado como nombre personalizado en el formulario
            this.uploadForm.get('customName')?.setValue(formattedName);
            console.log('Nombre por defecto establecido en el formulario:', formattedName);
          }
        }
        
        // Mostrar el diálogo
        this.showUploadDialog = true;
      },
      error: (error) => {
        console.error('Error al obtener detalles de la carpeta:', error);
        // A pesar del error, mostrar el diálogo sin nombre predeterminado
        this.showUploadDialog = true;
      }
    });
  }
} 