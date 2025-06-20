import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreaPuzzleComponent } from '../area-puzzle/area-puzzle.component';
import { TreemapVisualizationComponent } from '../treemap-visualization/treemap-visualization.component';
import { HexagonVisualizationComponent } from '../hexagon-visualization/hexagon-visualization.component';
import { RadialTreeVisualizationComponent } from '../radial-tree-visualization/radial-tree-visualization.component';
import { DashboardService, AreaData, TreemapData, HexagonData, RadialTreeData } from '../../dashboard.service';

@Component({
  selector: 'app-visualization-tabs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AreaPuzzleComponent,
    TreemapVisualizationComponent,
    HexagonVisualizationComponent,
    RadialTreeVisualizationComponent
  ],
  template: `
    <div class="visualization-container">
      <div class="tabs-header">
        <div class="tabs-actions">
          <button 
            *ngFor="let tab of tabs" 
            class="tab-button" 
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)">
            <i class="fas {{tab.icon}}"></i> {{tab.name}}
          </button>
        </div>
        
        <div class="admin-controls" *ngIf="isAdmin">
          <label class="switch-container">
            <span class="switch-label">Ver todas las empresas</span>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="showAllCompanies" (change)="onShowAllCompaniesChange()">
              <span class="slider round"></span>
            </label>
          </label>
        </div>
      </div>
      
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando visualización...</p>
      </div>
      
      <div class="tab-content">
        <!-- Vista de Puzzle Original -->
        <div *ngIf="activeTab === 'puzzle'" class="tab-pane active">
          <app-area-puzzle [areas]="areas"></app-area-puzzle>
        </div>
        
        <!-- Vista de Treemap -->
        <div *ngIf="activeTab === 'treemap'" class="tab-pane active">
          <app-treemap-visualization [areas]="areas" *ngIf="!useOptimizedData"></app-treemap-visualization>
          <app-treemap-visualization [treemapData]="treemapData" *ngIf="useOptimizedData"></app-treemap-visualization>
        </div>
        
        <!-- Vista de Hexágonos -->
        <div *ngIf="activeTab === 'hexagon'" class="tab-pane active">
          <app-hexagon-visualization [areas]="areas" *ngIf="!useOptimizedData"></app-hexagon-visualization>
          <app-hexagon-visualization [hexagonData]="hexagonData" *ngIf="useOptimizedData"></app-hexagon-visualization>
        </div>
        
        <!-- Vista de Árbol Radial -->
        <div *ngIf="activeTab === 'radial'" class="tab-pane active">
          <app-radial-tree-visualization [areas]="areas" *ngIf="!useOptimizedData"></app-radial-tree-visualization>
          <app-radial-tree-visualization [radialTreeData]="radialTreeData" *ngIf="useOptimizedData"></app-radial-tree-visualization>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visualization-container {
      width: 100%;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-top: 20px;
      position: relative;
    }
    
    .tabs-header {
      display: flex;
      justify-content: space-between;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      padding: 0 15px;
      flex-wrap: wrap;
    }
    
    .tabs-actions {
      display: flex;
      overflow-x: auto;
    }
    
    .tab-button {
      padding: 15px 20px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tab-button:hover {
      color: #3498db;
      background-color: rgba(52, 152, 219, 0.05);
    }
    
    .tab-button.active {
      color: #3498db;
      border-bottom-color: #3498db;
    }
    
    .admin-controls {
      display: flex;
      align-items: center;
      padding-right: 15px;
    }
    
    .switch-container {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    
    .switch-label {
      font-size: 14px;
      color: #495057;
    }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
    }
    
    input:checked + .slider {
      background-color: #3498db;
    }
    
    input:focus + .slider {
      box-shadow: 0 0 1px #3498db;
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    .slider.round {
      border-radius: 34px;
    }
    
    .slider.round:before {
      border-radius: 50%;
    }
    
    .tab-content {
      min-height: 600px;
    }
    
    .tab-pane {
      display: none;
      padding: 0;
    }
    
    .tab-pane.active {
      display: block;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
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
  `]
})
export class VisualizationTabsComponent implements OnChanges, OnInit {
  @Input() areas: AreaData[] = [];
  @Input() isAdmin: boolean = false;
  
  activeTab = 'treemap'; // Cambiar la pestaña activa por defecto al treemap
  isLoading = false;
  useOptimizedData = true; // Usar datos optimizados del backend
  
  // Control para vista de administrador
  showAllCompanies = false;
  
  // Datos para visualizaciones específicas
  treemapData?: TreemapData;
  hexagonData?: HexagonData;
  radialTreeData?: RadialTreeData;
  
  tabs = [
    { id: 'treemap', name: 'Treemap', icon: 'fa-table-cells' },
    { id: 'hexagon', name: 'Hexágonos', icon: 'fa-hexagon-check' },
    { id: 'radial', name: 'Árbol Radial', icon: 'fa-circle-notch' },
    { id: 'puzzle', name: 'Vista Simple', icon: 'fa-th-large' }
  ];
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    // Cargar datos optimizados para visualizaciones
    this.loadOptimizedData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['areas'] && this.areas) {
      console.log('VisualizationTabsComponent recibió nuevas áreas:', this.areas.length);
      
      // Si hay cambios en las áreas, actualizar los datos optimizados
      if (this.useOptimizedData) {
        this.loadOptimizedData();
      }
    }
    
    if (changes['isAdmin']) {
      console.log('Estado de administrador actualizado:', this.isAdmin);
    }
  }
  
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    
    // Si se activa una pestaña que usa datos optimizados, cargarlos si aún no están disponibles
    if (this.useOptimizedData) {
      if (tabId === 'treemap' && !this.treemapData) {
        this.loadTreemapData();
      } else if (tabId === 'hexagon' && !this.hexagonData) {
        this.loadHexagonData();
      } else if (tabId === 'radial' && !this.radialTreeData) {
        this.loadRadialTreeData();
      }
    }
  }
  
  onShowAllCompaniesChange(): void {
    console.log('Cambiado ver todas las empresas a:', this.showAllCompanies);
    this.loadOptimizedData();
  }
  
  loadOptimizedData(): void {
    // Cargar las visualizaciones según la pestaña activa
    if (this.activeTab === 'treemap' || this.tabs[0].id === 'treemap') {
      this.loadTreemapData();
    }
    
    if (this.activeTab === 'hexagon' || this.tabs.some(tab => tab.id === 'hexagon' && tab.id !== this.activeTab)) {
      this.loadHexagonData();
    }
    
    if (this.activeTab === 'radial' || this.tabs.some(tab => tab.id === 'radial' && tab.id !== this.activeTab)) {
      this.loadRadialTreeData();
    }
  }
  
  loadTreemapData(): void {
    this.isLoading = true;
    this.dashboardService.getTreemapData(this.showAllCompanies).subscribe({
      next: (data) => {
        this.treemapData = data;
        this.isLoading = false;
        console.log('Datos de Treemap cargados correctamente');
      },
      error: (error) => {
        console.error('Error al cargar datos de Treemap:', error);
        this.isLoading = false;
        this.useOptimizedData = false; // Usar áreas sin optimizar si hay error
      }
    });
  }
  
  loadHexagonData(): void {
    this.isLoading = true;
    this.dashboardService.getHexagonData(this.showAllCompanies).subscribe({
      next: (data) => {
        this.hexagonData = data;
        this.isLoading = false;
        console.log('Datos de Hexágonos cargados correctamente');
      },
      error: (error) => {
        console.error('Error al cargar datos de Hexágonos:', error);
        this.isLoading = false;
        this.useOptimizedData = false; // Usar áreas sin optimizar si hay error
      }
    });
  }
  
  loadRadialTreeData(): void {
    this.isLoading = true;
    this.dashboardService.getRadialTreeData(this.showAllCompanies).subscribe({
      next: (data) => {
        this.radialTreeData = data;
        this.isLoading = false;
        console.log('Datos de Árbol Radial cargados correctamente');
      },
      error: (error) => {
        console.error('Error al cargar datos de Árbol Radial:', error);
        this.isLoading = false;
        this.useOptimizedData = false; // Usar áreas sin optimizar si hay error
      }
    });
  }
} 