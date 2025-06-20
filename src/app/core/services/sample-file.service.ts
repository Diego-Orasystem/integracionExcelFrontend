import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SampleFile } from '../models/subarea.model';
import { FileUploadProgress } from '../models/file-upload-progress.model';
import { ApiService } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SampleFileService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Sube un archivo al servidor con seguimiento de progreso
   */
  uploadFile(formData: FormData): Observable<FileUploadProgress> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}files/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map(event => {
        let result: FileUploadProgress = { progress: 0 };
        
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              result.progress = Math.round(100 * event.loaded / event.total);
            }
            break;
          case HttpEventType.Response:
            result = { 
              progress: 100,
              data: event.body?.data
            };
            break;
        }
        
        return result;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Sube un archivo al servidor con un nombre personalizado
   */
  uploadFileWithCustomName(file: File, customName: string, description?: string): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customName', customName);
    
    if (description) {
      formData.append('description', description);
    }
    
    return this.uploadFile(formData);
  }

  /**
   * Obtiene todos los archivos de ejemplo de una subárea
   */
  getSampleFiles(subareaId: string): Observable<SampleFile[]> {
    return this.apiService.get<ApiResponse<SampleFile[]>>(
      `subareas/${subareaId}/sample-files`
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Añade un archivo de ejemplo a una subárea
   */
  addSampleFile(subareaId: string, fileData: {
    fileId: string,
    name: string,
    description?: string
  }): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(
      `subareas/${subareaId}/sample-files`,
      fileData
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Elimina un archivo de ejemplo de una subárea
   */
  removeSampleFile(subareaId: string, fileId: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(
      `subareas/${subareaId}/sample-files/${fileId}`
    ).pipe(
      map(() => void 0)
    );
  }

  /**
   * Descarga un archivo
   */
  downloadFile(fileId: string): void {
    const token = localStorage.getItem('auth_token');
    window.location.href = `${environment.apiUrl}files/${fileId}/download?token=${token}`;
  }
} 