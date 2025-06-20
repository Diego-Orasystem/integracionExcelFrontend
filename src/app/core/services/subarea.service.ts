import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { Subarea } from '../models/subarea.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SubareaService {
  private endpoint = '/subareas';

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }

  getSubareas(areaId?: string): Observable<any> {
    let url;
    
    // Si tenemos un areaId, usar el endpoint de áreas para obtener las subáreas
    if (areaId) {
      url = `/areas/${areaId}/subareas`;
    } else {
      // De lo contrario, usar el endpoint general de subáreas
      url = this.endpoint;
    }
    
    console.log(`SubareaService: Obteniendo subáreas con URL: ${url}`);
    
    return this.apiService.get(url).pipe(
      tap(response => {
        console.log('SubareaService: Respuesta de getSubareas:', response);
      }),
      catchError(error => {
        console.error('SubareaService: Error en getSubareas:', error);
        throw error;
      })
    );
  }

  getSubarea(id: string): Observable<any> {
    console.log(`SubareaService: Obteniendo subárea con ID: ${id}`);
    return this.apiService.get(`${this.endpoint}/${id}`);
  }

  createSubarea(subarea: Partial<Subarea>): Observable<any> {
    console.log('SubareaService: Creando subárea:', subarea);
    
    // Usar el endpoint correcto para crear subáreas: /areas/:areaId/subareas
    if (subarea.areaId) {
      const url = `/areas/${subarea.areaId}/subareas`;
      return this.apiService.post(url, subarea);
    } else {
      console.error('SubareaService: No se puede crear una subárea sin areaId');
      throw new Error('Se requiere areaId para crear una subárea');
    }
  }

  updateSubarea(id: string, subarea: Partial<Subarea>): Observable<any> {
    console.log(`SubareaService: Actualizando subárea ${id}:`, subarea);
    return this.apiService.put(`${this.endpoint}/${id}`, subarea);
  }

  deleteSubarea(id: string, force: boolean = false): Observable<any> {
    const url = force ? `${this.endpoint}/${id}?force=true` : `${this.endpoint}/${id}`;
    console.log(`SubareaService: Eliminando subárea con URL: ${url}`);
    return this.apiService.delete(url);
  }

  assignResponsible(subareaId: string, responsibleUserId: string): Observable<any> {
    console.log(`SubareaService: Asignando responsable ${responsibleUserId} a subárea ${subareaId}`);
    return this.apiService.post(`${this.endpoint}/${subareaId}/assign-responsible`, { responsibleUserId });
  }
} 