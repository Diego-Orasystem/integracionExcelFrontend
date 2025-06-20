import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Area } from '../models/area.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private endpoint = '/areas';

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }

  getAreas(companyId?: string): Observable<any> {
    const url = companyId ? `${this.endpoint}?companyId=${companyId}` : this.endpoint;
    return this.apiService.get(url);
  }

  getArea(id: string): Observable<any> {
    return this.apiService.get(`${this.endpoint}/${id}`);
  }

  createArea(area: Partial<Area>): Observable<any> {
    return this.apiService.post(this.endpoint, area);
  }

  updateArea(id: string, area: Partial<Area>): Observable<any> {
    return this.apiService.put(`${this.endpoint}/${id}`, area);
  }

  deleteArea(id: string, force: boolean = false): Observable<any> {
    const url = force ? `${this.endpoint}/${id}?force=true` : `${this.endpoint}/${id}`;
    return this.apiService.delete(url);
  }

  assignResponsible(areaId: string, responsibleUserId: string): Observable<any> {
    return this.apiService.post(`${this.endpoint}/${areaId}/assign-responsible`, { responsibleUserId });
  }

  getSubareas(areaId: string): Observable<any> {
    const url = `${this.endpoint}/${areaId}/subareas`;
    console.log(`AreaService: Obteniendo subáreas del área ${areaId} con URL: ${url}`);
    return this.apiService.get(url);
  }
} 