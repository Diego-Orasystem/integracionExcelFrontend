import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { FileStatusService, PuzzlePiece, AreaStat, SubareaStat } from '../../../../core/services/file-status.service';

interface PuzzleDataResponse {
  puzzleData: PuzzlePiece[];
  areaStats: AreaStat[];
  subareaStats: SubareaStat[];
  useFallbackData: boolean;
}

// Definimos una interfaz para la respuesta del servicio, permitiendo propiedades adicionales
interface FileMetricsResponse {
  success?: boolean;
  data?: {
    stats?: any;
    puzzleItems?: any[];
    areaStats?: AreaStat[];
    subareaStats?: SubareaStat[];
    // Propiedades adicionales que pueden existir en algunos casos
    areas?: AreaStat[];
    subareas?: SubareaStat[];
    [key: string]: any; // Permitimos otras propiedades
  };
  [key: string]: any; // Permitimos otras propiedades en la raíz
}

@Injectable({
  providedIn: 'root'
})
export class DashboardPuzzleService {
  constructor(private fileStatusService: FileStatusService) { }

  /**
   * Obtiene los datos para la visualización del puzzle
   */
  getPuzzleData(): Observable<PuzzleDataResponse> {
    // Definir datos de muestra que sabemos que funcionan
    const sampleData: PuzzlePiece[] = [
      { id: "pendiente", label: "Pendiente", value: 11, color: "#e74c3c" },
      { id: "procesando", label: "Procesando", value: 6, color: "#3498db" },
      { id: "procesado", label: "Procesado", value: 15, color: "#2ecc71" },
      { id: "error", label: "Error", value: 3, color: "#f39c12" }
    ];

    return this.fileStatusService.getFileMetrics().pipe(
      // Transformar la respuesta en el formato que necesitamos
      map((response: FileMetricsResponse) => {
        console.log('Datos puzzle recibidos del servicio:', response);
        const result: PuzzleDataResponse = {
          puzzleData: [],
          areaStats: [],
          subareaStats: [],
          useFallbackData: false
        };

        try {
          // Verificar si tenemos datos válidos en la respuesta
          if (response && response.data) {
            // Procesar datos de puzzle
            if (response.data.puzzleItems && response.data.puzzleItems.length > 0) {
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
                result.puzzleData = preparedData;
              } else {
                result.puzzleData = [...sampleData];
                result.useFallbackData = true;
              }
            } else {
              result.puzzleData = [...sampleData];
              result.useFallbackData = true;
            }
            
            // Procesar datos de áreas y subáreas
            if (response.data.areaStats && response.data.areaStats.length > 0) {
              result.areaStats = response.data.areaStats;
            } else if (response.data.areas && response.data.areas.length > 0) {
              result.areaStats = response.data.areas;
            }
            
            if (response.data.subareaStats && response.data.subareaStats.length > 0) {
              result.subareaStats = response.data.subareaStats;
            } else if (response.data.subareas && response.data.subareas.length > 0) {
              result.subareaStats = response.data.subareas;
            }
          } else {
            result.puzzleData = [...sampleData];
            result.useFallbackData = true;
          }
        } catch (e) {
          console.error('Error al procesar datos del puzzle:', e);
          result.puzzleData = [...sampleData];
          result.useFallbackData = true;
        }

        // Asegurar que siempre tengamos datos para mostrar
        if (result.puzzleData.length === 0) {
          result.puzzleData = [...sampleData];
          result.useFallbackData = true;
        }

        return result;
      }),
      catchError((error: any) => {
        console.error('Error al obtener datos del puzzle:', error);
        // En caso de error, devolver datos de muestra
        return of({
          puzzleData: sampleData,
          areaStats: [],
          subareaStats: [],
          useFallbackData: true
        });
      })
    );
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