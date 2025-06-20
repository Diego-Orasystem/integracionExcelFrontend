import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FileUploadProgress } from '../models/file-upload-progress.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo al servidor con nombre personalizado
   */
  uploadFileWithCustomName(file: File, customName: string, folderId: string, description?: string, tags?: string): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customName', customName);
    
    // Añadir folderId (obligatorio)
    formData.append('folderId', folderId);
    
    if (description) {
      formData.append('description', description);
    }
    
    if (tags) {
      formData.append('tags', tags);
    }
    
    console.log('Enviando archivo con formData:', {
      file: file.name,
      customName,
      folderId,
      description: description || 'no hay',
      tags: tags || 'no hay'
    });
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/upload`,
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
   * Sube varios archivos con nombres personalizados
   */
  uploadMultipleFilesWithCustomNames(files: File[], customNames: string[], folderId: string): Observable<FileUploadProgress[]> {
    // Usamos un FormData para cada archivo para evitar conflictos
    const uploads = files.map((file, index) => {
      return this.uploadFileWithCustomName(file, customNames[index], folderId);
    });
    
    return new Observable<FileUploadProgress[]>(observer => {
      const results: FileUploadProgress[] = [];
      let completed = 0;
      
      uploads.forEach((upload, index) => {
        upload.subscribe({
          next: (progress) => {
            if (!results[index]) {
              results[index] = { progress: 0 };
            }
            results[index] = progress;
            observer.next([...results]);
            
            if (progress.progress === 100) {
              completed++;
              if (completed === uploads.length) {
                observer.complete();
              }
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }
} 