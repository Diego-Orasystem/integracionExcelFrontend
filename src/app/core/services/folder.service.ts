import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Folder, FolderResponse, FoldersResponse, FolderContentResponse } from '../models/folder.model';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  constructor(private apiService: ApiService) {}

  /**
   * Crea una nueva carpeta
   * @param name Nombre de la carpeta
   * @param parentId ID de la carpeta padre (opcional para crear carpeta raíz)
   */
  createFolder(name: string, parentId?: string): Observable<FolderResponse> {
    const data = {
      name,
      parentId
    };
    return this.apiService.post<FolderResponse>('/folders', data);
  }

  /**
   * Obtiene la lista de carpetas
   * @param parentId ID de la carpeta padre (opcional)
   * @param additionalParams Parámetros adicionales para la consulta (opcional)
   * Si se proporciona parentId, lista las subcarpetas de esa carpeta
   * Si no, lista las carpetas raíz
   */
  getFolders(parentId?: string, additionalParams?: any): Observable<FoldersResponse> {
    const params: any = additionalParams || {};
    
    if (parentId) {
      params.parentId = parentId;
    }
    
    return this.apiService.get<FoldersResponse>('/folders', params);
  }
  
  /**
   * Obtiene específicamente las subcarpetas de una carpeta
   * Este método es más específico que getFolders, garantizando que solo obtiene carpetas
   * @param parentId ID de la carpeta padre
   * @param companyId ID de la compañía (opcional)
   */
  getSubfolders(parentId: string, companyId?: string): Observable<FoldersResponse> {
    const params: any = { parentId, type: 'folder' };
    
    if (companyId) {
      params.companyId = companyId;
    }
    
    console.log('Solicitando subcarpetas con parámetros:', params);
    return this.apiService.get<FoldersResponse>('/folders', params);
  }

  /**
   * Obtiene los detalles de una carpeta específica
   * @param id ID de la carpeta
   */
  getFolderDetails(id: string): Observable<FolderResponse> {
    return this.apiService.get<FolderResponse>(`/folders/${id}`);
  }

  /**
   * Obtiene la ruta completa de una carpeta
   * @param id ID de la carpeta
   * @param additionalParams Parámetros adicionales para la consulta (opcional)
   */
  getFolderPath(id: string, additionalParams?: any): Observable<any> {
    const params: any = additionalParams || {};
    return this.apiService.get<any>(`/folders/${id}/path`, params);
  }

  /**
   * Actualiza una carpeta existente
   * @param id ID de la carpeta a actualizar
   * @param data Datos a actualizar (nombre, etc.)
   */
  updateFolder(id: string, data: any): Observable<FolderResponse> {
    return this.apiService.put<FolderResponse>(`/folders/${id}`, data);
  }

  /**
   * Elimina una carpeta
   * @param id ID de la carpeta a eliminar
   */
  deleteFolder(id: string): Observable<any> {
    return this.apiService.delete<any>(`/folders/${id}`);
  }

  /**
   * Obtiene el contenido completo de una carpeta (subcarpetas y archivos)
   * @param params Parámetros para la consulta
   */
  getFolderContents(params: any): Observable<FolderContentResponse> {
    console.log('Solicitando contenido de carpeta con params:', params);
    return this.apiService.get<FolderContentResponse>('/folders/contents', params);
  }

  /**
   * Obtiene contenido para un área específica
   * Útil para usuarios responsables de área
   * @param areaId ID del área
   * @param companyId ID de la compañía (opcional)
   */
  getFoldersByArea(areaId: string, companyId?: string): Observable<FoldersResponse> {
    const params: any = { 
      areaId: areaId,
      type: 'folder'
    };
    
    if (companyId) {
      params.companyId = companyId;
    }
    
    console.log('Solicitando carpetas de área con parámetros:', JSON.stringify(params));
    return this.apiService.get<FoldersResponse>('/folders', params);
  }
} 