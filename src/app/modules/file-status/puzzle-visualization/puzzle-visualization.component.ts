import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { PuzzlePiece, AreaStat, SubareaStat } from '../../../core/services/file-status.service';

interface HierarchyDatum {
  value: number;
  color: string;
  label: string;
  data: any;
}

@Component({
  selector: 'app-puzzle-visualization',
  templateUrl: './puzzle-visualization.component.html',
  styleUrls: ['./puzzle-visualization.component.scss']
})
export class PuzzleVisualizationComponent implements OnInit, OnChanges {
  @ViewChild('puzzleContainer', { static: true }) private puzzleContainer!: ElementRef;
  @Input() puzzleData: PuzzlePiece[] = [];
  @Input() areaStats: AreaStat[] = [];
  @Input() subareaStats: SubareaStat[] = [];
  @Input() groupBy: 'folder' | 'date' | 'type' = 'folder';
  
  private svg: any;
  private width!: number;
  private height!: number;
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };
  private tooltip: any;
  private zoomBehavior: any;
  
  // Nuevas propiedades para mejorar la UX
  visualizationMode: 'treemap' | 'grid' = 'treemap';
  showMissingFiles: boolean = true;
  showLabels: boolean = true;
  selectedNode: PuzzlePiece | null = null;
  
  constructor() { }
  
  ngOnInit() {
    console.log('[PuzzleViz] ngOnInit ejecutado. Datos iniciales:', this.puzzleData);
    this.initializeSvg();
    this.createTooltip();
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log('[PuzzleViz] ngOnChanges ejecutado:', changes);
    if (changes['puzzleData']) {
      console.log('[PuzzleViz] Nuevos datos puzzle:', this.puzzleData);
    }
    
    if (changes['puzzleData'] || changes['areaStats'] || changes['subareaStats'] || changes['groupBy']) {
      this.updateVisualization();
    }
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Cambia el modo de visualización y actualiza el gráfico
   */
  setVisualizationMode(mode: 'treemap' | 'grid'): void {
    this.visualizationMode = mode;
    this.updateVisualization();
  }
  
  /**
   * Maneja el evento de redimensionamiento de la ventana
   */
  private handleResize(): void {
    // Evitar múltiples actualizaciones en poco tiempo
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.initializeSvg();
      this.updateVisualization();
    }, 250);
  }
  
  private resizeTimeout: any;
  
  /**
   * Inicializa el SVG para la visualización
   */
  private initializeSvg(): void {
    // Configurar SVG con D3
    const element = this.puzzleContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    
    if (this.height < 300) {
      this.height = 300;
    }
    
    // Limpiar SVG existente si hay
    d3.select(element).select('svg').remove();
    
    this.svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    
    // Configurar el comportamiento de zoom
    this.zoomBehavior = d3.zoom()
      .scaleExtent([0.8, 4])
      .on('zoom', (event) => {
        this.svg.attr('transform', event.transform);
      });
    
    d3.select(element).select('svg')
      .call(this.zoomBehavior)
      .on('dblclick.zoom', null); // Desactivar zoom con doble clic
    
    // Renderizar visualización inicial
    this.updateVisualization();
  }
  
  /**
   * Crea el tooltip para la visualización
   */
  private createTooltip(): void {
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'puzzle-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '6px')
      .style('padding', '10px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 8px rgba(0,0,0,0.15)');
  }
  
  /**
   * Actualiza la visualización con los datos actuales
   */
  updateVisualization(): void {
    console.log('[PuzzleViz] updateVisualization ejecutado. Datos actuales:', this.puzzleData);
    
    if (!this.puzzleData || this.puzzleData.length === 0) {
      console.warn('[PuzzleViz] No hay datos para mostrar en la visualización');
      return;
    }
    
    // Limpiar visualización anterior
    if (this.svg) {
      this.svg.selectAll('*').remove();
      
      // Filtrar datos según las opciones seleccionadas
      let filteredData = [...this.puzzleData];
      
      if (!this.showMissingFiles) {
        filteredData = filteredData.filter(d => !d.isMissingFilesNode);
      }
      
      console.log('[PuzzleViz] Renderizando datos filtrados:', filteredData);
      
      // Implementar visualización según el modo seleccionado
      if (this.visualizationMode === 'treemap') {
        this.renderTreemap(filteredData);
      } else {
        this.renderGrid(filteredData);
      }
    } else {
      console.error('[PuzzleViz] El elemento SVG no está inicializado');
    }
  }
  
  /**
   * Renderiza la visualización en modo treemap
   */
  private renderTreemap(data: PuzzlePiece[]): void {
    const hierarchyData = d3.hierarchy<{children: PuzzlePiece[]}>({ children: data })
      .sum((d: any) => (d.value || 0) * (d.weight || 1))
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
    
    const treemapLayout = d3.treemap<{children: PuzzlePiece[]}>()
      .size([this.width, this.height])
      .padding(4)
      .round(true);
    
    treemapLayout(hierarchyData);
    
    // Dibujar rectángulos para cada pieza del rompecabezas
    const nodes = this.svg.selectAll('g')
      .data(hierarchyData.leaves())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .attr('class', 'puzzle-node')
      .on('click', (event: any, d: any) => this.selectNode(d.data));
    
    nodes.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('class', (d: any) => {
        const classes = ['puzzle-piece'];
        if (d.data.isMissingFilesNode) classes.push('missing-files');
        if (d.data.isArea) classes.push('area-node');
        if (d.data.isSubarea) classes.push('subarea-node');
        return classes.join(' ');
      })
      .on('mouseover', (event: any, d: any) => {
        // Destacar elemento al pasar el mouse
        d3.select(event.currentTarget)
          .attr('stroke', '#333')
          .attr('stroke-width', 3)
          .attr('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.3))');
          
        // Mostrar tooltip
        this.showTooltip(event, d.data);
      })
      .on('mousemove', (event: any, d: any) => {
        // Actualizar posición del tooltip al mover el mouse
        this.tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event: any) => {
        // Restaurar estilo al quitar el mouse
        d3.select(event.currentTarget)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('filter', null);
          
        // Ocultar tooltip
        this.hideTooltip();
      });
    
    // Añadir etiquetas solo si están activadas
    if (this.showLabels) {
      nodes.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .text((d: any) => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          
          // Solo mostrar texto si hay suficiente espacio
          if (width < 80 || height < 30) {
            return '';
          }
          
          let text = d.data.label;
          
          if (d.data.isMissingFilesNode) {
            text = `${text} (${d.data.value})`;
          } else if (d.data.isArea || d.data.isSubarea) {
            const completionRate = Math.round((d.data.existing / d.data.expected) * 100) || 0;
            text = `${text} (${completionRate}%)`;
          }
          
          // Truncar texto largo
          if (text.length > 15 && width < 150) {
            return text.substring(0, 12) + '...';
          }
          
          return text;
        })
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .attr('class', 'puzzle-label')
        .style('pointer-events', 'none');
    }
  }
  
  /**
   * Renderiza la visualización en modo grid (cuadrícula)
   */
  private renderGrid(data: PuzzlePiece[]): void {
    const totalItems = data.length;
    const columns = Math.ceil(Math.sqrt(totalItems));
    const rows = Math.ceil(totalItems / columns);
    
    const cellWidth = this.width / columns;
    const cellHeight = this.height / rows;
    const cellSize = Math.min(cellWidth, cellHeight) - 10;
    
    const nodes = this.svg.selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d: any, i: number) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = col * cellWidth + (cellWidth - cellSize) / 2;
        const y = row * cellHeight + (cellHeight - cellSize) / 2;
        return `translate(${x},${y})`;
      })
      .attr('class', 'puzzle-node')
      .on('click', (event: any, d: any) => this.selectNode(d));
    
    nodes.append('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('class', (d: any) => {
        const classes = ['puzzle-piece'];
        if (d.isMissingFilesNode) classes.push('missing-files');
        if (d.isArea) classes.push('area-node');
        if (d.isSubarea) classes.push('subarea-node');
        return classes.join(' ');
      })
      .on('mouseover', (event: any, d: any) => {
        // Destacar elemento al pasar el mouse
        d3.select(event.currentTarget)
          .attr('stroke', '#333')
          .attr('stroke-width', 3)
          .attr('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.3))');
          
        // Mostrar tooltip
        this.showTooltip(event, d);
      })
      .on('mousemove', (event: any) => {
        // Actualizar posición del tooltip al mover el mouse
        this.tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event: any) => {
        // Restaurar estilo al quitar el mouse
        d3.select(event.currentTarget)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('filter', null);
          
        // Ocultar tooltip
        this.hideTooltip();
      });
    
    // Añadir etiquetas solo si están activadas
    if (this.showLabels) {
      nodes.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text((d: any) => {
          if (cellSize < 50) {
            return '';
          }
          
          let text = d.label || '';
          
          // Truncar texto largo
          if (text.length > 15 && cellSize < 80) {
            return text.substring(0, 10) + '...';
          }
          
          return text;
        })
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .attr('class', 'puzzle-label')
        .style('pointer-events', 'none');
    }
  }
  
  /**
   * Selecciona un nodo para mostrar información detallada
   */
  private selectNode(node: PuzzlePiece): void {
    this.selectedNode = node;
  }
  
  /**
   * Cierra el panel de información
   */
  closeInfo(): void {
    this.selectedNode = null;
  }
  
  /**
   * Muestra el tooltip con la información del nodo
   */
  private showTooltip(event: any, d: any): void {
    this.tooltip.transition()
      .duration(200)
      .style('opacity', 1);
      
    let tooltipContent = `<strong>${d.label}</strong><br>`;
    
    if (d.isMissingFilesNode) {
      tooltipContent += `
        <span>Archivos faltantes: ${d.value}</span><br>
        <span>Archivos esperados: ${d.expected || 0}</span><br>
        <span>Archivos existentes: ${d.existing || 0}</span>
      `;
    } else if (d.isArea || d.isSubarea) {
      const completionRate = d.existing / d.expected * 100 || 0;
      tooltipContent += `
        <span>Archivos existentes: ${d.existing || 0}</span><br>
        <span>Archivos esperados: ${d.expected || 0}</span><br>
        <span>Completado: ${completionRate.toFixed(1)}%</span>
      `;
      if (d.path) {
        tooltipContent += `<br><span>Ruta: ${d.path}</span>`;
      }
    } else {
      tooltipContent += `
        <span>Estado: ${this.getStatusText(d.status)}</span>
      `;
      if (d.path) {
        tooltipContent += `<br><span>Ruta: ${d.path}</span>`;
      }
    }
      
    this.tooltip.html(tooltipContent)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  }
  
  /**
   * Oculta el tooltip
   */
  private hideTooltip(): void {
    this.tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }
  
  /**
   * Calcula el porcentaje de completitud para un nodo
   */
  getCompletionRate(node: PuzzlePiece): string {
    if (!node.expected || !node.existing) return '0';
    return ((node.existing / node.expected) * 100).toFixed(1);
  }
  
  /**
   * Obtiene el texto descriptivo para un estado
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'procesado': return 'Procesado';
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'error': return 'Error';
      case 'faltante': return 'Faltante';
      default: return 'Desconocido';
    }
  }
} 