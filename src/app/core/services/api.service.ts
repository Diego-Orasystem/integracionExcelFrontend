import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('ApiService inicializado con baseUrl:', this.baseUrl);
  }

  // Método para obtener encabezados con autorización
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`GET Request a: ${url} [URL completa]`, params ? `Parámetros: ${JSON.stringify(params)}` : '');
    
    return this.http.get<T>(url, { 
      params,
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log(`Respuesta GET de ${endpoint}:`, response)),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`POST Request a: ${url}`, `Datos: ${this.formatLogData(data)}`);
    
    // No usar encabezados personalizados para FormData
    if (data instanceof FormData) {
      // Para FormData, solo añadir Authorization, no Content-Type
      const token = this.authService.getToken();
      let headers = new HttpHeaders();
      
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      
      return this.http.post<T>(url, data, { headers }).pipe(
        tap(response => console.log(`Respuesta POST de ${endpoint}:`, response)),
        catchError(this.handleError)
      );
    }
    
    return this.http.post<T>(url, data, { headers: this.getHeaders() }).pipe(
      tap(response => console.log(`Respuesta POST de ${endpoint}:`, response)),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`PUT Request a: ${url}`, `Datos: ${this.formatLogData(data)}`);
    
    return this.http.put<T>(url, data, { headers: this.getHeaders() }).pipe(
      tap(response => console.log(`Respuesta PUT de ${endpoint}:`, response)),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`DELETE Request a: ${url}`);
    
    return this.http.delete<T>(url, { headers: this.getHeaders() }).pipe(
      tap(response => console.log(`Respuesta DELETE de ${endpoint}:`, response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      console.error(`Error del cliente: ${error.error.message}`);
    } else {
      // Error del lado del servidor
      console.error(`Código de error: ${error.status}`);
      console.error(`Cuerpo del error:`, error.error);
    }
    
    // Devolver un observable con el mensaje de error
    return throwError(() => error);
  }

  private formatLogData(data: any): string {
    if (data instanceof FormData) {
      // Para FormData, extraemos las claves manualmente
      const formDataEntries: string[] = [];
      // Usamos forEach que está disponible en FormData
      data.forEach((value, key) => {
        if (value instanceof File) {
          formDataEntries.push(`${key}: File[name=${value.name}, type=${value.type}, size=${value.size}]`);
        } else {
          formDataEntries.push(`${key}: ${value}`);
        }
      });
      return `FormData{${formDataEntries.join(', ')}}`;
    }
    
    try {
      return JSON.stringify(data);
    } catch (e) {
      return String(data);
    }
  }
} 