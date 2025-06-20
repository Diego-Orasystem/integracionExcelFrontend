import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MenuItem } from '../models/menu-item.model';
import { ApiService } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private endpoint = '/menu';

  constructor(
    private apiService: ApiService
  ) {}

  /**
   * Obtiene los elementos del menú según los permisos del usuario
   */
  getMenuItems(): Observable<MenuItem[]> {
    return this.apiService.get<ApiResponse<MenuItem[]>>(this.endpoint)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Crea un nuevo elemento de menú (solo admin)
   */
  createMenuItem(menuItem: Partial<MenuItem>): Observable<MenuItem> {
    return this.apiService.post<ApiResponse<MenuItem>>(this.endpoint, menuItem)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Actualiza un elemento de menú existente (solo admin)
   */
  updateMenuItem(id: string, menuItem: Partial<MenuItem>): Observable<MenuItem> {
    return this.apiService.put<ApiResponse<MenuItem>>(`${this.endpoint}/${id}`, menuItem)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Elimina un elemento de menú (solo admin)
   */
  deleteMenuItem(id: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`)
      .pipe(
        map(() => void 0)
      );
  }

  /**
   * Crea elementos de menú predeterminados (solo admin)
   */
  createDefaultMenuItems(): Observable<MenuItem[]> {
    return this.apiService.post<ApiResponse<MenuItem[]>>(`${this.endpoint}/default`, {})
      .pipe(
        map(response => response.data || [])
      );
  }
} 