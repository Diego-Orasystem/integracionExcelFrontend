import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FilePermissionCheck {
  permitted: boolean;
  reason?: string;
}

export interface FilePermissionResponse {
  data: FilePermissionCheck;
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilePermissionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Verifica si el usuario actual tiene permiso para realizar una acción sobre un archivo
   * @param fileId ID del archivo
   * @param action Acción a verificar: 'read', 'write', 'delete', 'admin'
   */
  checkFilePermission(fileId: string, action: string = 'read'): Observable<FilePermissionResponse> {
    return this.http.get<FilePermissionResponse>(
      `${this.apiUrl}/files/${fileId}/permissions/check?action=${action}`
    );
  }

  /**
   * Verifica si el usuario tiene permiso para acceder a una ubicación específica
   * (área o subárea)
   * @param entityType Tipo de entidad ('area' o 'subarea')
   * @param entityId ID de la entidad
   * @param action Acción a verificar: 'read', 'write', etc.
   */
  checkLocationPermission(
    entityType: 'area' | 'subarea', 
    entityId: string, 
    action: string = 'read'
  ): Observable<FilePermissionResponse> {
    return this.http.get<FilePermissionResponse>(
      `${this.apiUrl}/${entityType}s/${entityId}/permissions/check?action=${action}`
    );
  }

  /**
   * Obtiene todos los permisos de un archivo específico (solo para admin)
   * @param fileId ID del archivo
   */
  getFilePermissions(fileId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/permissions`);
  }

  /**
   * Asigna un nuevo permiso a un archivo
   * @param fileId ID del archivo
   * @param permission Objeto de permiso a asignar
   */
  addFilePermission(fileId: string, permission: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/${fileId}/permissions`, permission);
  }

  /**
   * Actualiza un permiso existente
   * @param permissionId ID del permiso
   * @param data Datos a actualizar
   */
  updatePermission(permissionId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/file-permissions/${permissionId}`, data);
  }

  /**
   * Elimina un permiso
   * @param permissionId ID del permiso
   */
  deletePermission(permissionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/file-permissions/${permissionId}`);
  }
} 