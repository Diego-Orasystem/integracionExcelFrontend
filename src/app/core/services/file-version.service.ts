import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileVersionService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  /**
   * Obtiene todas las versiones de un archivo
   */
  getFileVersions(fileId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${fileId}/versions`);
  }

  /**
   * Sube una nueva versión de un archivo
   */
  uploadNewVersion(fileId: string, file: File, description?: string, customName?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    
    if (description) {
      formData.append('description', description);
    }
    
    if (customName) {
      formData.append('customName', customName);
    }
    
    return this.http.post<any>(`${this.apiUrl}/versions`, formData);
  }

  /**
   * Descarga una versión específica de un archivo
   */
  downloadVersion(versionId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/versions/${versionId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Revierte a una versión anterior
   */
  revertToVersion(fileId: string, versionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${fileId}/revert/${versionId}`, {});
  }
} 