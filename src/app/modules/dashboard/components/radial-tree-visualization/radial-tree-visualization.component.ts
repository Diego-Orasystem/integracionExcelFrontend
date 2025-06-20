import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { RadialTreeData } from '../../dashboard.service';

interface RadialNode {
  name: string;
  value: number;
  children?: RadialNode[];
  data?: any;
}

// Interfaz para los nodos de D3
interface D3Node {
  x: number;
  y: number;
  parent: D3Node | null;
  children?: D3Node[];
  depth: number;
  height: number;
  data: RadialNode;
}

// Interfaz para los enlaces de D3
interface D3Link {
  source: {
    x: number;
    y: number;
    data: RadialNode;
  };
  target: {
    x: number;
    y: number;
    data: RadialNode;
  };
}

@Component({
  selector: 'app-radial-tree-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="radial-container">
      <div class="radial-header">
        <h3>Visualización de Árbol Radial</h3>
        <p class="radial-description">
          Las áreas se organizan en un círculo con las subáreas irradiando desde ellas, mostrando la estructura jerárquica.
        </p>
        <div class="radial-controls">
          <button class="radial-btn" (click)="zoomIn()" title="Acercar">
            <i class="fas fa-search-plus"></i>
          </button>
          <button class="radial-btn" (click)="zoomOut()" title="Alejar">
            <i class="fas fa-search-minus"></i>
          </button>
          <button class="radial-btn" (click)="resetZoom()" title="Restablecer vista">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="radial-content">
        <svg #radialSvg class="radial-svg"></svg>
      </div>
      <div *ngIf="selectedNode" class="radial-details">
        <div class="details-header">
          <h3>{{ selectedNode.name }}</h3>
          <button class="close-btn" (click)="closeDetails()">×</button>
        </div>
        <div class="details-content">
          <div class="detail-stat">
            <span class="stat-label">Total Archivos:</span>
            <span class="stat-value">{{ selectedNode.data?.totalFiles || selectedNode.value }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data?.existingFiles !== undefined">
            <span class="stat-label">Archivos Existentes:</span>
            <span class="stat-value">{{ selectedNode.data.existingFiles }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data?.pendingFiles !== undefined">
            <span class="stat-label">Archivos Pendientes:</span>
            <span class="stat-value">{{ selectedNode.data.pendingFiles }}</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data?.completionRate !== undefined">
            <span class="stat-label">Completitud:</span>
            <span class="stat-value">{{ selectedNode.data.completionRate }}%</span>
          </div>
          <div class="detail-stat" *ngIf="selectedNode.data?.responsible">
            <span class="stat-label">Responsable:</span>
            <span class="stat-value">{{ selectedNode.data.responsible }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .radial-container {
      position: relative;
      width: 100%;
      height: 600px;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .radial-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }
    
    .radial-header h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }
    
    .radial-description {
      margin: 0;
      font-size: 14px;
      color: #666;
      flex: 1 1 100%;
      margin-top: 5px;
    }
    
    .radial-controls {
      display: flex;
      gap: 10px;
    }
    
    .radial-btn {
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
    
    .radial-btn:hover {
      background: #e0e0e0;
    }
    
    .radial-content {
      height: calc(100% - 80px);
      overflow: hidden;
    }
    
    .radial-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    
    .radial-svg.grabbing {
      cursor: grabbing;
    }
    
    .radial-link {
      fill: none;
      stroke: #ccc;
      stroke-width: 1.5px;
      opacity: 0.7;
      transition: opacity 0.3s;
    }
    
    .radial-link:hover {
      opacity: 1;
      stroke-width: 2px;
    }
    
    .radial-node {
      cursor: pointer;
    }
    
    .radial-node circle {
      fill: #fff;
      stroke: #999;
      stroke-width: 2px;
      transition: all 0.3s;
    }
    
    .radial-node:hover circle {
      stroke: #333;
      stroke-width: 3px;
    }
    
    .radial-node.selected circle {
      stroke: #3498db;
      stroke-width: 4px;
    }
    
    .radial-label {
      font-size: 12px;
      font-weight: bold;
      pointer-events: none;
      text-anchor: middle;
    }
    
    .radial-details {
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
export class RadialTreeVisualizationComponent implements OnChanges, AfterViewInit {
  @Input() areas: any[] = [];
  @Input() radialTreeData?: RadialTreeData;
  @ViewChild('radialSvg') private svgRef!: ElementRef;
  
  private svg: any;
  private g: any;
  private width = 0;
  private height = 0;
  private radius = 0;
  private zoom: any;
  
  selectedNode: RadialNode | null = null;
  
  ngAfterViewInit(): void {
    if ((this.areas && this.areas.length > 0) || this.radialTreeData) {
      this.initializeVisualization();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['areas'] && this.areas && this.areas.length > 0 && this.svgRef) ||
        (changes['radialTreeData'] && this.radialTreeData && this.svgRef)) {
      this.initializeVisualization();
    }
  }
  
  private initializeVisualization(): void {
    // Limpiar SVG existente
    d3.select(this.svgRef.nativeElement).selectAll('*').remove();
    
    // Obtener dimensiones del contenedor
    const element = this.svgRef.nativeElement;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
    
    // Calcular radio para el árbol radial
    this.radius = Math.min(this.width, this.height) / 2 - 80;
    
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
    
    // Crear grupo principal centrado
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);
    
    // Preparar datos jerárquicos
    const hierarchyData = this.radialTreeData || this.prepareHierarchyData();
    
    // Crear layout de árbol radial
    const tree = d3.tree<RadialNode>()
      .size([2 * Math.PI, this.radius])
      .separation((a: d3.HierarchyNode<RadialNode>, b: d3.HierarchyNode<RadialNode>) => (a.parent === b.parent ? 1 : 2) / a.depth);
    
    // Crear jerarquía de datos
    const root = d3.hierarchy(hierarchyData);
    
    // Aplicar layout de árbol
    const treeData = tree(root);
    
    // Dibujar enlaces
    const linkGenerator = d3.linkRadial<any, any>()
      .angle((d: any) => d.x)
      .radius((d: any) => d.y);
    
    this.g.selectAll('.radial-link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'radial-link')
      .attr('d', linkGenerator)
      .attr('stroke', (d: D3Link) => this.getLinkColor(d.target.data));
    
    // Dibujar nodos
    const nodes = this.g.selectAll('.radial-node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'radial-node')
      .attr('transform', (d: D3Node) => `translate(${this.project(d.x, d.y)})`)
      .on('click', (event: any, d: D3Node) => this.selectNode(d.data));
    
    // Añadir círculos a los nodos
    nodes.append('circle')
      .attr('r', (d: D3Node) => this.getNodeRadius(d.data))
      .attr('fill', (d: D3Node) => this.getNodeColor(d.data));
    
    // Añadir etiquetas a los nodos
    nodes.append('text')
      .attr('class', 'radial-label')
      .attr('dy', (d: D3Node) => d.children ? '-1.5em' : '0.4em')
      .attr('text-anchor', 'middle')
      .text((d: D3Node) => this.truncateText(d.data.name, 20))
      .attr('fill', (d: D3Node) => this.getTextColor(d.data));
    
    // Añadir etiquetas de completitud para nodos que no son la raíz
    nodes.filter((d: D3Node) => d.depth > 0)
      .append('text')
      .attr('class', 'radial-label')
      .attr('dy', '1.5em')
      .attr('text-anchor', 'middle')
      .text((d: D3Node) => d.data.data?.completionRate !== undefined ? `${d.data.data.completionRate}%` : '')
      .attr('fill', (d: D3Node) => this.getTextColor(d.data));
    
    // Centrar la visualización
    this.resetZoom();
  }
  
  private prepareHierarchyData(): RadialNode {
    // Crear nodo raíz
    const root: RadialNode = {
      name: 'Áreas',
      value: 0,
      children: []
    };
    
    // Añadir áreas como hijos del nodo raíz
    this.areas.forEach(area => {
      const areaNode: RadialNode = {
        name: area.name,
        value: area.totalFiles,
        data: area,
        children: []
      };
      
      // Añadir subáreas como hijos del área
      if (area.subAreas && area.subAreas.length > 0) {
        area.subAreas.forEach((subarea: any) => {
          areaNode.children!.push({
            name: subarea.name,
            value: subarea.totalFiles,
            data: subarea
          });
        });
      }
      
      root.children!.push(areaNode);
    });
    
    return root;
  }
  
  private project(x: number, y: number): [number, number] {
    const angle = x - Math.PI / 2; // Rotar para que comience desde arriba
    return [Math.cos(angle) * y, Math.sin(angle) * y];
  }
  
  private getNodeRadius(node: RadialNode): number {
    if (!node.data) return 10; // Nodo raíz
    
    // Tamaño basado en la cantidad de archivos
    const baseSize = 5;
    const sizeMultiplier = Math.min(2, Math.max(0.8, node.value / 20));
    return baseSize * sizeMultiplier;
  }
  
  private getNodeColor(node: RadialNode): string {
    if (!node.data) return '#f8f9fa'; // Nodo raíz
    
    const completionRate = node.data.completionRate;
    if (completionRate === undefined) return '#f8f9fa';
    
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
  
  private getLinkColor(node: RadialNode): string {
    if (!node.data) return '#ccc';
    
    const completionRate = node.data.completionRate;
    if (completionRate === undefined) return '#ccc';
    
    if (completionRate <= 50) {
      return d3.interpolateRgb('#ee5253', '#feca57')(completionRate / 50);
    } else if (completionRate <= 80) {
      return d3.interpolateRgb('#feca57', '#54a0ff')((completionRate - 50) / 30);
    } else {
      return d3.interpolateRgb('#54a0ff', '#2ed573')((completionRate - 80) / 20);
    }
  }
  
  private getTextColor(node: RadialNode): string {
    if (!node.data) return '#333';
    
    const completionRate = node.data.completionRate;
    if (completionRate === undefined) return '#333';
    
    // Para nodos con completitud baja, usamos texto oscuro ya que el fondo es claro
    return '#333';
  }
  
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  selectNode(node: RadialNode): void {
    this.selectedNode = node;
  }
  
  closeDetails(): void {
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
    const transform = d3.zoomIdentity
      .translate(this.width / 2, this.height / 2)
      .scale(0.9);
    
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }
} 