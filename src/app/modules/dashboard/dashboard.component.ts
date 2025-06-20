import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { AreaPuzzleComponent } from './components/area-puzzle/area-puzzle.component';
import { VisualizationTabsComponent } from './components/visualization-tabs/visualization-tabs.component';
import { DashboardService, AreaData, SubAreaData } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AreaPuzzleComponent,
    VisualizationTabsComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Panel de Control de Archivos</h1>
        <div class="header-actions">
          <div class="search-container">
            <input 
              type="text" 
              placeholder="Buscar áreas, subáreas o responsables..." 
              [(ngModel)]="searchTerm"
              (input)="filterData()"
            >
          </div>
          <!-- Solo para depuración -->
          <button class="debug-btn" (click)="setAdminUser()">Configurar Usuario Admin</button>
          <span class="admin-status" *ngIf="isAdmin">Modo Administrador</span>
        </div>
      </header>
      
      <!-- Error message display -->
      <div *ngIf="errorMessage" class="error-message">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="error-content">
          <h3>Error</h3>
          <p>{{errorMessage}}</p>
          <button class="retry-btn" (click)="loadData()">
            <i class="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
      </div>
      
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          [class.active]="currentView === 'list'"
          (click)="setView('list')">
          <i class="fas fa-list"></i> Vista de Lista
        </button>
        <button 
          class="toggle-btn" 
          [class.active]="currentView === 'visualization'"
          (click)="setView('visualization')">
          <i class="fas fa-chart-network"></i> Visualizaciones
        </button>
      </div>
      
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon files-total">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="card-content">
            <h3>Total Archivos</h3>
            <p class="card-value">{{summary.totalFiles || 0}}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon files-existing">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>Archivos Existentes</h3>
            <p class="card-value">{{summary.existingFiles || 0}}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon files-pending">
            <i class="fas fa-clock"></i>
          </div>
          <div class="card-content">
            <h3>Archivos Pendientes</h3>
            <p class="card-value">{{summary.pendingFiles || 0}}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon completion-rate">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="card-content">
            <h3>Tasa de Completitud</h3>
            <p class="card-value">{{summary.completionRate || 0}}%</p>
          </div>
        </div>
      </div>
      
      <!-- Vista de Lista -->
      <div *ngIf="currentView === 'list'" class="areas-container">
        <div class="areas-header">
          <div class="column col-name">Nombre</div>
          <div class="column col-files">Archivos</div>
          <div class="column col-existing">Existentes</div>
          <div class="column col-pending">Pendientes</div>
          <div class="column col-completion">Completitud</div>
          <div class="column col-responsible">Responsable</div>
          <div class="column col-actions">Acciones</div>
        </div>
        
        <div *ngIf="isLoading" class="loading-indicator">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
        
        <div *ngIf="!isLoading && filteredAreas.length === 0" class="no-data">
          <p>No se encontraron datos. Ajusta los términos de búsqueda o contacta al administrador.</p>
        </div>
        
        <div *ngFor="let area of filteredAreas" class="area-row">
          <div class="area-main" (click)="toggleArea(area)">
            <div class="column col-name">
              <i class="fas" [ngClass]="area.expanded ? 'fa-caret-down' : 'fa-caret-right'"></i>
              {{area.name}}
            </div>
            <div class="column col-files">{{area.totalFiles}}</div>
            <div class="column col-existing">{{area.existingFiles}}</div>
            <div class="column col-pending">{{area.pendingFiles}}</div>
            <div class="column col-completion">
              <div class="progress-bar">
                <div class="progress" [style.width.%]="area.completionRate"></div>
              </div>
              <span>{{area.completionRate}}%</span>
            </div>
            <div class="column col-responsible">
              <span *ngIf="area.responsible" [title]="area.responsibleEmail || ''">
                {{area.responsible}}
              </span>
              <span *ngIf="!area.responsible" class="no-responsible">
                Sin asignar
              </span>
            </div>
            <div class="column col-actions">
              <button class="action-btn" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn" title="Contactar responsable" *ngIf="area.responsibleEmail">
                <i class="fas fa-envelope"></i>
              </button>
            </div>
          </div>
          
          <div *ngIf="area.expanded" class="subareas-container">
            <div *ngFor="let subarea of area.subAreas" class="subarea-row">
              <div class="column col-name subarea-name">{{subarea.name}}</div>
              <div class="column col-files">{{subarea.totalFiles}}</div>
              <div class="column col-existing">{{subarea.existingFiles}}</div>
              <div class="column col-pending">{{subarea.pendingFiles}}</div>
              <div class="column col-completion">
                <div class="progress-bar">
                  <div class="progress" [style.width.%]="subarea.completionRate"></div>
                </div>
                <span>{{subarea.completionRate}}%</span>
              </div>
              <div class="column col-responsible">
                <span *ngIf="subarea.responsible" [title]="subarea.responsibleEmail || ''">
                  {{subarea.responsible}}
                </span>
                <span *ngIf="!subarea.responsible" class="no-responsible">
                  Sin asignar
                </span>
              </div>
              <div class="column col-actions">
                <button class="action-btn" title="Ver detalles">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" title="Contactar responsable" *ngIf="subarea.responsibleEmail">
                  <i class="fas fa-envelope"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vista de Visualizaciones -->
      <div *ngIf="currentView === 'visualization'" class="visualization-view-container">
        <app-visualization-tabs [areas]="filteredAreas" [isAdmin]="isAdmin"></app-visualization-tabs>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .dashboard-header h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .search-container {
      width: 350px;
    }
    
    .search-container input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .view-toggle {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .toggle-btn {
      background: #f0f0f0;
      border: none;
      padding: 8px 16px;
      margin: 0 5px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .toggle-btn.active {
      background: #3498db;
      color: white;
    }
    
    .toggle-btn:hover:not(.active) {
      background: #e0e0e0;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
      display: flex;
      align-items: center;
    }
    
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 20px;
      color: white;
    }
    
    .files-total {
      background: #3498db;
    }
    
    .files-existing {
      background: #2ecc71;
    }
    
    .files-pending {
      background: #f39c12;
    }
    
    .completion-rate {
      background: #9b59b6;
    }
    
    .card-content h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #666;
    }
    
    .card-value {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .areas-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .areas-header {
      display: flex;
      background: #f5f7fa;
      padding: 12px 15px;
      font-weight: bold;
      border-bottom: 1px solid #ddd;
    }
    
    .column {
      padding: 0 10px;
    }
    
    .col-name {
      flex: 2;
    }
    
    .col-files, .col-existing, .col-pending {
      flex: 1;
      text-align: center;
    }
    
    .col-completion {
      flex: 1.5;
    }
    
    .col-responsible {
      flex: 1.5;
    }
    
    .col-actions {
      flex: 1;
      text-align: center;
    }
    
    .area-row {
      border-bottom: 1px solid #eee;
    }
    
    .area-row:last-child {
      border-bottom: none;
    }
    
    .area-main {
      display: flex;
      align-items: center;
      padding: 15px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .area-main:hover {
      background: #f9f9f9;
    }
    
    .progress-bar {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
      margin-right: 10px;
      flex: 1;
    }
    
    .progress {
      height: 100%;
      background: linear-gradient(to right, #3498db, #2ecc71);
    }
    
    .col-completion {
      display: flex;
      align-items: center;
    }
    
    .action-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 14px;
      margin: 0 5px;
      padding: 5px;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .action-btn:hover {
      background: #f0f0f0;
      color: #333;
    }
    
    .subareas-container {
      background: #f9f9f9;
    }
    
    .subarea-row {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    
    .subarea-row:last-child {
      border-bottom: none;
    }
    
    .subarea-name {
      padding-left: 30px;
    }
    
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top-color: #3498db;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-data {
      padding: 30px;
      text-align: center;
      color: #666;
    }
    
    .no-responsible {
      color: #999;
      font-style: italic;
    }
    
    .visualization-view-container {
      margin-top: 20px;
    }
    
    .error-message {
      background-color: #fff3f3;
      border-left: 4px solid #ee5253;
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .error-icon {
      font-size: 24px;
      color: #ee5253;
      margin-right: 15px;
      padding-top: 3px;
    }
    
    .error-content {
      flex: 1;
    }
    
    .error-content h3 {
      margin: 0 0 5px 0;
      color: #ee5253;
      font-size: 16px;
    }
    
    .error-content p {
      margin: 0 0 10px 0;
      color: #555;
    }
    
    .retry-btn {
      background-color: #f0f0f0;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }
    
    .retry-btn:hover {
      background-color: #e0e0e0;
    }
    
    .debug-btn {
      background: #f0f0f0;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #333;
    }
    
    .debug-btn:hover {
      background: #e0e0e0;
    }
    
    .admin-status {
      background: #4CAF50;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  isLoading = true;
  searchTerm = '';
  areas: AreaData[] = [];
  filteredAreas: AreaData[] = [];
  currentView = 'visualization'; // Cambiar el valor inicial a 'visualization' para que se muestre por defecto
  summary = {
    totalFiles: 0,
    existingFiles: 0,
    pendingFiles: 0,
    completionRate: 0
  };
  errorMessage = '';
  isAdmin = false; // Indicar si el usuario actual es administrador
  
  constructor(private dashboardService: DashboardService) { }
  
  ngOnInit(): void {
    console.log('Dashboard component inicializado');
    this.checkAdminStatus();
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    // Forzar la detección de cambios después de que la vista se haya inicializado
    setTimeout(() => {
      console.log('Dashboard AfterViewInit - Áreas disponibles:', this.areas.length);
    }, 0);
  }
  
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Si es administrador, pasamos el parámetro para ver todas las empresas
    const showAllCompanies = this.isAdmin;
    
    console.log('Cargando datos con estado de administrador:', this.isAdmin);
    console.log('Parámetro showAllCompanies:', showAllCompanies);
    
    this.dashboardService.getAreasData(this.searchTerm, showAllCompanies).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        console.log('Áreas recibidas:', data.areas?.length || 0);
        console.log('¿Hay datos de empresas?', data.companies ? 'Sí' : 'No');
        if (data.companies) {
          console.log('Número de empresas:', data.companies.length);
        }
        
        // Agregar propiedad expanded a las áreas para control del UI
        this.areas = data.areas.map(area => ({
          ...area,
          expanded: false
        }));
        this.filteredAreas = [...this.areas];
        this.summary = data.summary;
        this.isLoading = false;
        console.log('Datos cargados correctamente:', this.areas);
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.errorMessage = 'No se pudieron cargar los datos. Por favor, inténtalo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }
  
  toggleArea(area: AreaData): void {
    area.expanded = !area.expanded;
  }
  
  filterData(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAreas = [...this.areas];
      return;
    }
    
    // Si hay un término de búsqueda, volver a cargar datos desde el servicio
    // para aprovechar el filtrado en el backend
    this.loadData();
  }
  
  setView(view: string): void {
    this.currentView = view;
    console.log('Vista cambiada a:', this.currentView);
  }
  
  // Método para verificar si el usuario es administrador
  checkAdminStatus(): void {
    // Aquí se debería obtener el estado de admin desde un servicio de autenticación
    // En un caso real, esto vendría del backend o de un servicio de autenticación
    try {
      // Verificamos si hay información de usuario en localStorage (o donde sea que se guarde)
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        // Comprobar si el usuario tiene rol de administrador usando el código 'admin'
        this.isAdmin = user.roles?.includes('admin') || user.role === 'admin';
      } else {
        // Si no hay datos de usuario, intentamos verificar si existe un rol guardado directamente
        const userRole = localStorage.getItem('userRole');
        this.isAdmin = userRole === 'admin';
      }
    } catch (error) {
      console.error('Error al verificar estado de administrador:', error);
      this.isAdmin = false;
    }
    
    console.log('Estado de administrador (detectado automáticamente):', this.isAdmin);
  }
  
  // Método para configurar un usuario administrador para pruebas
  setAdminUser(): void {
    const adminUser = {
      id: '1',
      name: 'Administrador',
      email: 'admin@example.com',
      role: 'admin', // Configurando el rol como 'admin'
      roles: ['admin']
    };
    
    // Guardar en localStorage
    localStorage.setItem('userData', JSON.stringify(adminUser));
    localStorage.setItem('userRole', 'admin');
    
    // Actualizar estado y recargar datos
    this.checkAdminStatus();
    this.loadData();
    
    console.log('Usuario administrador configurado, estado de admin:', this.isAdmin);
    alert('Usuario configurado como administrador. Recargando datos...');
  }
}