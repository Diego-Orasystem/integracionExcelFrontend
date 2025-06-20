import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { TreemapData } from '../../dashboard.service';

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  completionRate?: number;
  responsible?: string;
  data?: any;
}

// Interfaz para los nodos de D3
interface D3Node {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  data: TreemapNode;
  parent?: D3Node;
  children?: D3Node[];
  depth?: number;
  height?: number;
  value?: number;
}

@Component({
  selector: 'app-treemap-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="treemap-container">
      <div class="treemap-header">
        <h3>Visualización Treemap</h3>
        <p class="treemap-description">
          El tamaño de cada bloque representa la cantidad de archivos y el color indica el nivel de completitud.
        </p>
      </div>
      <div class="treemap-content">
        <div #treemapChart class="treemap-chart"></div>
      </div>
      <div *ngIf="selectedNode" class="treemap-details">
        <div class="details-header">
          <h3>{{ selectedNode.name }}</h3>
          <button class="close-btn" (click)="closeDetails()">×</button>
        </div>
        <div class="details-content">
          <div class="detail-stat">
            <span class="stat-label">Total Archivos:</span>
            <span class="stat-value">{{ selectedNode.value }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data">
            <span class="stat-label">Archivos Existentes:</span>
            <span class="stat-value">{{ selectedNode.data.existingFiles }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data">
            <span class="stat-label">Archivos Pendientes:</span>
            <span class="stat-value">{{ selectedNode.data.pendingFiles }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.completionRate !== undefined">
            <span class="stat-label">Completitud:</span>
            <span class="stat-value">{{ selectedNode.completionRate }}%</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.responsible">
            <span class="stat-label">Responsable:</span>
            <span class="stat-value">{{ selectedNode.responsible }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .treemap-container {
      position: relative;
      width: 100%;
      height: 600px;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .treemap-header {
      padding: 15px 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }
    
    .treemap-header h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }
    
    .treemap-description {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    
    .treemap-content {
      height: calc(100% - 80px);
      overflow: hidden;
    }
    
    .treemap-chart {
      width: 100%;
      height: 100%;
    }
    
    .treemap-details {
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
    
    .treemap-node {
      stroke: #fff;
      stroke-width: 1px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .treemap-node:hover {
      opacity: 0.8;
    }
    
    .treemap-label {
      font-size: 12px;
      font-weight: bold;
      pointer-events: none;
      text-shadow: 0 1px 0 rgba(255,255,255,0.5);
    }
  `]
})
export class TreemapVisualizationComponent implements OnChanges, AfterViewInit {
  @Input() areas: any[] = [];
  @Input() treemapData?: TreemapData;
  @ViewChild('treemapChart') private chartContainer!: ElementRef;
  
  private svg: any;
  private treemap: any;
  private root: any;
  private width = 0;
  private height = 0;
  
  selectedNode: TreemapNode | null = null;
  
  ngAfterViewInit(): void {
    if ((this.areas && this.areas.length > 0) || this.treemapData) {
      this.createTreemap();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['areas'] && this.areas && this.areas.length > 0 && this.chartContainer) ||
        (changes['treemapData'] && this.treemapData && this.chartContainer)) {
      this.createTreemap();
    }
  }
  
  private createTreemap(): void {
    // Limpiamos el contenedor
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    
    // Obtenemos las dimensiones del contenedor
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;
    
    // Preparamos los datos en formato jerárquico para el treemap
    const hierarchyData = this.treemapData || this.prepareHierarchyData();
    
    // Creamos el SVG
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    
    // Configuramos el treemap
    this.treemap = d3.treemap<TreemapNode>()
      .size([this.width, this.height])
      .paddingOuter(3)
      .paddingTop(20)
      .paddingInner(2)
      .round(true);
    
    // Creamos la jerarquía con los datos
    this.root = d3.hierarchy<TreemapNode>(hierarchyData)
      .sum((d: TreemapNode) => d.value)
      .sort((a: d3.HierarchyNode<TreemapNode>, b: d3.HierarchyNode<TreemapNode>) => {
        // Manejar valores posiblemente indefinidos
        const aValue = a.value || 0;
        const bValue = b.value || 0;
        return bValue - aValue;
      });
    
    // Aplicamos el treemap a los datos
    this.treemap(this.root);
    
    // Creamos los nodos del treemap
    const nodes = this.svg.selectAll('g')
      .data(this.root.descendants())
      .enter()
      .append('g')
      .attr('transform', (d: D3Node) => `translate(${d.x0},${d.y0})`);
    
    // Añadimos los rectángulos
    nodes.append('rect')
      .attr('class', 'treemap-node')
      .attr('width', (d: D3Node) => d.x1 - d.x0)
      .attr('height', (d: D3Node) => d.y1 - d.y0)
      .attr('fill', (d: D3Node) => this.getNodeColor(d.data))
      .on('click', (event: MouseEvent, d: D3Node) => this.selectNode(d.data));
    
    // Añadimos las etiquetas
    nodes.append('text')
      .attr('class', 'treemap-label')
      .attr('x', 4)
      .attr('y', 14)
      .text((d: D3Node) => this.truncateText(d.data.name, d.x1 - d.x0))
      .attr('fill', (d: D3Node) => this.getTextColor(d.data))
      .style('font-size', (d: D3Node) => this.getFontSize(d.x1 - d.x0, d.y1 - d.y0));
    
    // Añadimos etiquetas de completitud para nodos grandes
    nodes.filter((d: D3Node) => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 40)
      .append('text')
      .attr('class', 'treemap-label')
      .attr('x', 4)
      .attr('y', 30)
      .text((d: D3Node) => d.data.completionRate !== undefined ? `${d.data.completionRate}%` : '')
      .attr('fill', (d: D3Node) => this.getTextColor(d.data))
      .style('font-size', '10px');
  }
  
  private prepareHierarchyData(): TreemapNode {
    // Creamos el nodo raíz
    const root: TreemapNode = {
      name: 'Áreas',
      value: 0,
      children: []
    };
    
    // Añadimos las áreas como hijos del nodo raíz
    this.areas.forEach(area => {
      const areaNode: TreemapNode = {
        name: area.name,
        value: area.totalFiles,
        completionRate: area.completionRate,
        responsible: area.responsible,
        data: area,
        children: []
      };
      
      // Añadimos las subáreas como hijos del área
      if (area.subAreas && area.subAreas.length > 0) {
        area.subAreas.forEach((subarea: any) => {
          areaNode.children!.push({
            name: subarea.name,
            value: subarea.totalFiles,
            completionRate: subarea.completionRate,
            responsible: subarea.responsible,
            data: subarea
          });
        });
      }
      
      root.children!.push(areaNode);
    });
    
    return root;
  }
  
  private getNodeColor(node: TreemapNode): string {
    if (node.completionRate === undefined) return '#f8f9fa';
    
    if (node.completionRate <= 50) {
      // Rojo a amarillo
      return d3.interpolateRgb('#ee5253', '#feca57')(node.completionRate / 50);
    } else if (node.completionRate <= 80) {
      // Amarillo a azul
      return d3.interpolateRgb('#feca57', '#54a0ff')((node.completionRate - 50) / 30);
    } else {
      // Azul a verde
      return d3.interpolateRgb('#54a0ff', '#2ed573')((node.completionRate - 80) / 20);
    }
  }
  
  private getTextColor(node: TreemapNode): string {
    if (node.completionRate === undefined) return '#333';
    
    // Para nodos con completitud baja, usamos texto blanco para mejor contraste
    if (node.completionRate < 40) {
      return 'white';
    }
    
    // Para nodos con completitud alta, usamos texto oscuro
    return '#333';
  }
  
  private getFontSize(width: number, height: number): string {
    // Ajustamos el tamaño de fuente según el tamaño del nodo
    const size = Math.min(width, height) / 10;
    return `${Math.max(8, Math.min(14, size))}px`;
  }
  
  private truncateText(text: string, width: number): string {
    // Truncamos el texto si es demasiado largo para el ancho disponible
    if (!text) return '';
    
    const charWidth = 7; // Ancho aproximado de un carácter en píxeles
    const maxChars = Math.floor(width / charWidth) - 2;
    
    if (text.length <= maxChars) {
      return text;
    }
    
    return text.substring(0, maxChars) + '...';
  }
  
  selectNode(node: TreemapNode): void {
    this.selectedNode = node;
  }
  
  closeDetails(): void {
    this.selectedNode = null;
  }
} 