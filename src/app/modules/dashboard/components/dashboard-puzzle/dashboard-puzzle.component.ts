import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStatusModule } from '../../../file-status/file-status.module';
import { PuzzlePiece, AreaStat, SubareaStat, FileStatusService } from '../../../../core/services/file-status.service';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard-puzzle',
  standalone: true,
  imports: [
    CommonModule,
    FileStatusModule
  ],
  templateUrl: './dashboard-puzzle.component.html',
  styleUrls: ['./dashboard-puzzle.component.scss']
})
export class DashboardPuzzleComponent implements OnInit {
  @Input() puzzleData: PuzzlePiece[] = [];
  @Input() areaStats: AreaStat[] = [];
  @Input() subareaStats: SubareaStat[] = [];
  @Input() groupBy: 'folder' | 'date' | 'type' = 'folder';

  isLoadingPuzzle: boolean = true;
  errorMessage: string = '';
  useFallbackData: boolean = false;

  constructor(private fileStatusService: FileStatusService) { }

  ngOnInit(): void {
    // Si no recibimos datos como Input, cargarlos nosotros mismos
    if (this.puzzleData.length === 0) {
      this.cargarDatosPuzzle();
    } else {
      this.isLoadingPuzzle = false;
    }
  }

  cargarDatosPuzzle(): void {
    this.isLoadingPuzzle = true;
    console.log('Cargando datos del puzzle desde componente específico');
    
    // Definir datos de muestra que sabemos que funcionan
    const sampleData: PuzzlePiece[] = [
      { id: "pendiente", label: "Pendiente", value: 11, color: "#e74c3c" },
      { id: "procesando", label: "Procesando", value: 6, color: "#3498db" },
      { id: "procesado", label: "Procesado", value: 15, color: "#2ecc71" },
      { id: "error", label: "Error", value: 3, color: "#f39c12" }
    ];
    
    this.fileStatusService.getFileMetrics().pipe(
      catchError(error => {
        console.error('Error al obtener datos del puzzle:', error);
        this.errorMessage = 'Error al cargar datos. Se muestran datos de ejemplo.';
        this.useFallbackData = true;
        
        // En caso de error, devolver datos de muestra
        return of({
          success: true,
          data: { 
            puzzleItems: [
              { _id: "pendiente", name: "Pendiente", value: 11, status: "pendiente" },
              { _id: "procesando", name: "Procesando", value: 6, status: "procesando" },
              { _id: "procesado", name: "Procesado", value: 15, status: "procesado" },
              { _id: "error", name: "Error", value: 3, status: "error" }
            ],
            areaStats: [],
            subareaStats: []
          }
        });
      })
    ).subscribe({
      next: (response: any) => {
        console.log('Datos puzzle recibidos del servicio:', response);
        
        // Verificar si tenemos datos válidos en la respuesta
        if (response && response.data) {
          // Procesar datos de puzzle
          if (response.data.puzzleItems && response.data.puzzleItems.length > 0) {
            try {
              const preparedData = response.data.puzzleItems.map((item: any) => ({
                id: item._id || item.id,
                label: item.name || item.label,
                value: item.value || item.count || 1,
                color: this.getNodeColor(item.status),
                status: item.status,
                type: item.type || 'file',
                path: item.folderPath || '',
                isArea: item.type === 'area',
                isSubarea: item.type === 'subarea',
                isMissingFilesNode: item.isMissingFilesNode || false,
                weight: item.weight || 1
              }));
              
              if (preparedData && preparedData.length > 0) {
                console.log('Datos preparados del servicio:', preparedData);
                this.puzzleData = preparedData;
              } else {
                // Si no hay datos válidos, usar datos de muestra
                console.log('Usando datos de muestra como respaldo');
                this.puzzleData = [...sampleData];
                this.useFallbackData = true;
              }
            } catch (e) {
              console.error('Error al preparar datos del puzzle:', e);
              this.puzzleData = [...sampleData];
              this.useFallbackData = true;
            }
          } else {
            // Si no hay datos de puzzle, usar datos de muestra
            console.log('No hay puzzleItems, usando datos de muestra');
            this.puzzleData = [...sampleData];
            this.useFallbackData = true;
          }
          
          // Procesar datos de áreas y subáreas
          if (response.data.areaStats && response.data.areaStats.length > 0) {
            this.areaStats = response.data.areaStats;
          } else if (response.data.areas && response.data.areas.length > 0) {
            this.areaStats = response.data.areas;
          }
          
          if (response.data.subareaStats && response.data.subareaStats.length > 0) {
            this.subareaStats = response.data.subareaStats;
          } else if (response.data.subareas && response.data.subareas.length > 0) {
            this.subareaStats = response.data.subareas;
          }
        } else {
          // Si no hay datos válidos en la respuesta, usar datos de muestra
          console.log('Respuesta no válida, usando datos de muestra');
          this.puzzleData = [...sampleData];
          this.useFallbackData = true;
        }
        
        this.isLoadingPuzzle = false;
      },
      error: (err) => {
        console.error('Error inesperado al obtener datos:', err);
        this.errorMessage = 'Error al cargar datos. Se muestran datos de ejemplo.';
        this.puzzleData = [...sampleData];
        this.isLoadingPuzzle = false;
        this.useFallbackData = true;
      }
    });
  }
  
  // Método auxiliar para asignar colores según el estado
  private getNodeColor(status: string): string {
    switch (status) {
      case 'procesado': return '#2ecc71'; // Verde
      case 'pendiente': return '#e74c3c'; // Rojo
      case 'procesando': return '#3498db'; // Azul
      case 'error': return '#f39c12'; // Naranja
      case 'faltante': return '#e74c3c'; // Rojo
      default: return '#95a5a6'; // Gris
    }
  }
} 