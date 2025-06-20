import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FileStatusService, PuzzlePiece, StatusData, AreaStat, SubareaStat } from '../../../core/services/file-status.service';

@Component({
  selector: 'app-file-status-dashboard',
  templateUrl: './file-status-dashboard.component.html',
  styleUrls: ['./file-status-dashboard.component.scss']
})
export class FileStatusDashboardComponent implements OnInit {
  puzzleData: PuzzlePiece[] = [];
  statusData: StatusData[] = [];
  areaStats: AreaStat[] = [];
  subareaStats: SubareaStat[] = [];
  selectedArea: string | null = null;
  overallStats = {
    totalAreas: 0,
    totalSubareas: 0,
    totalExpectedFiles: 0,
    totalExistingFiles: 0,
    totalMissingFiles: 0,
    overallCompletionRate: 0
  };
  
  loading = false;
  error: string | null = null;
  
  groupByControl = new FormControl('folder');
  timeFrameControl = new FormControl('week');
  
  constructor(private fileStatusService: FileStatusService) { }
  
  // Getter para asegurar que siempre tengamos un valor válido de groupBy
  get groupBy(): 'folder' | 'date' | 'type' {
    const value = this.groupByControl.value;
    if (value === 'folder' || value === 'date' || value === 'type') {
      return value;
    }
    return 'folder'; // Valor por defecto
  }
  
  ngOnInit(): void {
    this.loadData();
    
    // Recargar datos cuando cambian los controles
    this.groupByControl.valueChanges.subscribe(() => this.loadData());
    this.timeFrameControl.valueChanges.subscribe(() => this.loadData());
  }
  
  loadData(): void {
    this.loading = true;
    this.error = null;
    
    // Cargar datos de estado de archivos y métricas paralelamente
    forkJoin({
      status: this.fileStatusService.getFileStatus(this.groupByControl.value || 'folder'),
      metrics: this.fileStatusService.getFileMetrics(this.timeFrameControl.value || 'week'),
      areaStats: this.fileStatusService.getAreaStats()
    }).subscribe({
      next: (results) => {
        // Procesar datos de estado
        this.statusData = results.status;
        
        // Procesar datos de métricas
        if (results.metrics && results.metrics.data) {
          this.puzzleData = this.fileStatusService.preparePuzzleData(results.metrics);
          this.subareaStats = results.metrics.data.subareaStats || [];
          this.areaStats = results.metrics.data.areaStats || [];
          
          // Actualizar estadísticas de áreas con la suma de sus subáreas
          this.updateAreaStatsWithSubareas();
          
          // Actualizar estadísticas generales con la suma de todas las subáreas
          this.updateOverallStatsWithSubareas();
          
          // Seleccionar la primera área por defecto si hay áreas disponibles
          if (this.areaStats.length > 0 && !this.selectedArea) {
            this.selectedArea = this.areaStats[0]._id;
          }
        }
        
        // Procesar datos de áreas
        if (results.areaStats && results.areaStats.data) {
          // Guardar los datos originales
          const originalStats = results.areaStats.data.summary;
          
          // Si ya hemos calculado nuestras propias estadísticas, usarlas
          if (this.subareaStats.length > 0 || this.areaStats.length > 0) {
            // Ya actualizamos las estadísticas en updateOverallStatsWithSubareas()
          } else {
            this.overallStats = originalStats;
          }
        }
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos. Por favor, intente nuevamente.';
        console.error('Error cargando datos:', err);
        this.loading = false;
      }
    });
  }
  
  // Actualiza las estadísticas de las áreas sumando los archivos de sus subáreas
  updateAreaStatsWithSubareas(): void {
    // Para cada área, calcular la suma de archivos de sus subáreas
    this.areaStats.forEach(area => {
      const subareasForArea = this.subareaStats.filter(subarea => subarea.areaId === area._id);
      
      if (subareasForArea.length > 0) {
        // Calcular los totales sumando los valores de las subáreas
        let totalExistingFiles = 0;
        let totalExpectedFiles = 0;
        
        subareasForArea.forEach(subarea => {
          totalExistingFiles += subarea.existingFiles;
          totalExpectedFiles += subarea.expectedFiles;
        });
        
        // Actualizar las estadísticas del área
        area.existingFiles = totalExistingFiles;
        area.expectedFiles = totalExpectedFiles;
        area.missingFiles = totalExpectedFiles - totalExistingFiles;
        
        // Recalcular la tasa de completitud
        area.completionRate = totalExpectedFiles > 0 ? totalExistingFiles / totalExpectedFiles : 0;
      }
    });
  }
  
  // Actualiza las estadísticas generales sumando todas las subáreas o áreas si no hay subáreas
  updateOverallStatsWithSubareas(): void {
    let totalExistingFiles = 0;
    let totalExpectedFiles = 0;
    let totalAreas = this.areaStats.length;
    let totalSubareas = 0;
    
    if (this.subareaStats.length > 0) {
      // Si hay subáreas, calcular totales basados en las subáreas
      totalSubareas = this.subareaStats.length;
      
      this.subareaStats.forEach(subarea => {
        totalExistingFiles += subarea.existingFiles;
        totalExpectedFiles += subarea.expectedFiles;
      });
    } else {
      // Si no hay subáreas, usar los totales de las áreas
      this.areaStats.forEach(area => {
        totalExistingFiles += area.existingFiles;
        totalExpectedFiles += area.expectedFiles;
      });
    }
    
    // Actualizar las estadísticas generales
    this.overallStats = {
      totalAreas: totalAreas,
      totalSubareas: totalSubareas,
      totalExistingFiles: totalExistingFiles,
      totalExpectedFiles: totalExpectedFiles,
      totalMissingFiles: totalExpectedFiles - totalExistingFiles,
      overallCompletionRate: totalExpectedFiles > 0 ? totalExistingFiles / totalExpectedFiles : 0
    };
  }
  
  // Calcula el porcentaje de completitud de archivos
  getCompletionPercentage(): number {
    if (!this.overallStats.totalExpectedFiles) return 0;
    return Math.round((this.overallStats.totalExistingFiles / this.overallStats.totalExpectedFiles) * 100);
  }
  
  // Maneja la selección de un área
  selectArea(areaId: string): void {
    this.selectedArea = areaId;
  }
  
  // Obtiene las subáreas para el área seleccionada
  getSubareasForSelectedArea(): SubareaStat[] {
    if (!this.selectedArea) return [];
    return this.subareaStats.filter(subarea => subarea.areaId === this.selectedArea);
  }
  
  // Obtiene las subáreas para un área específica
  getSubareasForArea(areaId: string): SubareaStat[] {
    return this.subareaStats.filter(subarea => subarea.areaId === areaId);
  }
  
  // Obtiene el total de archivos existentes para el área seleccionada sumando sus subáreas
  getTotalExistingFilesForArea(areaId: string): number {
    const subareas = this.subareaStats.filter(subarea => subarea.areaId === areaId);
    return subareas.reduce((total, subarea) => total + subarea.existingFiles, 0);
  }
  
  // Obtiene el total de archivos esperados para el área seleccionada sumando sus subáreas
  getTotalExpectedFilesForArea(areaId: string): number {
    const subareas = this.subareaStats.filter(subarea => subarea.areaId === areaId);
    return subareas.reduce((total, subarea) => total + subarea.expectedFiles, 0);
  }

  // Calcula el porcentaje de contribución de una subárea al total de su área
  getContributionPercentage(subarea: SubareaStat): number {
    const area = this.areaStats.find(a => a._id === subarea.areaId);
    if (!area || area.expectedFiles === 0) return 0;
    
    return Math.round((subarea.expectedFiles / area.expectedFiles) * 100);
  }
  
  // Crea un rango de números para iterar en el template (usado para visualización de bloques)
  createRange(length: number): number[] {
    // Limitar el número máximo de bloques para evitar problemas de rendimiento
    const maxBlocks = 100;
    const actualLength = Math.min(length, maxBlocks);
    return Array.from({ length: actualLength }, (_, i) => i);
  }
} 