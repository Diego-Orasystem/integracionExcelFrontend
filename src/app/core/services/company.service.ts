import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Company, 
  CompanyResponse, 
  CompaniesResponse, 
  CompanyStats,
  CompanyStatsResponse
} from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene la lista de empresas
   * @param params Parámetros de filtrado y paginación
   */
  getCompanies(params?: any): Observable<CompaniesResponse> {
    return this.apiService.get<CompaniesResponse>('/companies', params);
  }

  /**
   * Obtiene los detalles de una empresa específica
   * @param id ID de la empresa
   */
  getCompanyById(id: string): Observable<CompanyResponse> {
    return this.apiService.get<CompanyResponse>(`/companies/${id}`);
  }

  /**
   * Crea una nueva empresa
   * @param company Datos de la empresa a crear
   */
  createCompany(company: Partial<Company>): Observable<CompanyResponse> {
    return this.apiService.post<CompanyResponse>('/companies', company);
  }

  /**
   * Actualiza una empresa existente
   * @param id ID de la empresa
   * @param company Datos actualizados de la empresa
   */
  updateCompany(id: string, company: Partial<Company>): Observable<CompanyResponse> {
    return this.apiService.put<CompanyResponse>(`/companies/${id}`, company);
  }

  /**
   * Elimina una empresa
   * @param id ID de la empresa a eliminar
   */
  deleteCompany(id: string): Observable<any> {
    return this.apiService.delete<any>(`/companies/${id}`);
  }

  /**
   * Obtiene estadísticas de una empresa
   * @param id ID de la empresa
   */
  getCompanyStats(id: string): Observable<CompanyStatsResponse> {
    return this.apiService.get<CompanyStatsResponse>(`/companies/${id}/stats`);
  }

  /**
   * Actualiza la configuración SFTP de una empresa
   * @param id ID de la empresa
   * @param sftpConfig Configuración SFTP
   */
  updateSftpConfig(id: string, sftpConfig: any): Observable<CompanyResponse> {
    return this.apiService.put<CompanyResponse>(`/companies/${id}/sftp`, sftpConfig);
  }

  /**
   * Actualiza la configuración general de una empresa
   * @param id ID de la empresa
   * @param settings Configuración general
   */
  updateSettings(id: string, settings: any): Observable<CompanyResponse> {
    return this.apiService.put<CompanyResponse>(`/companies/${id}/settings`, settings);
  }
} 