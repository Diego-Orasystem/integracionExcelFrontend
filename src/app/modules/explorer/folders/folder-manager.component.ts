import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FolderService } from '../../../core/services/folder.service';
import { Folder } from '../../../core/models/folder.model';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Breadcrumb {
  _id: string;
  name: string;
}

interface FolderTreeItem extends Folder {
  children: FolderTreeItem[];
  expanded: boolean;
}

interface FolderSelect {
  _id: string;
  name: string;
  path?: string;
}

@Component({
  selector: 'app-folder-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  template: `
    <div class="folder-manager">
      <div class="header">
        <h1>Gestión de Carpetas</h1>
        <a routerLink="/explorer" class="btn-back">
          <i class="fas fa-arrow-left"></i> Volver al Explorador
        </a>
      </div>
      
      <p class="description">Administra la estructura de carpetas para organizar tus archivos.</p>
      
      <!-- Breadcrumbs de navegación -->
      <div class="breadcrumbs">
        <span class="breadcrumb-item" (click)="navigateToRoot()">Inicio</span>
        <ng-container *ngFor="let crumb of breadcrumbs; let i = index">
          <span class="breadcrumb-separator">></span>
          <span class="breadcrumb-item" (click)="navigateToFolder(crumb._id)">{{ crumb.name }}</span>
        </ng-container>
      </div>
      
      <!-- Barra de acciones -->
      <div class="action-bar">
        <div class="left-actions">
          <button class="btn-primary" (click)="showCreateForm = true">
            <i class="fas fa-folder-plus"></i> Nueva Carpeta
          </button>
          
          <div class="folder-info" *ngIf="currentFolder">
            <span class="folder-path">
              <i class="fas fa-folder-open"></i> {{ currentFolder.name }}
            </span>
          </div>
        </div>
        
        <div class="view-options">
          <button class="view-btn" [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">
            <i class="fas fa-th-large"></i>
          </button>
          <button class="view-btn" [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">
            <i class="fas fa-list"></i>
          </button>
        </div>
      </div>
      
      <!-- Contenido principal -->
      <div class="content-container">
        <!-- Panel de árbol de carpetas -->
        <div class="folder-tree-panel">
          <h3>Estructura de Carpetas</h3>
          
          <div class="tree-search">
            <input 
              type="text" 
              placeholder="Buscar carpetas..." 
              [(ngModel)]="searchTerm"
              (input)="searchFolders()"
              class="search-input">
          </div>
          
          <div class="loading" *ngIf="loading">
            <div class="spinner"></div>
            <p>Cargando carpetas...</p>
          </div>
          
          <div class="tree-container" *ngIf="!loading">
            <div class="tree-root" (click)="navigateToRoot()" [class.active]="!currentFolderId">
              <i class="fas fa-home"></i> Carpeta raíz
            </div>
            
            <div class="tree-items">
              <ng-container *ngTemplateOutlet="folderTree; context:{folders: filteredRootFolders, level: 0}"></ng-container>
            </div>
          </div>
          
          <!-- Template recursivo para el árbol de carpetas -->
          <ng-template #folderTree let-folders="folders" let-level="level">
            <ul class="tree-list" [style.padding-left.px]="level * 20">
              <li *ngFor="let folder of folders" class="tree-item" [class.active]="folder._id === currentFolderId">
                <div class="tree-item-content">
                  <span 
                    class="tree-toggle" 
                    *ngIf="folder.children && folder.children.length" 
                    (click)="folder.expanded = !folder.expanded; $event.stopPropagation()">
                    <i class="fas" [ngClass]="folder.expanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                  </span>
                  
                  <div class="tree-item-name" (click)="navigateToFolder(folder._id)">
                    <i class="fas" [ngClass]="folder.expanded ? 'fa-folder-open' : 'fa-folder'"></i>
                    {{ folder.name }}
                  </div>
                  
                  <div class="tree-item-actions">
                    <button class="btn-icon" title="Editar" (click)="editFolder(folder); $event.stopPropagation()">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" title="Eliminar" (click)="confirmDeleteFolder(folder); $event.stopPropagation()">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <ng-container *ngIf="folder.children && folder.children.length && folder.expanded">
                  <ng-container *ngTemplateOutlet="folderTree; context:{folders: folder.children, level: level + 1}"></ng-container>
                </ng-container>
              </li>
            </ul>
          </ng-template>
        </div>
        
        <!-- Panel de detalles y contenido -->
        <div class="folder-content-panel">
          <h3>
            <span *ngIf="currentFolder">Contenido de: {{ currentFolder.name }}</span>
            <span *ngIf="!currentFolder">Carpetas Principales</span>
          </h3>
          
          <div class="loading" *ngIf="loading">
            <div class="spinner"></div>
            <p>Cargando contenido...</p>
          </div>
          
          <div class="empty-state" *ngIf="!loading && (!currentFolderContents || currentFolderContents.length === 0)">
            <i class="fas fa-folder-open empty-icon"></i>
            <p>Esta carpeta está vacía</p>
            <button class="btn-primary" (click)="showCreateForm = true">
              <i class="fas fa-folder-plus"></i> Crear Carpeta Aquí
            </button>
          </div>
          
          <!-- Vista de cuadrícula -->
          <div class="folder-grid" *ngIf="!loading && currentFolderContents && currentFolderContents.length > 0 && viewMode === 'grid'">
            <div *ngFor="let folder of currentFolderContents" class="folder-card">
              <div class="folder-card-icon" (click)="navigateToFolder(folder._id)">
                <i class="fas fa-folder"></i>
              </div>
              <div class="folder-card-details" (click)="navigateToFolder(folder._id)">
                <div class="folder-card-name">{{ folder.name }}</div>
                <div class="folder-card-info">
                  <span>{{ folder.itemCount || 0 }} elementos</span>
                </div>
              </div>
              <div class="folder-card-actions">
                <button class="btn-icon" title="Navegar" (click)="navigateToFolder(folder._id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" title="Editar" (click)="editFolder(folder)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" title="Eliminar" (click)="confirmDeleteFolder(folder)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Vista de lista -->
          <div class="folder-list" *ngIf="!loading && currentFolderContents && currentFolderContents.length > 0 && viewMode === 'list'">
            <table class="folder-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Elementos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let folder of currentFolderContents">
                  <td class="folder-name" (click)="navigateToFolder(folder._id)">
                    <i class="fas fa-folder"></i> {{ folder.name }}
                  </td>
                  <td>{{ folder.itemCount || 0 }}</td>
                  <td class="folder-actions">
                    <button class="btn-icon" title="Navegar" (click)="navigateToFolder(folder._id)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" title="Editar" (click)="editFolder(folder)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" title="Eliminar" (click)="confirmDeleteFolder(folder)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Formulario para crear carpeta -->
      <div *ngIf="showCreateForm" class="dialog-overlay">
        <div class="dialog-content">
          <h3>{{ editingFolder ? 'Editar' : 'Crear Nueva' }} Carpeta</h3>
          <form [formGroup]="folderForm" (ngSubmit)="saveFolder()">
            <div class="form-group">
              <label for="folderName">Nombre de la carpeta:</label>
              <input 
                type="text" 
                id="folderName" 
                formControlName="name" 
                placeholder="Nombre de la carpeta"
                autofocus>
              <div class="validation-error" *ngIf="folderForm.get('name')?.invalid && folderForm.get('name')?.touched">
                El nombre de la carpeta es obligatorio
              </div>
            </div>
            
            <div class="form-group" *ngIf="!editingFolder">
              <label for="parentFolder">Carpeta padre:</label>
              <select id="parentFolder" formControlName="parentId" #parentFolderSelect>
                <option value="">Carpeta raíz</option>
                <!-- Las opciones se generarán dinámicamente -->
              </select>
            </div>
            
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="cancelForm()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="folderForm.invalid || processing">
                {{ processing ? 'Guardando...' : (editingFolder ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Confirmación para eliminar carpeta -->
      <div *ngIf="showDeleteConfirm" class="dialog-overlay">
        <div class="dialog-content">
          <h3>Confirmar Eliminación</h3>
          <p>¿Está seguro que desea eliminar la carpeta <strong>{{ folderToDelete?.name }}</strong>?</p>
          <p class="warning">Esta acción eliminará también todas las subcarpetas y archivos contenidos.</p>
          
          <div class="dialog-actions">
            <button type="button" class="btn-cancel" (click)="showDeleteConfirm = false">Cancelar</button>
            <button type="button" class="btn-danger" (click)="deleteFolder()">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .folder-manager {
      padding: 20px;
      color: #333;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }
    
    .description {
      margin-bottom: 20px;
      color: #666;
    }
    
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #4a63a9;
      text-decoration: none;
      font-weight: 500;
    }
    
    .btn-back:hover {
      text-decoration: underline;
    }
    
    /* Breadcrumbs */
    .breadcrumbs {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      font-size: 14px;
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .breadcrumb-item {
      cursor: pointer;
      color: #4a63a9;
    }
    
    .breadcrumb-item:hover {
      text-decoration: underline;
    }
    
    .breadcrumb-separator {
      margin: 0 8px;
      color: #999;
    }
    
    /* Barra de acciones */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .left-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .btn-primary {
      background-color: #4a63a9;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
      transition: background-color 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    
    .btn-primary:hover {
      background-color: #3a539b;
    }
    
    .folder-info {
      display: flex;
      align-items: center;
      padding: 8px 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #4a63a9;
    }
    
    .folder-path {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    /* Opciones de vista */
    .view-options {
      display: flex;
      gap: 5px;
    }
    
    .view-btn {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .view-btn:hover, .view-btn.active {
      background-color: #4a63a9;
      color: white;
      border-color: #4a63a9;
    }
    
    /* Contenedor principal de dos columnas */
    .content-container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    /* Panel del árbol de carpetas */
    .folder-tree-panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 15px;
      min-height: 500px;
      display: flex;
      flex-direction: column;
    }
    
    .folder-tree-panel h3 {
      margin-top: 0;
      padding-bottom: 10px;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .tree-search {
      margin-bottom: 15px;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .tree-container {
      margin-top: 15px;
      flex: 1;
      overflow-y: auto;
    }
    
    .tree-root {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 10px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .tree-root:hover, .tree-root.active {
      background-color: #e9ecef;
    }
    
    .tree-root.active {
      background-color: #e3f2fd;
      border-left: 3px solid #4a63a9;
    }
    
    .tree-list {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    
    .tree-item {
      margin-bottom: 5px;
    }
    
    .tree-item-content {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .tree-toggle {
      cursor: pointer;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 5px;
    }
    
    .tree-item-name {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      cursor: pointer;
    }
    
    .tree-item-content:hover {
      background-color: #f1f3f5;
    }
    
    .tree-item.active > .tree-item-content {
      background-color: #e3f2fd;
      font-weight: 500;
    }
    
    .tree-item-actions {
      display: none;
      gap: 5px;
    }
    
    .tree-item-content:hover .tree-item-actions {
      display: flex;
    }
    
    /* Panel de contenido de carpeta */
    .folder-content-panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 15px;
      min-height: 500px;
      display: flex;
      flex-direction: column;
    }
    
    .folder-content-panel h3 {
      margin-top: 0;
      padding-bottom: 10px;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    
    /* Vista de cuadrícula */
    .folder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .folder-card {
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.3s;
    }
    
    .folder-card:hover {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .folder-card-icon {
      font-size: 32px;
      color: #f8d775;
      margin-bottom: 10px;
      text-align: center;
      cursor: pointer;
    }
    
    .folder-card-details {
      flex: 1;
      margin-bottom: 15px;
      cursor: pointer;
    }
    
    .folder-card-name {
      font-weight: 500;
      margin-bottom: 5px;
      word-break: break-word;
    }
    
    .folder-card-info {
      font-size: 12px;
      color: #777;
    }
    
    .folder-card-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    
    /* Vista de lista */
    .folder-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .folder-table th {
      text-align: left;
      padding: 12px 15px;
      background-color: #f8f9fa;
      border-bottom: 2px solid #eee;
      font-weight: 600;
    }
    
    .folder-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    
    .folder-name {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    
    .folder-name:hover {
      color: #4a63a9;
    }
    
    .folder-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: #4a63a9;
      font-size: 16px;
      padding: 5px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .btn-icon:hover {
      background-color: rgba(74, 99, 169, 0.1);
    }
    
    .btn-icon.btn-danger {
      color: #e74c3c;
    }
    
    .btn-icon.btn-danger:hover {
      background-color: rgba(231, 76, 60, 0.1);
    }
    
    /* Estados */
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #777;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #4a63a9;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 300px;
      color: #777;
      text-align: center;
    }
    
    .empty-icon {
      font-size: 48px;
      color: #ddd;
      margin-bottom: 15px;
    }
    
    .empty-state p {
      margin-bottom: 20px;
    }
    
    /* Diálogos */
    .dialog-overlay {
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
    
    .dialog-content {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      width: 500px;
      max-width: 90%;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }
    
    .dialog-content h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #333;
      border-bottom: none;
      padding-bottom: 0;
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
    
    .form-group input, .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .validation-error {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn-cancel {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
    }
    
    .btn-danger {
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
    }
    
    .warning {
      color: #e74c3c;
      font-size: 14px;
      margin-top: 5px;
      background-color: #fdf4f4;
      padding: 10px;
      border-radius: 4px;
      border-left: 3px solid #e74c3c;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .content-container {
        grid-template-columns: 1fr;
      }
      
      .folder-tree-panel {
        margin-bottom: 20px;
      }
    }
  `]
})
export class FolderManagerComponent implements OnInit, AfterViewInit {
  @ViewChild('parentFolderSelect') parentFolderSelect!: ElementRef;
  
  // Datos de carpetas
  allFolders: Folder[] = [];
  folderSelectItems: FolderSelect[] = [];
  rootFolders: FolderTreeItem[] = [];
  currentFolderContents: Folder[] = [];
  currentFolder: Folder | null = null;
  currentFolderId: string = '';
  breadcrumbs: Breadcrumb[] = [];
  filteredRootFolders: FolderTreeItem[] = [];
  
  // Estados
  loading: boolean = false;
  processing: boolean = false;
  showCreateForm: boolean = false;
  showDeleteConfirm: boolean = false;
  searchTerm: string = '';
  
  // Edición
  editingFolder: Folder | null = null;
  folderToDelete: Folder | null = null;
  
  // Formulario
  folderForm: FormGroup;

  // Vista
  private _viewMode: 'grid' | 'list' = 'grid';
  
  constructor(
    private folderService: FolderService,
    private fb: FormBuilder
  ) {
    this.folderForm = this.createFolderForm();
  }

  ngOnInit(): void {
    this.loadAllFolders();
    // Obtener preferencia de vista del localStorage si existe
    const savedViewMode = localStorage.getItem('folderManagerViewMode');
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      this.viewMode = savedViewMode as 'grid' | 'list';
    }
  }
  
  ngAfterViewInit(): void {
    this.updateFolderSelectOptions();
  }
  
  createFolderForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      parentId: ['']
    });
  }
  
  loadAllFolders(): void {
    this.loading = true;
    
    // Cargar todas las carpetas para tener la estructura completa
    // Añadir el parámetro management=true para cargar todas las carpetas sin filtrar por empresa
    const params = { management: true };
    
    this.folderService.getFolders(undefined, params).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.allFolders = response.data;
          
          // Crear lista para el selector de carpetas
          this.folderSelectItems = this.allFolders.map(folder => ({
            _id: folder._id,
            name: folder.name,
            path: folder.path
          }));
          
          // Actualizar opciones del select si ya existe
          setTimeout(() => this.updateFolderSelectOptions(), 0);
          
          // Construir la estructura de árbol
          this.buildFolderTree();
          
          // Cargar carpetas raíz para mostrar inicialmente
          this.loadFolderContent();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carpetas:', error);
        this.loading = false;
      }
    });
  }
  
  buildFolderTree(): void {
    // Crear una copia profunda para manipular
    const folders = JSON.parse(JSON.stringify(this.allFolders)) as Folder[];
    
    // Primero identificar carpetas raíz y asignar hijos vacíos a todas
    folders.forEach((folder: Folder) => {
      (folder as FolderTreeItem).children = [];
      (folder as FolderTreeItem).expanded = false;
    });
    
    // Crear mapa para acceso rápido
    const folderMap = new Map<string, FolderTreeItem>();
    folders.forEach((folder: Folder) => {
      folderMap.set(folder._id, folder as FolderTreeItem);
    });
    
    // Construir jerarquía
    const rootFolders: FolderTreeItem[] = [];
    folders.forEach((folder: Folder) => {
      if (!folder.parentId) {
        rootFolders.push(folder as FolderTreeItem);
      } else {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folder as FolderTreeItem);
        }
      }
    });
    
    this.rootFolders = rootFolders;
    this.filteredRootFolders = [...rootFolders];
  }
  
  loadFolderContent(folderId?: string): void {
    this.loading = true;
    this.currentFolderId = folderId || '';
    
    // Si se especifica un ID de carpeta, cargar su ruta
    if (folderId) {
      this.loadFolderPath(folderId);
      
      // Buscar la carpeta actual en la lista de todas las carpetas
      this.currentFolder = this.allFolders.find(f => f._id === folderId) || null;
      
      // Expandir la carpeta en el árbol
      this.expandFolderInTree(folderId);
    } else {
      // Si estamos en la raíz, limpiar datos
      this.breadcrumbs = [];
      this.currentFolder = null;
    }
    
    // Añadir el parámetro management=true para cargar carpetas sin filtrar por empresa
    const params = { management: true };
    
    // Cargar subcarpetas para el contenido
    this.folderService.getFolders(folderId, params).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.currentFolderContents = response.data;
        } else {
          this.currentFolderContents = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar contenido de carpeta:', error);
        this.currentFolderContents = [];
        this.loading = false;
      }
    });
  }
  
  loadFolderPath(folderId: string): void {
    // Añadir el parámetro management=true para obtener la ruta sin filtrar por empresa
    const params = { management: true };
    
    this.folderService.getFolderPath(folderId, params).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.breadcrumbs = response.data;
        } else {
          this.breadcrumbs = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar ruta de carpeta:', error);
        this.breadcrumbs = [];
      }
    });
  }
  
  expandFolderInTree(folderId: string): void {
    // Expandir la carpeta y todos sus padres en el árbol
    const setExpanded = (folders: FolderTreeItem[], targetId: string): boolean => {
      for (const folder of folders) {
        if (folder._id === targetId) {
          folder.expanded = true;
          return true;
        }
        
        if (folder.children && folder.children.length) {
          const foundInChildren = setExpanded(folder.children, targetId);
          if (foundInChildren) {
            folder.expanded = true;
            return true;
          }
        }
      }
      return false;
    };
    
    setExpanded(this.rootFolders, folderId);
  }
  
  navigateToRoot(): void {
    this.loadFolderContent();
  }
  
  navigateToFolder(folderId: string): void {
    this.loadFolderContent(folderId);
  }
  
  editFolder(folder: Folder): void {
    this.editingFolder = folder;
    this.folderForm.patchValue({
      name: folder.name,
      parentId: folder.parentId || ''
    });
    this.showCreateForm = true;
    
    // Actualizar opciones cuando se muestra el formulario
    setTimeout(() => this.updateFolderSelectOptions(), 0);
  }
  
  saveFolder(): void {
    if (this.folderForm.invalid || this.processing) return;
    
    this.processing = true;
    const formData = this.folderForm.value;
    
    if (this.editingFolder) {
      // Actualizar carpeta existente
      const folderId = this.editingFolder._id;
      
      // Solo enviamos el nombre en actualización
      const data = {
        name: formData.name
      };
      
      this.folderService.updateFolder(folderId, data).subscribe({
        next: (response) => {
          this.processing = false;
          this.cancelForm();
          this.loadAllFolders(); // Recargar todo para actualizar árbol
        },
        error: (error) => {
          console.error('Error al actualizar carpeta:', error);
          this.processing = false;
          alert('Error al actualizar carpeta. Por favor, intente nuevamente.');
        }
      });
    } else {
      // Crear nueva carpeta
      // Si estamos dentro de una carpeta, establecerla como padre por defecto
      const parentId = formData.parentId || this.currentFolderId;
      
      this.folderService.createFolder(formData.name, parentId).subscribe({
        next: (response) => {
          this.processing = false;
          this.cancelForm();
          this.loadAllFolders(); // Recargar todo para actualizar árbol
          
          // Si estamos en la misma carpeta donde se creó, actualizar contenido
          if (this.currentFolderId === parentId) {
            this.loadFolderContent(this.currentFolderId);
          }
        },
        error: (error) => {
          console.error('Error al crear carpeta:', error);
          this.processing = false;
          alert('Error al crear carpeta. Por favor, intente nuevamente.');
        }
      });
    }
  }
  
  cancelForm(): void {
    this.showCreateForm = false;
    this.editingFolder = null;
    this.folderForm.reset({
      parentId: this.currentFolderId
    });
  }
  
  confirmDeleteFolder(folder: Folder): void {
    this.folderToDelete = folder;
    this.showDeleteConfirm = true;
  }
  
  deleteFolder(): void {
    if (!this.folderToDelete) return;
    
    const folderId = this.folderToDelete._id;
    this.processing = true;
    
    this.folderService.deleteFolder(folderId).subscribe({
      next: (response) => {
        this.processing = false;
        this.showDeleteConfirm = false;
        this.folderToDelete = null;
        
        // Recargar todo
        this.loadAllFolders();
        
        // Si estábamos en la carpeta eliminada, volver a la raíz
        if (this.currentFolderId === folderId) {
          this.navigateToRoot();
        } else {
          // Si no, recargar el contenido actual
          this.loadFolderContent(this.currentFolderId);
        }
      },
      error: (error) => {
        console.error('Error al eliminar carpeta:', error);
        this.processing = false;
        alert('Error al eliminar carpeta. Por favor, intente nuevamente.');
      }
    });
  }
  
  // Nuevos métodos
  
  searchFolders(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRootFolders = [...this.rootFolders];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    
    // Función recursiva para buscar en el árbol
    const searchInTree = (folders: FolderTreeItem[]): FolderTreeItem[] => {
      const results: FolderTreeItem[] = [];
      
      for (const folder of folders) {
        // Comprobar si el nombre de la carpeta coincide con la búsqueda
        if (folder.name.toLowerCase().includes(searchTermLower)) {
          // Crear una copia de la carpeta para mostrar en resultados
          const folderCopy = { ...folder, children: [] } as FolderTreeItem;
          results.push(folderCopy);
        }
        
        // Buscar en los hijos recursivamente
        if (folder.children && folder.children.length) {
          const childResults = searchInTree(folder.children);
          if (childResults.length > 0) {
            // Si hay resultados en los hijos, añadir una copia de la carpeta padre
            // pero sólo con los hijos que coinciden con la búsqueda
            const folderWithMatchingChildren: FolderTreeItem = {
              ...folder,
              children: childResults,
              expanded: true
            };
            
            // Sólo añadir si no está ya (por su propio nombre)
            if (!results.some(f => f._id === folder._id)) {
              results.push(folderWithMatchingChildren);
            } else {
              // Actualizar los hijos de la carpeta ya existente
              const existingFolder = results.find(f => f._id === folder._id);
              if (existingFolder) {
                existingFolder.children = childResults;
                existingFolder.expanded = true;
              }
            }
          }
        }
      }
      
      return results;
    };
    
    this.filteredRootFolders = searchInTree(this.rootFolders);
  }
  
  // Getters y setters para viewMode
  get viewMode(): 'grid' | 'list' {
    return this._viewMode;
  }
  
  set viewMode(mode: 'grid' | 'list') {
    localStorage.setItem('folderManagerViewMode', mode);
    this._viewMode = mode;
  }
  
  updateFolderSelectOptions(): void {
    if (this.parentFolderSelect && this.folderSelectItems.length > 0) {
      const selectElement = this.parentFolderSelect.nativeElement;
      
      // Limpiar opciones existentes (excepto la opción de carpeta raíz)
      while (selectElement.options.length > 1) {
        selectElement.remove(1);
      }
      
      // Añadir nuevas opciones
      this.folderSelectItems.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder._id;
        option.text = folder.path || folder.name;
        
        // Deshabilitar si es la carpeta que se está editando
        if (this.editingFolder && this.editingFolder._id === folder._id) {
          option.disabled = true;
        }
        
        selectElement.add(option);
      });
    }
  }
} 