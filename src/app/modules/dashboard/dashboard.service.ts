import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { 
  DashboardStats, 
  ChartData, 
  ActivityLog, 
  RecentFile 
} from './models/dashboard.model';

// Interfaces para los datos de visualización
export interface AreaData {
  id: string;
  name: string;
  totalFiles: number;
  existingFiles: number;
  pendingFiles: number;
  responsible: string;
  responsibleEmail?: string;
  completionRate: number;
  subAreas: SubAreaData[];
  expanded?: boolean;
  companyId?: string;
  companyName?: string;
}

export interface SubAreaData {
  id: string;
  name: string;
  totalFiles: number;
  existingFiles: number;
  pendingFiles: number;
  responsible: string;
  responsibleEmail?: string;
  completionRate: number;
  expanded?: boolean;
}

export interface VisualizationData {
  areas: AreaData[];
  summary: {
    totalFiles: number;
    existingFiles: number;
    pendingFiles: number;
    completionRate: number;
  };
  companies?: {
    id: string;
    name: string;
    totalFiles: number;
    existingFiles: number;
    pendingFiles: number;
    completionRate: number;
  }[];
}

export interface TreemapData {
  name: string;
  value: number;
  children: {
    name: string;
    value: number;
    completionRate: number;
    responsible: string;
    data: any;
    isCompany?: boolean;
    companyId?: string;
    children: {
      name: string;
      value: number;
      completionRate: number;
      responsible: string;
      data: any;
      children?: {
        name: string;
        value: number;
        completionRate: number;
        responsible: string;
        data: any;
      }[];
    }[];
  }[];
}

export interface HexagonData {
  nodes: {
    id: string;
    name: string;
    value: number;
    completionRate: number;
    responsible: string;
    type: 'center' | 'company' | 'area' | 'subarea';
    parentId?: string;
    companyId?: string;
    data: any;
  }[];
  links: {
    source: string;
    target: string;
    value: number;
  }[];
}

export interface RadialTreeData {
  name: string;
  value: number;
  children: {
    name: string;
    value: number;
    isCompany?: boolean;
    data: {
      completionRate: number;
      responsible: string;
      [key: string]: any;
    };
    children: {
      name: string;
      value: number;
      data: {
        completionRate: number;
        responsible: string;
        [key: string]: any;
      };
      children?: {
        name: string;
        value: number;
        data: {
          completionRate: number;
          responsible: string;
          [key: string]: any;
        };
      }[];
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las estadísticas globales del dashboard desde la API
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene estadísticas para una compañía específica
   */
  getCompanyStats(companyId: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener estadísticas de compañía:', error);
          // En caso de error, devolvemos datos simulados
          const stats = this.getFallbackCompanyStats();
          return of(stats);
        })
      );
  }

  /**
   * Obtiene estadísticas para un área específica del usuario
   */
  getUserAreaStats(userId: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats/user/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener estadísticas de usuario:', error);
          // En caso de error, devolvemos datos simulados
          const stats = this.getFallbackUserStats();
          return of(stats);
        })
      );
  }

  /**
   * Obtiene datos para el gráfico de archivos procesados por mes
   */
  getMonthlyProcessedData(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/dashboard/chart/monthly`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene datos de gráfico para una compañía específica
   */
  getCompanyChartData(companyId: string): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/dashboard/chart/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener datos de gráfico de compañía:', error);
          // En caso de error, devolvemos datos simulados
          return of(this.getFallbackCompanyChartData());
        })
      );
  }

  /**
   * Obtiene los últimos registros de actividad global
   */
  getRecentActivity(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/dashboard/activity`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los registros de actividad de una compañía específica
   */
  getCompanyActivity(companyId: string): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/dashboard/activity/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener actividad de compañía:', error);
          return of(this.getFallbackCompanyLogs());
        })
      );
  }

  /**
   * Obtiene la actividad relacionada con un usuario específico
   */
  getUserActivity(userId: string): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/dashboard/activity/user/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener actividad de usuario:', error);
          return of(this.getFallbackUserLogs());
        })
      );
  }

  /**
   * Obtiene los archivos recientes a nivel global
   */
  getRecentFiles(): Observable<RecentFile[]> {
    return this.http.get<RecentFile[]>(`${this.apiUrl}/dashboard/files/recent`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los archivos recientes de una compañía específica
   */
  getCompanyRecentFiles(companyId: string): Observable<RecentFile[]> {
    return this.http.get<RecentFile[]>(`${this.apiUrl}/dashboard/files/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener archivos recientes de compañía:', error);
          return of(this.getFallbackCompanyFiles());
        })
      );
  }

  /**
   * Obtiene los archivos relacionados con un usuario específico
   */
  getUserFiles(userId: string): Observable<RecentFile[]> {
    return this.http.get<RecentFile[]>(`${this.apiUrl}/dashboard/files/user/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener archivos de usuario:', error);
          return of(this.getFallbackUserFiles());
        })
      );
  }

  /**
   * Maneja los errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error al comunicarse con el servidor.';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}, Mensaje: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Datos de respaldo para estadísticas de compañía
   */
  getFallbackCompanyStats(): DashboardStats {
    const today = new Date();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    
    const users = 12 + Math.floor(Math.random() * 8);
    const filesTotal = 68 + Math.floor(Math.random() * 15);
    const monthlyFiles = 32 + Math.floor(Math.random() * 10);
    const dailyAverage = +(monthlyFiles / daysInMonth).toFixed(1);
    const processedToday = Math.min(Math.floor(dailyAverage * (0.7 + Math.random() * 0.6)), 15);
    
    return {
      companies: 1, // Una sola compañía
      users: users,
      files: filesTotal,
      processedToday: processedToday,
      currentMonth: monthlyFiles,
      dailyAverage: dailyAverage
    };
  }

  /**
   * Datos de respaldo para estadísticas de usuario
   */
  getFallbackUserStats(): DashboardStats {
    const today = new Date();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    
    const users = 4 + Math.floor(Math.random() * 3);
    const filesTotal = 25 + Math.floor(Math.random() * 10);
    const monthlyFiles = 12 + Math.floor(Math.random() * 8);
    const dailyAverage = +(monthlyFiles / daysInMonth).toFixed(1);
    const processedToday = Math.min(Math.floor(dailyAverage * (0.7 + Math.random() * 0.6)), 5);
    
    return {
      companies: 1, // Una sola compañía
      users: users,
      files: filesTotal,
      processedToday: processedToday,
      currentMonth: monthlyFiles,
      dailyAverage: dailyAverage
    };
  }

  /**
   * Datos de respaldo para gráfico de compañía
   */
  getFallbackCompanyChartData(): ChartData {
    const months = [];
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('es-ES', { month: 'long' });
      months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
      
      const base = 20 + Math.floor(Math.random() * 15);
      const trend = i * 3;
      const seasonal = i % 2 === 0 ? 5 : -3;
      const random = Math.floor(Math.random() * 8);
      
      data.push(base + trend + seasonal + random);
    }
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Archivos procesados',
          data: data,
          backgroundColor: 'rgba(78, 115, 223, 0.5)',
          borderColor: 'rgb(78, 115, 223)',
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Datos de respaldo para archivos de compañía
   */
  getFallbackCompanyFiles(): RecentFile[] {
    const names = ['Reporte-Ventas', 'Inventario', 'Presupuesto', 'Nomina', 'Marketing', 'Proyecciones'];
    const users = ['Carlos Méndez', 'Ana Sánchez', 'Roberto García', 'Lucía Torres'];
    const statuses = ['processed', 'pending', 'error'];
    const files: RecentFile[] = [];
    
    // Generar entre 5 y 7 archivos simulados
    const numFiles = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numFiles; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      date.setHours(date.getHours() - Math.floor(Math.random() * 24));
      
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const statusDistribution = { processed: 0.6, pending: 0.3, error: 0.1 };
      const statusProbability = Math.random();
      let status = 'processed';
      
      if (statusProbability > 0.6) {
        status = statusProbability > 0.9 ? 'error' : 'pending';
      }
      
      files.push({
        id: `file-${i + 1}`,
        name: `${names[i % names.length]}-${Math.floor(Math.random() * 100)}.xlsx`,
        size: Math.floor(Math.random() * 5000) * 1024,
        uploadedBy: users[Math.floor(Math.random() * users.length)],
        uploadedAt: date.toISOString(),
        status: status as any
      });
    }
    
    // Ordenar por fecha más reciente primero
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  /**
   * Datos de respaldo para archivos de usuario
   */
  getFallbackUserFiles(): RecentFile[] {
    return this.getFallbackCompanyFiles().slice(0, 4);
  }

  /**
   * Datos de respaldo para logs de compañía
   */
  getFallbackCompanyLogs(): ActivityLog[] {
    const users = ['Carlos Méndez', 'Ana Sánchez', 'Roberto García', 'Lucía Torres'];
    const actions = ['subió', 'descargó', 'actualizó', 'eliminó', 'comentó en'];
    const resources = ['Reporte-Ventas-24.xlsx', 'Inventario-11.xlsx', 'Presupuesto-Q2.xlsx', 'Nomina-Mayo.xlsx'];
    const statuses = ['success', 'warning', 'error'];
    const logs: ActivityLog[] = [];
    
    // Generar entre 5 y 8 actividades simuladas
    const numLogs = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numLogs; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 3));
      date.setHours(date.getHours() - Math.floor(Math.random() * 12));
      
      const statusProbability = Math.random();
      let status = 'success';
      
      if (statusProbability > 0.7) {
        status = statusProbability > 0.9 ? 'error' : 'warning';
      }
      
      logs.push({
        id: `log-${i + 1}`,
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        timestamp: date.toISOString(),
        status: status as any
      });
    }
    
    // Ordenar por fecha más reciente primero
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Datos de respaldo para logs de usuario
   */
  getFallbackUserLogs(): ActivityLog[] {
    return this.getFallbackCompanyLogs().slice(0, 5);
  }

  /**
   * Obtiene los datos de áreas y subáreas para las visualizaciones
   */
  getAreasData(search?: string, allCompanies?: boolean): Observable<VisualizationData> {
    let url = `${this.apiUrl}/dashboard/areas`;
    const params = [];
    
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (allCompanies) {
      params.push('allCompanies=true');
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<VisualizationData>(url)
      .pipe(
        catchError(error => {
          console.error('Error al obtener datos de áreas:', error);
          // En caso de error, devolvemos los datos de ejemplo
          return of(this.getFallbackAreasData());
        })
      );
  }

  /**
   * Obtiene datos para la visualización de Treemap
   */
  getTreemapData(allCompanies?: boolean): Observable<TreemapData> {
    let url = `${this.apiUrl}/dashboard/visualizations/treemap`;
    
    if (allCompanies) {
      url += `?allCompanies=true`;
    }
    
    return this.http.get<TreemapData>(url)
      .pipe(
        catchError(error => {
          console.error('Error al obtener datos para Treemap:', error);
          // En caso de error, transformamos los datos de áreas
          return this.getAreasData(undefined, allCompanies).pipe(
            catchError(err => of(this.getFallbackAreasData())),
            // Transformar datos al formato de treemap
            map(data => this.transformToTreemapData(data, allCompanies))
          );
        })
      );
  }

  /**
   * Obtiene datos para la visualización de Hexágonos
   */
  getHexagonData(allCompanies?: boolean): Observable<HexagonData> {
    let url = `${this.apiUrl}/dashboard/visualizations/hexagons`;
    
    if (allCompanies) {
      url += `?allCompanies=true`;
    }
    
    return this.http.get<HexagonData>(url)
      .pipe(
        catchError(error => {
          console.error('Error al obtener datos para Hexágonos:', error);
          // En caso de error, transformamos los datos de áreas
          return this.getAreasData(undefined, allCompanies).pipe(
            catchError(err => of(this.getFallbackAreasData())),
            // Transformar datos al formato de hexágonos
            map(data => this.transformToHexagonData(data, allCompanies))
          );
        })
      );
  }

  /**
   * Obtiene datos para la visualización de Árbol Radial
   */
  getRadialTreeData(allCompanies?: boolean): Observable<RadialTreeData> {
    let url = `${this.apiUrl}/dashboard/visualizations/radialtree`;
    
    if (allCompanies) {
      url += `?allCompanies=true`;
    }
    
    return this.http.get<RadialTreeData>(url)
      .pipe(
        catchError(error => {
          console.error('Error al obtener datos para Árbol Radial:', error);
          // En caso de error, transformamos los datos de áreas
          return this.getAreasData(undefined, allCompanies).pipe(
            catchError(err => of(this.getFallbackAreasData())),
            // Transformar datos al formato de árbol radial
            map(data => this.transformToRadialTreeData(data, allCompanies))
          );
        })
      );
  }

  /**
   * Datos de respaldo para áreas y subáreas
   */
  getFallbackAreasData(): VisualizationData {
    // Si intentamos simular datos para todas las empresas, devolver estructura multinivel
    const showAllCompanies = localStorage.getItem('userRole') === 'admin';
    
    if (showAllCompanies) {
      console.log('Generando datos simulados para administrador (todas las empresas)');
      return this.getFallbackMultiCompanyData();
    }
    
    // Datos para una sola empresa
    return {
      areas: [
        {
          id: '1',
          name: 'Recursos Humanos',
          totalFiles: 45,
          existingFiles: 38,
          pendingFiles: 7,
          responsible: 'Ana Martínez',
          responsibleEmail: 'ana.martinez@empresa.com',
          completionRate: 84,
          subAreas: [
            {
              id: '1-1',
              name: 'Nóminas',
              totalFiles: 12,
              existingFiles: 12,
              pendingFiles: 0,
              responsible: 'Carlos López',
              responsibleEmail: 'carlos.lopez@empresa.com',
              completionRate: 100
            },
            {
              id: '1-2',
              name: 'Reclutamiento',
              totalFiles: 18,
              existingFiles: 15,
              pendingFiles: 3,
              responsible: 'Laura Sánchez',
              responsibleEmail: 'laura.sanchez@empresa.com',
              completionRate: 83
            },
            {
              id: '1-3',
              name: 'Capacitación',
              totalFiles: 15,
              existingFiles: 11,
              pendingFiles: 4,
              responsible: 'Ana Martínez',
              responsibleEmail: 'ana.martinez@empresa.com',
              completionRate: 73
            }
          ]
        },
        {
          id: '2',
          name: 'Finanzas',
          totalFiles: 72,
          existingFiles: 68,
          pendingFiles: 4,
          responsible: 'Miguel Rodríguez',
          responsibleEmail: 'miguel.rodriguez@empresa.com',
          completionRate: 94,
          subAreas: [
            {
              id: '2-1',
              name: 'Contabilidad',
              totalFiles: 32,
              existingFiles: 30,
              pendingFiles: 2,
              responsible: 'Sofía Hernández',
              responsibleEmail: 'sofia.hernandez@empresa.com',
              completionRate: 94
            },
            {
              id: '2-2',
              name: 'Presupuestos',
              totalFiles: 28,
              existingFiles: 28,
              pendingFiles: 0,
              responsible: 'Miguel Rodríguez',
              responsibleEmail: 'miguel.rodriguez@empresa.com',
              completionRate: 100
            },
            {
              id: '2-3',
              name: 'Tesorería',
              totalFiles: 12,
              existingFiles: 10,
              pendingFiles: 2,
              responsible: 'Javier González',
              responsibleEmail: 'javier.gonzalez@empresa.com',
              completionRate: 83
            }
          ]
        },
        {
          id: '3',
          name: 'Marketing',
          totalFiles: 38,
          existingFiles: 25,
          pendingFiles: 13,
          responsible: 'Paula García',
          responsibleEmail: 'paula.garcia@empresa.com',
          completionRate: 66,
          subAreas: [
            {
              id: '3-1',
              name: 'Digital',
              totalFiles: 18,
              existingFiles: 12,
              pendingFiles: 6,
              responsible: 'Diana Torres',
              responsibleEmail: 'diana.torres@empresa.com',
              completionRate: 67
            },
            {
              id: '3-2',
              name: 'Tradicional',
              totalFiles: 12,
              existingFiles: 8,
              pendingFiles: 4,
              responsible: 'Paula García',
              responsibleEmail: 'paula.garcia@empresa.com',
              completionRate: 67
            },
            {
              id: '3-3',
              name: 'Eventos',
              totalFiles: 8,
              existingFiles: 5,
              pendingFiles: 3,
              responsible: 'Roberto Díaz',
              responsibleEmail: 'roberto.diaz@empresa.com',
              completionRate: 63
            }
          ]
        }
      ],
      summary: {
        totalFiles: 155,
        existingFiles: 131,
        pendingFiles: 24,
        completionRate: 84
      }
    };
  }

  /**
   * Datos simulados para múltiples empresas (vista de administrador)
   */
  private getFallbackMultiCompanyData(): VisualizationData {
    console.log('Generando datos de múltiples empresas para administrador');
    
    // Crear tres empresas con sus áreas y subáreas
    const companies = [
      {
        id: 'comp1',
        name: 'Empresa ABC',
        totalFiles: 155,
        existingFiles: 131,
        pendingFiles: 24,
        completionRate: 84
      },
      {
        id: 'comp2',
        name: 'Empresa XYZ',
        totalFiles: 210,
        existingFiles: 190,
        pendingFiles: 20,
        completionRate: 90
      },
      {
        id: 'comp3',
        name: 'Empresa 123',
        totalFiles: 98,
        existingFiles: 60,
        pendingFiles: 38,
        completionRate: 61
      }
    ];
    
    // Crear áreas para cada empresa
    const allAreas = [];
    
    // Áreas para Empresa ABC
    const areasABC = [
      {
        id: 'comp1-1',
        name: 'Recursos Humanos',
        totalFiles: 45,
        existingFiles: 38,
        pendingFiles: 7,
        responsible: 'Ana Martínez',
        responsibleEmail: 'ana.martinez@empresaabc.com',
        completionRate: 84,
        companyId: 'comp1',
        companyName: 'Empresa ABC',
        subAreas: [
          {
            id: 'comp1-1-1',
            name: 'Nóminas',
            totalFiles: 12,
            existingFiles: 12,
            pendingFiles: 0,
            responsible: 'Carlos López',
            responsibleEmail: 'carlos.lopez@empresaabc.com',
            completionRate: 100
          },
          {
            id: 'comp1-1-2',
            name: 'Reclutamiento',
            totalFiles: 18,
            existingFiles: 15,
            pendingFiles: 3,
            responsible: 'Laura Sánchez',
            responsibleEmail: 'laura.sanchez@empresaabc.com',
            completionRate: 83
          },
          {
            id: 'comp1-1-3',
            name: 'Capacitación',
            totalFiles: 15,
            existingFiles: 11,
            pendingFiles: 4,
            responsible: 'Ana Martínez',
            responsibleEmail: 'ana.martinez@empresaabc.com',
            completionRate: 73
          }
        ]
      },
      {
        id: 'comp1-2',
        name: 'Finanzas',
        totalFiles: 72,
        existingFiles: 68,
        pendingFiles: 4,
        responsible: 'Miguel Rodríguez',
        responsibleEmail: 'miguel.rodriguez@empresaabc.com',
        completionRate: 94,
        companyId: 'comp1',
        companyName: 'Empresa ABC',
        subAreas: [
          {
            id: 'comp1-2-1',
            name: 'Contabilidad',
            totalFiles: 32,
            existingFiles: 30,
            pendingFiles: 2,
            responsible: 'Sofía Hernández',
            responsibleEmail: 'sofia.hernandez@empresaabc.com',
            completionRate: 94
          },
          {
            id: 'comp1-2-2',
            name: 'Presupuestos',
            totalFiles: 28,
            existingFiles: 28,
            pendingFiles: 0,
            responsible: 'Miguel Rodríguez',
            responsibleEmail: 'miguel.rodriguez@empresaabc.com',
            completionRate: 100
          }
        ]
      }
    ];
    
    // Áreas para Empresa XYZ
    const areasXYZ = [
      {
        id: 'comp2-1',
        name: 'Tecnología',
        totalFiles: 95,
        existingFiles: 90,
        pendingFiles: 5,
        responsible: 'Fernando Sánchez',
        responsibleEmail: 'fernando.sanchez@empresaxyz.com',
        completionRate: 95,
        companyId: 'comp2',
        companyName: 'Empresa XYZ',
        subAreas: [
          {
            id: 'comp2-1-1',
            name: 'Desarrollo',
            totalFiles: 45,
            existingFiles: 42,
            pendingFiles: 3,
            responsible: 'Alejandra Vega',
            responsibleEmail: 'alejandra.vega@empresaxyz.com',
            completionRate: 93
          },
          {
            id: 'comp2-1-2',
            name: 'Infraestructura',
            totalFiles: 50,
            existingFiles: 48,
            pendingFiles: 2,
            responsible: 'Marcos Torres',
            responsibleEmail: 'marcos.torres@empresaxyz.com',
            completionRate: 96
          }
        ]
      },
      {
        id: 'comp2-2',
        name: 'Comercial',
        totalFiles: 115,
        existingFiles: 100,
        pendingFiles: 15,
        responsible: 'Patricia Gómez',
        responsibleEmail: 'patricia.gomez@empresaxyz.com',
        completionRate: 87,
        companyId: 'comp2',
        companyName: 'Empresa XYZ',
        subAreas: [
          {
            id: 'comp2-2-1',
            name: 'Ventas',
            totalFiles: 65,
            existingFiles: 60,
            pendingFiles: 5,
            responsible: 'Hugo Márquez',
            responsibleEmail: 'hugo.marquez@empresaxyz.com',
            completionRate: 92
          },
          {
            id: 'comp2-2-2',
            name: 'Atención al Cliente',
            totalFiles: 50,
            existingFiles: 40,
            pendingFiles: 10,
            responsible: 'Carmen Ortiz',
            responsibleEmail: 'carmen.ortiz@empresaxyz.com',
            completionRate: 80
          }
        ]
      }
    ];
    
    // Áreas para Empresa 123
    const areas123 = [
      {
        id: 'comp3-1',
        name: 'Operaciones',
        totalFiles: 98,
        existingFiles: 60,
        pendingFiles: 38,
        responsible: 'Roberto Núñez',
        responsibleEmail: 'roberto.nunez@empresa123.com',
        completionRate: 61,
        companyId: 'comp3',
        companyName: 'Empresa 123',
        subAreas: [
          {
            id: 'comp3-1-1',
            name: 'Logística',
            totalFiles: 58,
            existingFiles: 30,
            pendingFiles: 28,
            responsible: 'Marta Jiménez',
            responsibleEmail: 'marta.jimenez@empresa123.com',
            completionRate: 52
          },
          {
            id: 'comp3-1-2',
            name: 'Producción',
            totalFiles: 40,
            existingFiles: 30,
            pendingFiles: 10,
            responsible: 'Daniel Ruiz',
            responsibleEmail: 'daniel.ruiz@empresa123.com',
            completionRate: 75
          }
        ]
      }
    ];
    
    // Combinar todas las áreas
    allAreas.push(...areasABC, ...areasXYZ, ...areas123);
    
    // Calcular resumen global
    const totalFiles = companies.reduce((sum, company) => sum + company.totalFiles, 0);
    const existingFiles = companies.reduce((sum, company) => sum + company.existingFiles, 0);
    const pendingFiles = companies.reduce((sum, company) => sum + company.pendingFiles, 0);
    const completionRate = Math.round((existingFiles / totalFiles) * 100);
    
    return {
      areas: allAreas,
      companies: companies,
      summary: {
        totalFiles,
        existingFiles,
        pendingFiles,
        completionRate
      }
    };
  }

  /**
   * Transforma los datos de áreas al formato requerido para Treemap
   */
  private transformToTreemapData(data: VisualizationData, showAllCompanies?: boolean): TreemapData {
    const result: TreemapData = {
      name: "Áreas",
      value: 0,
      children: []
    };

    // Si tenemos datos de empresas y se solicita ver todas
    if (showAllCompanies && data.companies && data.companies.length > 0) {
      result.name = "Sistema";
      
      // Agrupar áreas por compañía
      data.companies.forEach(company => {
        const companyAreas = data.areas.filter(area => area.companyId === company.id);
        
        const companyNode = {
          name: company.name,
          value: company.totalFiles,
          completionRate: company.completionRate,
          responsible: '',
          isCompany: true,
          companyId: company.id,
          data: company,
          children: companyAreas.map(area => ({
            name: area.name,
            value: area.totalFiles,
            completionRate: area.completionRate,
            responsible: area.responsible,
            data: area,
            children: area.subAreas.map(subarea => ({
              name: subarea.name,
              value: subarea.totalFiles,
              completionRate: subarea.completionRate,
              responsible: subarea.responsible,
              data: subarea
            }))
          }))
        };
        
        result.children.push(companyNode);
      });
      
      return result;
    }
    
    // Caso original: solo áreas de una empresa
    data.areas.forEach(area => {
      const areaNode = {
        name: area.name,
        value: area.totalFiles,
        completionRate: area.completionRate,
        responsible: area.responsible,
        data: area,
        children: area.subAreas.map(subarea => ({
          name: subarea.name,
          value: subarea.totalFiles,
          completionRate: subarea.completionRate,
          responsible: subarea.responsible,
          data: subarea
        }))
      };
      
      result.children.push(areaNode);
    });
    
    return result;
  }

  /**
   * Transforma los datos de áreas al formato requerido para Hexágonos
   */
  private transformToHexagonData(data: VisualizationData, showAllCompanies?: boolean): HexagonData {
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Nodo central
    nodes.push({
      id: 'center',
      name: showAllCompanies ? 'Sistema' : 'Organización',
      value: data.summary.totalFiles,
      completionRate: data.summary.completionRate,
      responsible: '',
      type: 'center'
    });
    
    // Si estamos mostrando todas las empresas
    if (showAllCompanies && data.companies && data.companies.length > 0) {
      // Agregar empresas como nodos
      data.companies.forEach(company => {
        nodes.push({
          id: `company-${company.id}`,
          name: company.name,
          value: company.totalFiles,
          completionRate: company.completionRate,
          responsible: '',
          type: 'company',
          data: company
        });
        
        // Link del centro a cada empresa
        links.push({
          source: 'center',
          target: `company-${company.id}`,
          value: company.totalFiles
        });
        
        // Filtrar áreas de esta empresa
        const companyAreas = data.areas.filter(area => area.companyId === company.id);
        
        // Agregar áreas
        companyAreas.forEach(area => {
          nodes.push({
            id: area.id,
            name: area.name,
            value: area.totalFiles,
            completionRate: area.completionRate,
            responsible: area.responsible,
            type: 'area',
            companyId: company.id,
            parentId: `company-${company.id}`,
            data: area
          });
          
          // Link de empresa a área
          links.push({
            source: `company-${company.id}`,
            target: area.id,
            value: area.totalFiles
          });
          
          // Agregar subáreas
          area.subAreas.forEach(subarea => {
            nodes.push({
              id: subarea.id,
              name: subarea.name,
              value: subarea.totalFiles,
              completionRate: subarea.completionRate,
              responsible: subarea.responsible,
              type: 'subarea',
              companyId: company.id,
              parentId: area.id,
              data: subarea
            });
            
            // Link de área a subárea
            links.push({
              source: area.id,
              target: subarea.id,
              value: subarea.totalFiles
            });
          });
        });
      });
      
      return { nodes, links };
    }
    
    // Estructura original (una sola empresa)
    // Agregar áreas
    data.areas.forEach(area => {
      nodes.push({
        id: area.id,
        name: area.name,
        value: area.totalFiles,
        completionRate: area.completionRate,
        responsible: area.responsible,
        type: 'area',
        data: area
      });
      
      // Link del centro a cada área
      links.push({
        source: 'center',
        target: area.id,
        value: area.totalFiles
      });
      
      // Agregar subáreas
      area.subAreas.forEach(subarea => {
        nodes.push({
          id: subarea.id,
          name: subarea.name,
          value: subarea.totalFiles,
          completionRate: subarea.completionRate,
          responsible: subarea.responsible,
          type: 'subarea',
          parentId: area.id,
          data: subarea
        });
        
        // Link de área a subárea
        links.push({
          source: area.id,
          target: subarea.id,
          value: subarea.totalFiles
        });
      });
    });
    
    return { nodes, links };
  }

  /**
   * Transforma los datos de áreas al formato requerido para Árbol Radial
   */
  private transformToRadialTreeData(data: VisualizationData, showAllCompanies?: boolean): RadialTreeData {
    const result: RadialTreeData = {
      name: showAllCompanies ? "Sistema" : "Áreas",
      value: 0,
      children: []
    };
    
    // Si estamos mostrando todas las empresas
    if (showAllCompanies && data.companies && data.companies.length > 0) {
      data.companies.forEach(company => {
        // Filtrar áreas de esta empresa
        const companyAreas = data.areas.filter(area => area.companyId === company.id);
        
        const companyNode = {
          name: company.name,
          value: company.totalFiles,
          isCompany: true,
          data: {
            completionRate: company.completionRate,
            responsible: '',
            companyId: company.id,
            existingFiles: company.existingFiles,
            pendingFiles: company.pendingFiles
          },
          children: companyAreas.map(area => ({
            name: area.name,
            value: area.totalFiles,
            data: {
              completionRate: area.completionRate,
              responsible: area.responsible,
              existingFiles: area.existingFiles,
              pendingFiles: area.pendingFiles,
              responsibleEmail: area.responsibleEmail
            },
            children: area.subAreas.map(subarea => ({
              name: subarea.name,
              value: subarea.totalFiles,
              data: {
                completionRate: subarea.completionRate,
                responsible: subarea.responsible,
                existingFiles: subarea.existingFiles,
                pendingFiles: subarea.pendingFiles,
                responsibleEmail: subarea.responsibleEmail
              }
            }))
          }))
        };
        
        result.children.push(companyNode);
      });
      
      return result;
    }
    
    // Caso original: solo áreas de una empresa
    data.areas.forEach(area => {
      const areaNode = {
        name: area.name,
        value: area.totalFiles,
        data: {
          completionRate: area.completionRate,
          responsible: area.responsible,
          existingFiles: area.existingFiles,
          pendingFiles: area.pendingFiles,
          responsibleEmail: area.responsibleEmail
        },
        children: area.subAreas.map(subarea => ({
          name: subarea.name,
          value: subarea.totalFiles,
          data: {
            completionRate: subarea.completionRate,
            responsible: subarea.responsible,
            existingFiles: subarea.existingFiles,
            pendingFiles: subarea.pendingFiles,
            responsibleEmail: subarea.responsibleEmail
          }
        }))
      };
      
      result.children.push(areaNode);
    });
    
    return result;
  }
} 