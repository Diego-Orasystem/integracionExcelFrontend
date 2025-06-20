import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PuzzleArea {
  id: string;
  name: string;
  totalFiles: number;
  existingFiles: number;
  pendingFiles: number;
  responsible: string;
  completionRate: number;
  subAreas: PuzzleSubArea[];
  color?: string;
  size?: number;
  x?: number;
  y?: number;
  selected?: boolean;
}

interface PuzzleSubArea {
  id: string;
  name: string;
  totalFiles: number;
  existingFiles: number;
  pendingFiles: number;
  responsible: string;
  completionRate: number;
  color?: string;
  size?: number;
  x?: number;
  y?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-area-puzzle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="puzzle-container">
      <div class="puzzle-header">
        <h3>Mapa Interactivo de Áreas</h3>
        <div class="puzzle-controls">
          <button class="puzzle-btn" (click)="zoomIn()" title="Acercar">
            <i class="fas fa-search-plus"></i>
          </button>
          <button class="puzzle-btn" (click)="zoomOut()" title="Alejar">
            <i class="fas fa-search-minus"></i>
          </button>
          <button class="puzzle-btn" (click)="resetView()" title="Restablecer vista">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div class="puzzle-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: linear-gradient(to right, #ff9f43, #ee5253);"></div>
          <span>Baja completitud (0-50%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: linear-gradient(to right, #feca57, #54a0ff);"></div>
          <span>Media completitud (51-80%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: linear-gradient(to right, #54a0ff, #2ed573);"></div>
          <span>Alta completitud (81-100%)</span>
        </div>
      </div>
      
      <!-- Mensaje de depuración -->
      <div *ngIf="puzzleAreas.length === 0" class="debug-message">
        No hay áreas para mostrar. Verifique los datos proporcionados.
      </div>
      
      <!-- Visualización alternativa simple para depuración -->
      <div class="simple-puzzle-view">
        <div *ngFor="let area of puzzleAreas" class="simple-area" 
             [style.background]="getAreaColor(area.completionRate)"
             (click)="selectArea(area)">
          <h4>{{area.name}}</h4>
          <p>Completitud: {{area.completionRate}}%</p>
          <div class="simple-subareas">
            <div *ngFor="let subarea of area.subAreas" class="simple-subarea"
                 [style.background]="getAreaColor(subarea.completionRate)"
                 (click)="selectSubArea($event, area, subarea)">
              <span>{{subarea.name}} ({{subarea.completionRate}}%)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="puzzle-view" 
           [style.transform]="'scale(' + scale + ')'"
           (mousedown)="startPan($event)"
           (mousemove)="pan($event)"
           (mouseup)="endPan()"
           (mouseleave)="endPan()">
        <div class="puzzle-content" [style.transform]="'translate(' + translateX + 'px, ' + translateY + 'px)'">
          <div *ngFor="let area of puzzleAreas" 
               class="puzzle-area" 
               [class.selected]="area.selected"
               [style.width.px]="area.size"
               [style.height.px]="area.size"
               [style.left.px]="area.x"
               [style.top.px]="area.y"
               [style.background]="getAreaColor(area.completionRate)"
               (click)="selectArea(area)">
            <div class="area-content">
              <h4 class="area-name">{{area.name}}</h4>
              <div class="area-stats">
                <div class="stat-item">
                  <span class="stat-value">{{area.completionRate}}%</span>
                </div>
              </div>
            </div>
            
            <div *ngFor="let subarea of area.subAreas" 
                 class="puzzle-subarea" 
                 [class.selected]="subarea.selected"
                 [style.width.px]="subarea.size"
                 [style.height.px]="subarea.size"
                 [style.left.px]="subarea.x"
                 [style.top.px]="subarea.y"
                 [style.background]="getAreaColor(subarea.completionRate)"
                 (click)="selectSubArea($event, area, subarea)">
              <div class="subarea-content">
                <h5 class="subarea-name">{{subarea.name}}</h5>
                <div class="subarea-stats">
                  <span class="stat-value">{{subarea.completionRate}}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="selectedArea" class="area-details">
        <div class="details-header">
          <h3>{{selectedArea.name}}</h3>
          <button class="close-btn" (click)="closeDetails()">×</button>
        </div>
        <div class="details-content">
          <div class="details-stats">
            <div class="detail-stat">
              <span class="stat-label">Total Archivos:</span>
              <span class="stat-value">{{selectedArea.totalFiles}}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">Archivos Existentes:</span>
              <span class="stat-value">{{selectedArea.existingFiles}}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">Archivos Pendientes:</span>
              <span class="stat-value">{{selectedArea.pendingFiles}}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">Completitud:</span>
              <span class="stat-value">{{selectedArea.completionRate}}%</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">Responsable:</span>
              <span class="stat-value">{{selectedArea.responsible}}</span>
            </div>
          </div>
          
          <div *ngIf="selectedSubArea" class="subarea-details">
            <h4>Subárea: {{selectedSubArea.name}}</h4>
            <div class="details-stats">
              <div class="detail-stat">
                <span class="stat-label">Total Archivos:</span>
                <span class="stat-value">{{selectedSubArea.totalFiles}}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Archivos Existentes:</span>
                <span class="stat-value">{{selectedSubArea.existingFiles}}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Archivos Pendientes:</span>
                <span class="stat-value">{{selectedSubArea.pendingFiles}}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Completitud:</span>
                <span class="stat-value">{{selectedSubArea.completionRate}}%</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Responsable:</span>
                <span class="stat-value">{{selectedSubArea.responsible}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .puzzle-container {
      position: relative;
      width: 100%;
      height: 600px;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    
    .puzzle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }
    
    .puzzle-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }
    
    .puzzle-controls {
      display: flex;
      gap: 10px;
    }
    
    .puzzle-btn {
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .puzzle-btn:hover {
      background: #e0e0e0;
    }
    
    .puzzle-legend {
      display: flex;
      padding: 10px 20px;
      background: white;
      border-bottom: 1px solid #eee;
      gap: 20px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      font-size: 12px;
    }
    
    .legend-color {
      width: 30px;
      height: 12px;
      margin-right: 8px;
      border-radius: 2px;
    }
    
    .debug-message {
      padding: 20px;
      text-align: center;
      color: #666;
      background-color: rgba(255,255,255,0.9);
      border: 1px dashed #ccc;
      margin: 10px 20px;
      border-radius: 4px;
    }
    
    /* Vista simple para depuración */
    .simple-puzzle-view {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      padding: 20px;
      margin-bottom: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .simple-area {
      width: 250px;
      border-radius: 8px;
      padding: 15px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .simple-area:hover {
      transform: scale(1.02);
    }
    
    .simple-area h4 {
      margin: 0 0 10px 0;
      font-size: 16px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    .simple-area p {
      margin: 0 0 15px 0;
      font-size: 14px;
    }
    
    .simple-subareas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .simple-subarea {
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .simple-subarea:hover {
      transform: scale(1.05);
    }
    
    /* Vista principal del puzzle */
    .puzzle-view {
      position: relative;
      width: 100%;
      height: calc(100% - 120px);
      overflow: hidden;
      cursor: grab;
      transition: transform 0.2s ease;
      display: none; /* Ocultamos temporalmente la vista compleja */
    }
    
    .puzzle-view:active {
      cursor: grabbing;
    }
    
    .puzzle-content {
      position: absolute;
      width: 2000px;
      height: 2000px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.3s ease;
    }
    
    .puzzle-area {
      position: absolute;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      overflow: visible;
    }
    
    .puzzle-area:hover {
      transform: scale(1.03);
      z-index: 10;
    }
    
    .puzzle-area.selected {
      box-shadow: 0 0 0 3px #3498db, 0 2px 10px rgba(0,0,0,0.2);
      z-index: 20;
    }
    
    .area-content {
      padding: 10px;
      color: white;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .area-name {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    .area-stats {
      display: flex;
      justify-content: flex-end;
    }
    
    .stat-item {
      background: rgba(255,255,255,0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
    }
    
    .puzzle-subarea {
      position: absolute;
      border-radius: 6px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      z-index: 5;
    }
    
    .puzzle-subarea:hover {
      transform: scale(1.05);
      z-index: 15;
    }
    
    .puzzle-subarea.selected {
      box-shadow: 0 0 0 2px white, 0 0 0 4px #3498db, 0 2px 10px rgba(0,0,0,0.2);
      z-index: 25;
    }
    
    .subarea-content {
      padding: 5px;
      color: white;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 12px;
    }
    
    .subarea-name {
      margin: 0;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    .subarea-stats {
      display: flex;
      justify-content: flex-end;
      font-size: 11px;
    }
    
    .area-details {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 300px;
      background: white;
      border-radius: 8px 0 0 0;
      box-shadow: -2px -2px 10px rgba(0,0,0,0.1);
      z-index: 30;
    }
    
    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
      background: #f8f8f8;
      border-radius: 8px 0 0 0;
    }
    
    .details-header h3 {
      margin: 0;
      font-size: 16px;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    }
    
    .details-content {
      padding: 15px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .details-stats {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .detail-stat {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .stat-label {
      color: #666;
    }
    
    .stat-value {
      font-weight: bold;
      color: #333;
    }
    
    .subarea-details {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    
    .subarea-details h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }
  `]
})
export class AreaPuzzleComponent implements OnChanges, OnInit {
  @Input() areas: any[] = [];
  
  puzzleAreas: PuzzleArea[] = [];
  selectedArea: PuzzleArea | null = null;
  selectedSubArea: PuzzleSubArea | null = null;
  
  // Variables para zoom y pan
  scale = 1;
  translateX = 0;
  translateY = 0;
  isPanning = false;
  startX = 0;
  startY = 0;
  
  ngOnInit(): void {
    console.log('AreaPuzzleComponent inicializado');
    console.log('Áreas recibidas inicialmente:', this.areas);
    
    // Si ya tenemos áreas al inicializar, procesarlas
    if (this.areas && this.areas.length > 0) {
      this.initializePuzzle();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log('AreaPuzzleComponent - ngOnChanges', changes);
    
    if (changes['areas']) {
      console.log('Áreas recibidas en cambios:', this.areas);
      
      if (this.areas && this.areas.length > 0) {
        this.initializePuzzle();
      } else {
        console.warn('No se recibieron áreas o el array está vacío');
      }
    }
  }
  
  initializePuzzle(): void {
    console.log('Inicializando puzzle con áreas:', this.areas);
    
    if (!this.areas || this.areas.length === 0) {
      console.warn('No hay áreas para inicializar el puzzle');
      this.puzzleAreas = [];
      return;
    }
    
    // Crear una copia de las áreas con propiedades adicionales para el puzzle
    this.puzzleAreas = this.areas.map((area, index) => {
      // Calcular posición basada en un layout circular
      const angle = (index / this.areas.length) * 2 * Math.PI;
      const radius = 600; // Radio del círculo
      const centerX = 1000; // Centro X del contenedor
      const centerY = 1000; // Centro Y del contenedor
      
      // Tamaño basado en la cantidad de archivos
      const baseSize = 120;
      const sizeMultiplier = Math.min(1.5, Math.max(0.8, area.totalFiles / 50));
      const areaSize = baseSize * sizeMultiplier;
      
      // Posición X e Y
      const x = centerX + radius * Math.cos(angle) - areaSize / 2;
      const y = centerY + radius * Math.sin(angle) - areaSize / 2;
      
      // Procesar subáreas
      const subAreas = area.subAreas && area.subAreas.length > 0 
        ? area.subAreas.map((subarea: any, subIndex: number) => {
            // Calcular posición de las subáreas alrededor del área principal
            const subAngle = (subIndex / area.subAreas.length) * 2 * Math.PI;
            const subRadius = areaSize * 0.8; // Radio más pequeño para las subáreas
            
            // Tamaño basado en la cantidad de archivos
            const subSizeMultiplier = Math.min(1.2, Math.max(0.7, subarea.totalFiles / 20));
            const subSize = areaSize * 0.4 * subSizeMultiplier;
            
            // Posición relativa al área principal
            const subX = areaSize / 2 + subRadius * Math.cos(subAngle) - subSize / 2;
            const subY = areaSize / 2 + subRadius * Math.sin(subAngle) - subSize / 2;
            
            return {
              ...subarea,
              size: subSize,
              x: subX,
              y: subY,
              selected: false
            };
          })
        : [];
      
      return {
        ...area,
        size: areaSize,
        x: x,
        y: y,
        selected: false,
        subAreas: subAreas
      };
    });
    
    console.log('Puzzle inicializado con áreas procesadas:', this.puzzleAreas);
    
    // Ajustar la vista inicial para centrar el contenido
    this.resetView();
  }
  
  getAreaColor(completionRate: number): string {
    // Generar un color basado en la tasa de completitud
    if (completionRate <= 50) {
      // Rojo a amarillo
      const ratio = completionRate / 50;
      return `linear-gradient(135deg, #ff9f43 ${ratio * 100}%, #ee5253)`;
    } else if (completionRate <= 80) {
      // Amarillo a azul
      const ratio = (completionRate - 50) / 30;
      return `linear-gradient(135deg, #feca57 ${ratio * 100}%, #54a0ff)`;
    } else {
      // Azul a verde
      const ratio = (completionRate - 80) / 20;
      return `linear-gradient(135deg, #54a0ff ${ratio * 100}%, #2ed573)`;
    }
  }
  
  selectArea(area: PuzzleArea): void {
    console.log('Área seleccionada:', area);
    
    // Deseleccionar todas las áreas y subáreas
    this.puzzleAreas.forEach(a => {
      a.selected = false;
      a.subAreas.forEach(sa => sa.selected = false);
    });
    
    // Seleccionar el área actual
    area.selected = true;
    this.selectedArea = area;
    this.selectedSubArea = null;
  }
  
  selectSubArea(event: MouseEvent, area: PuzzleArea, subarea: PuzzleSubArea): void {
    event.stopPropagation(); // Evitar que se propague al área padre
    console.log('Subárea seleccionada:', subarea);
    
    // Deseleccionar todas las áreas y subáreas
    this.puzzleAreas.forEach(a => {
      a.selected = false;
      a.subAreas.forEach(sa => sa.selected = false);
    });
    
    // Seleccionar el área y subárea actual
    area.selected = true;
    subarea.selected = true;
    this.selectedArea = area;
    this.selectedSubArea = subarea;
  }
  
  closeDetails(): void {
    // Deseleccionar todas las áreas y subáreas
    this.puzzleAreas.forEach(a => {
      a.selected = false;
      a.subAreas.forEach(sa => sa.selected = false);
    });
    
    this.selectedArea = null;
    this.selectedSubArea = null;
  }
  
  // Funciones para zoom
  zoomIn(): void {
    if (this.scale < 2) {
      this.scale += 0.1;
    }
  }
  
  zoomOut(): void {
    if (this.scale > 0.5) {
      this.scale -= 0.1;
    }
  }
  
  resetView(): void {
    this.scale = 0.5; // Reducir el zoom inicial para ver más contenido
    this.translateX = 0;
    this.translateY = 0;
  }
  
  // Funciones para pan (arrastrar)
  startPan(event: MouseEvent): void {
    this.isPanning = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
  }
  
  pan(event: MouseEvent): void {
    if (!this.isPanning) return;
    
    this.translateX = event.clientX - this.startX;
    this.translateY = event.clientY - this.startY;
  }
  
  endPan(): void {
    this.isPanning = false;
  }
} 