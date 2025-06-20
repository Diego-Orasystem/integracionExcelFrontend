import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { HexagonData } from '../../dashboard.service';

interface HexNode {
  id: string;
  name: string;
  totalFiles: number;
  existingFiles: number;
  pendingFiles: number;
  responsible: string;
  completionRate: number;
  parentId?: string;
  type: 'area' | 'subarea';
  x?: number;
  y?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-hexagon-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hexagon-container">
      <div class="hexagon-header">
        <h3>Visualización de Hexágonos</h3>
        <p class="hexagon-description">
          Las áreas se representan como hexágonos conectados, donde el color indica el nivel de completitud.
        </p>
        <div class="hexagon-controls">
          <button class="hexagon-btn" (click)="zoomIn()" title="Acercar">
            <i class="fas fa-search-plus"></i>
          </button>
          <button class="hexagon-btn" (click)="zoomOut()" title="Alejar">
            <i class="fas fa-search-minus"></i>
          </button>
          <button class="hexagon-btn" (click)="resetZoom()" title="Restablecer vista">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="hexagon-content">
        <svg #hexagonSvg class="hexagon-svg"></svg>
      </div>
      <div *ngIf="selectedNode" class="hexagon-details">
        <div class="details-header">
          <h3>{{ selectedNode.name }}</h3>
          <button class="close-btn" (click)="closeDetails()">×</button>
        </div>
        <div class="details-content">
          <div class="detail-stat">
            <span class="stat-label">Total Archivos:</span>
            <span class="stat-value">{{ selectedNode.totalFiles }}</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">Archivos Existentes:</span>
            <span class="stat-value">{{ selectedNode.existingFiles }}</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">Archivos Pendientes:</span>
            <span class="stat-value">{{ selectedNode.pendingFiles }}</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">Completitud:</span>
            <span class="stat-value">{{ selectedNode.completionRate }}%</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">Responsable:</span>
            <span class="stat-value">{{ selectedNode.responsible }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hexagon-container {
      position: relative;
      width: 100%;
      height: 600px;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .hexagon-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }
    
    .hexagon-header h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }
    
    .hexagon-description {
      margin: 0;
      font-size: 14px;
      color: #666;
      flex: 1 1 100%;
      margin-top: 5px;
    }
    
    .hexagon-controls {
      display: flex;
      gap: 10px;
    }
    
    .hexagon-btn {
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
    
    .hexagon-btn:hover {
      background: #e0e0e0;
    }
    
    .hexagon-content {
      height: calc(100% - 80px);
      overflow: hidden;
    }
    
    .hexagon-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    
    .hexagon-svg.grabbing {
      cursor: grabbing;
    }
    
    .hexagon {
      stroke: #fff;
      stroke-width: 2px;
      transition: all 0.3s;
      cursor: pointer;
    }
    
    .hexagon:hover {
      stroke: #333;
      stroke-width: 3px;
    }
    
    .hexagon.selected {
      stroke: #3498db;
      stroke-width: 4px;
    }
    
    .hexagon-label {
      font-size: 12px;
      font-weight: bold;
      text-anchor: middle;
      pointer-events: none;
    }
    
    .hexagon-link {
      fill: none;
      stroke: #ccc;
      stroke-width: 1.5px;
    }
    
    .hexagon-details {
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
  `]
})
export class HexagonVisualizationComponent implements OnChanges, AfterViewInit {
  @Input() areas: any[] = [];
  @Input() hexagonData?: HexagonData;
  @ViewChild('hexagonSvg') private svgRef!: ElementRef;
  
  private svg: any;
  private g: any;
  private width = 0;
  private height = 0;
  private hexRadius = 60;
  private zoom: any;
  
  private nodes: HexNode[] = [];
  private links: {source: string, target: string}[] = [];
  
  selectedNode: HexNode | null = null;
  
  ngAfterViewInit(): void {
    if ((this.areas && this.areas.length > 0) || this.hexagonData) {
      this.createHexagonVisualization();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['areas'] && this.areas && this.areas.length > 0 && this.svgRef) ||
        (changes['hexagonData'] && this.hexagonData && this.svgRef)) {
      this.createHexagonVisualization();
    }
  }
  
  private createHexagonVisualization(): void {
    // Preparar los datos
    this.prepareData();
    
    // Limpiar SVG existente
    d3.select(this.svgRef.nativeElement).selectAll('*').remove();
    
    // Obtener dimensiones del contenedor
    const element = this.svgRef.nativeElement;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
    
    // Crear SVG y grupo principal
    this.svg = d3.select(element)
      .attr('width', this.width)
      .attr('height', this.height);
    
    // Configurar zoom
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });
    
    // Aplicar zoom al SVG
    this.svg.call(this.zoom);
    
    // Crear grupo principal
    this.g = this.svg.append('g')
      .attr('transform', 'translate(0,0)');
    
    // Calcular posiciones de los hexágonos
    this.calculateHexagonPositions();
    
    // Dibujar enlaces entre áreas y subáreas
    this.drawLinks();
    
    // Dibujar hexágonos
    this.drawHexagons();
    
    // Centrar la visualización
    this.centerVisualization();
  }
  
  private prepareData(): void {
    // Si tenemos datos de hexágonos del servicio, usarlos directamente
    if (this.hexagonData) {
      // Convertir los datos al formato que espera el componente
      this.nodes = this.hexagonData.nodes.map(node => ({
        id: node.id,
        name: node.name,
        totalFiles: node.value,
        existingFiles: node.data?.existingFiles || 0,
        pendingFiles: node.data?.pendingFiles || 0,
        responsible: node.responsible || '',
        completionRate: node.completionRate,
        parentId: node.parentId,
        type: node.type as 'area' | 'subarea'
      }));
      
      this.links = this.hexagonData.links.map(link => ({
        source: link.source,
        target: link.target
      }));
      
      // Calcular posiciones para los nodos
      this.calculateHexagonPositions();
      return;
    }

    // Si no hay datos optimizados, usar las áreas
    if (!this.areas || this.areas.length === 0) return;

    this.nodes = [];
    this.links = [];
    
    // Añadir nodo central para la organización
    const centerNode: HexNode = {
      id: 'center',
      name: 'Organización',
      totalFiles: 0,
      existingFiles: 0,
      pendingFiles: 0,
      responsible: '',
      completionRate: 0,
      type: 'area'
    };
    
    this.nodes.push(centerNode);
    
    // Calcular totales para el nodo central
    let totalFiles = 0;
    let existingFiles = 0;
    
    // Añadir áreas como nodos
    this.areas.forEach(area => {
      const areaNode: HexNode = {
        id: area.id,
        name: area.name,
        totalFiles: area.totalFiles,
        existingFiles: area.existingFiles,
        pendingFiles: area.pendingFiles,
        responsible: area.responsible,
        completionRate: area.completionRate,
        type: 'area'
      };
      
      this.nodes.push(areaNode);
      
      // Conectar área con el centro
      this.links.push({
        source: 'center',
        target: area.id
      });
      
      // Actualizar totales
      totalFiles += area.totalFiles;
      existingFiles += area.existingFiles;
      
      // Añadir subáreas
      if (area.subAreas && area.subAreas.length > 0) {
        area.subAreas.forEach((subarea: any) => {
          const subareaNode: HexNode = {
            id: subarea.id,
            name: subarea.name,
            totalFiles: subarea.totalFiles,
            existingFiles: subarea.existingFiles,
            pendingFiles: subarea.pendingFiles,
            responsible: subarea.responsible,
            completionRate: subarea.completionRate,
            parentId: area.id,
            type: 'subarea'
          };
          
          this.nodes.push(subareaNode);
          
          // Conectar subárea con su área padre
          this.links.push({
            source: area.id,
            target: subarea.id
          });
        });
      }
    });
    
    // Actualizar el nodo central con los totales
    centerNode.totalFiles = totalFiles;
    centerNode.existingFiles = existingFiles;
    centerNode.pendingFiles = totalFiles - existingFiles;
    centerNode.completionRate = totalFiles > 0 ? Math.round((existingFiles / totalFiles) * 100) : 0;
    
    // Calcular posiciones para los nodos
    this.calculateHexagonPositions();
  }
  
  private calculateHexagonPositions(): void {
    // Posicionar áreas en un círculo
    const areaNodes = this.nodes.filter(node => node.type === 'area');
    const areaRadius = Math.max(200, areaNodes.length * 50);
    
    areaNodes.forEach((node, i) => {
      const angle = (i / areaNodes.length) * 2 * Math.PI;
      node.x = areaRadius * Math.cos(angle) + this.width / 2;
      node.y = areaRadius * Math.sin(angle) + this.height / 2;
    });
    
    // Posicionar subáreas alrededor de sus áreas
    this.nodes.filter(node => node.type === 'subarea').forEach(node => {
      const parentNode = this.nodes.find(n => n.id === node.parentId);
      if (parentNode && parentNode.x !== undefined && parentNode.y !== undefined) {
        // Obtener todas las subáreas de este padre
        const siblings = this.nodes.filter(n => n.parentId === node.parentId);
        const index = siblings.indexOf(node);
        const count = siblings.length;
        
        // Calcular posición en un círculo más pequeño alrededor del padre
        const subareaRadius = this.hexRadius * 2.5;
        const angle = (index / count) * 2 * Math.PI;
        
        node.x = parentNode.x + subareaRadius * Math.cos(angle);
        node.y = parentNode.y + subareaRadius * Math.sin(angle);
      }
    });
  }
  
  private drawLinks(): void {
    // Crear enlaces entre áreas y subáreas
    this.g.selectAll('.hexagon-link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'hexagon-link')
      .attr('x1', (d: {source: string, target: string}) => {
        const sourceNode = this.nodes.find(n => n.id === d.source);
        return sourceNode?.x || 0;
      })
      .attr('y1', (d: {source: string, target: string}) => {
        const sourceNode = this.nodes.find(n => n.id === d.source);
        return sourceNode?.y || 0;
      })
      .attr('x2', (d: {source: string, target: string}) => {
        const targetNode = this.nodes.find(n => n.id === d.target);
        return targetNode?.x || 0;
      })
      .attr('y2', (d: {source: string, target: string}) => {
        const targetNode = this.nodes.find(n => n.id === d.target);
        return targetNode?.y || 0;
      });
  }
  
  private drawHexagons(): void {
    // Crear generador de hexágonos
    const hexagonGenerator = d3.line()
      .x((d: [number, number]) => d[0])
      .y((d: [number, number]) => d[1]);
    
    // Crear grupo para cada hexágono
    const hexGroups = this.g.selectAll('.hexagon-group')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'hexagon-group')
      .attr('transform', (d: HexNode) => `translate(${d.x || 0},${d.y || 0})`)
      .on('click', (event: any, d: HexNode) => this.selectNode(d));
    
    // Dibujar hexágonos
    hexGroups.append('path')
      .attr('class', 'hexagon')
      .attr('d', () => {
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = this.hexRadius * Math.cos(angle);
          const y = this.hexRadius * Math.sin(angle);
          points.push([x, y]);
        }
        points.push(points[0]); // Cerrar el polígono
        return hexagonGenerator(points as [number, number][]);
      })
      .attr('fill', (d: HexNode) => this.getColorByCompletionRate(d.completionRate));
    
    // Añadir etiquetas
    hexGroups.append('text')
      .attr('class', 'hexagon-label')
      .attr('dy', '-0.5em')
      .attr('fill', (d: HexNode) => this.getTextColor(d.completionRate))
      .text((d: HexNode) => d.name);
    
    // Añadir etiquetas de completitud
    hexGroups.append('text')
      .attr('class', 'hexagon-label')
      .attr('dy', '1em')
      .attr('fill', (d: HexNode) => this.getTextColor(d.completionRate))
      .text((d: HexNode) => `${d.completionRate}%`);
  }
  
  private getColorByCompletionRate(completionRate: number): string {
    if (completionRate <= 50) {
      // Rojo a amarillo
      return d3.interpolateRgb('#ee5253', '#feca57')(completionRate / 50);
    } else if (completionRate <= 80) {
      // Amarillo a azul
      return d3.interpolateRgb('#feca57', '#54a0ff')((completionRate - 50) / 30);
    } else {
      // Azul a verde
      return d3.interpolateRgb('#54a0ff', '#2ed573')((completionRate - 80) / 20);
    }
  }
  
  private getTextColor(completionRate: number): string {
    // Para nodos con completitud baja, usamos texto blanco para mejor contraste
    if (completionRate < 40) {
      return 'white';
    }
    
    // Para nodos con completitud alta, usamos texto oscuro
    return '#333';
  }
  
  private centerVisualization(): void {
    if (!this.svg || !this.g) return;
    
    // Calcular el centro del SVG
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Aplicar transformación para centrar
    const transform = d3.zoomIdentity
      .translate(centerX, centerY)
      .scale(0.8);
    
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }
  
  selectNode(node: HexNode): void {
    // Deseleccionar nodo anterior
    if (this.selectedNode) {
      this.g.selectAll('.hexagon')
        .filter((d: HexNode) => d.id === this.selectedNode?.id)
        .classed('selected', false);
    }
    
    // Seleccionar nuevo nodo
    this.selectedNode = node;
    
    // Resaltar hexágono seleccionado
    this.g.selectAll('.hexagon')
      .filter((d: HexNode) => d.id === node.id)
      .classed('selected', true);
  }
  
  closeDetails(): void {
    if (this.selectedNode) {
      // Quitar resaltado del hexágono seleccionado
      this.g.selectAll('.hexagon')
        .filter((d: HexNode) => d.id === this.selectedNode?.id)
        .classed('selected', false);
    }
    
    this.selectedNode = null;
  }
  
  zoomIn(): void {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 1.3);
  }
  
  zoomOut(): void {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 0.7);
  }
  
  resetZoom(): void {
    this.centerVisualization();
  }
} 