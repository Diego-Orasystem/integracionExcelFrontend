import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Log, LogResponse, LogsResponse, LogSearchParams } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene el listado de logs con opciones de filtrado
   * @param params Parámetros de búsqueda y filtrado
   */
  getLogs(params?: LogSearchParams): Observable<LogsResponse> {
    return this.apiService.get<LogsResponse>('/logs', params);
  }

  /**
   * Obtiene un log específico por su ID
   * @param id ID del log
   */
  getLogById(id: string): Observable<LogResponse> {
    return this.apiService.get<LogResponse>(`/logs/${id}`);
  }

  /**
   * Obtiene logs relacionados con una entidad específica
   * @param entityType Tipo de entidad (file, folder, user, company)
   * @param entityId ID de la entidad
   */
  getEntityLogs(entityType: string, entityId: string): Observable<LogsResponse> {
    return this.apiService.get<LogsResponse>('/logs', {
      entityType,
      entityId
    });
  }
} 