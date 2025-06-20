import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FileStatus {
  _id: string;
  name: string;
  status: 'pendiente' | 'procesando' | 'procesado' | 'error';
  processingDetails?: {
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    errorMessage?: string;
    processingNotes?: string;
  };
}

export interface StatusData {
  _id: string;
  total: number;
  pendiente: number;
  procesando: number;
  procesado: number;
  error: number;
  totalSize: number;
  folderId?: string;
  folderName?: string;
  date?: string;
  formattedDate?: string;
  extension?: string;
  fileType?: string;
}

export interface PuzzlePiece {
  id: string;
  label: string;
  value: number;
  color: string;
  status?: string;
  type?: string;
  path?: string;
  expected?: number;
  existing?: number;
  isArea?: boolean;
  isSubarea?: boolean;
  isMissingFilesNode?: boolean;
  weight?: number;
}

export interface AreaStat {
  _id: string;
  name: string;
  type: 'area';
  existingFiles: number;
  expectedFiles: number;
  missingFiles: number;
  status: string;
  completionRate: number;
  color?: string;
  icon?: string;
  folderId?: string;
  responsible?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface SubareaStat {
  _id: string;
  name: string;
  type: 'subarea';
  areaId: string;
  areaName: string;
  folderPath?: string;
  existingFiles: number;
  expectedFiles: number;
  missingFiles: number;
  status: string;
  completionRate: number;
  responsible?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface FileMetricsResponse {
  success: boolean;
  data: {
    stats: {
      totalFiles: number;
      pendientes: number;
      procesando: number;
      procesados: number;
      errores: number;
      tamanioPromedio: number;
      tamanioTotal: number;
    };
    puzzleItems: any[];
    areaStats: AreaStat[];
    subareaStats: SubareaStat[];
  };
}

export interface AreaStatsResponse {
  success: boolean;
  data: {
    areas: AreaStat[];
    summary: {
      totalAreas: number;
      totalSubareas: number;
      totalExpectedFiles: number;
      totalExistingFiles: number;
      totalMissingFiles: number;
      overallCompletionRate: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class FileStatusService {
  private apiUrl = `${environment.apiUrl}/files`;
  
  // Datos de prueba para desarrollo
  private mockStatusData: StatusData[] = [
    {
      _id: '1',
      total: 15,
      pendiente: 5,
      procesando: 3,
      procesado: 6,
      error: 1,
      totalSize: 1542678,
      folderId: '1',
      folderName: 'Contabilidad'
    },
    {
      _id: '2',
      total: 8,
      pendiente: 2,
      procesando: 1,
      procesado: 5,
      error: 0,
      totalSize: 987245,
      folderId: '2',
      folderName: 'Recursos Humanos'
    },
    {
      _id: '3',
      total: 12,
      pendiente: 4,
      procesando: 2,
      procesado: 4,
      error: 2,
      totalSize: 2345678,
      folderId: '3',
      folderName: 'Finanzas'
    }
  ];
  
  private mockPuzzleData: PuzzlePiece[] = [
    {
      id: "pendiente",
      label: "Pendiente",
      value: 11,
      color: "#e74c3c"
    },
    {
      id: "procesando",
      label: "Procesando",
      value: 6,
      color: "#3498db"
    },
    {
      id: "procesado",
      label: "Procesado",
      value: 15,
      color: "#2ecc71"
    },
    {
      id: "error",
      label: "Error",
      value: 3,
      color: "#f39c12"
    }
  ];

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el estado agregado de los archivos
   */
  getFileStatus(groupBy: string = 'folder'): Observable<StatusData[]> {
    // Versión de desarrollo con datos de prueba (mock)
    return of(this.mockStatusData).pipe(delay(500));
    
    // Versión real para producción
    // const params = new HttpParams().set('groupBy', groupBy);
    // return this.http.get<any>(`${this.apiUrl}/status`, { params })
    //   .pipe(
    //     map(response => response.data as StatusData[])
    //   );
  }

  /**
   * Obtiene métricas para la visualización
   */
  getFileMetrics(timeFrame: string = 'week'): Observable<FileMetricsResponse> {
    // Versión real para producción
    const params = new HttpParams().set('timeFrame', timeFrame);
    return this.http.get<FileMetricsResponse>(`${this.apiUrl}/metrics`, { params });
  }

  /**
   * Obtiene estadísticas detalladas por áreas y subáreas
   */
  getAreaStats(): Observable<AreaStatsResponse> {
    return this.http.get<AreaStatsResponse>(`${this.apiUrl}/area-stats`);
  }

  /**
   * Actualiza el estado de un archivo
   */
  updateFileStatus(fileId: string, status: string, notes?: string): Observable<FileStatus> {
    return this.http.patch<any>(`${this.apiUrl}/${fileId}/status`, { status, notes })
      .pipe(
        map(response => response.data as FileStatus)
      );
  }

  /**
   * Prepara datos para la visualización en formato D3
   */
  preparePuzzleData(metrics: FileMetricsResponse): PuzzlePiece[] {
    if (!metrics || !metrics.data || !metrics.data.puzzleItems) {
      return [];
    }
    return metrics.data.puzzleItems.map(item => ({
      id: item._id,
      label: item.name,
      value: item.isMissingFilesNode ? item.missingFiles : 1,
      color: this.getNodeColor(item),
      status: item.status,
      type: item.type || 'file',
      path: item.folderPath || '',
      expected: item.expectedFiles,
      existing: item.existingFiles,
      isArea: item.type === 'area',
      isSubarea: item.type === 'subarea',
      isMissingFilesNode: item.isMissingFilesNode || false,
      weight: item.weight || 1
    }));
  }

  /**
   * Determina el color del nodo según su estado
   */
  private getNodeColor(item: any): string {
    if (item.isMissingFilesNode) {
      return '#e74c3c'; // Rojo para archivos faltantes
    }
    
    switch (item.status) {
      case 'procesado': return '#2ecc71'; // Verde
      case 'pendiente': return '#e74c3c'; // Rojo
      case 'procesando': return '#3498db'; // Azul
      case 'error': return '#f39c12'; // Naranja
      case 'faltante': return '#e74c3c'; // Rojo
      default: return '#95a5a6'; // Gris
    }
  }
} 