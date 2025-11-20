import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SFTPFile {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: number | null;
  permissions: string | null;
  path: string;
}

export interface SFTPStatus {
  success: boolean;
  connected: boolean;
  host?: string;
  port?: string;
  rootDirectory?: string;
}

export interface SFTPListResponse {
  success: boolean;
  path: string;
  files: SFTPFile[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SFTPService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene el estado de conexión del servidor SFTP
   */
  getStatus(): Observable<SFTPStatus> {
    return this.apiService.get<SFTPStatus>('/files/sftp-status');
  }

  /**
   * Lista el contenido de un directorio remoto
   * @param path Ruta del directorio (ej: "/", "/uploads", "/uploads/companyId")
   */
  listDirectory(path: string): Observable<SFTPListResponse> {
    const params = new HttpParams().set('path', path);
    return this.apiService.get<SFTPListResponse>('/files/sftp-list', params);
  }
}

