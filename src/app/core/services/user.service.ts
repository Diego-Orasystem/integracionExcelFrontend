import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserResponse, UsersResponse, CreateUserData } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene la lista de usuarios
   * @param params Parámetros de filtrado y paginación
   */
  getUsers(params?: any): Observable<UsersResponse> {
    return this.apiService.get<any>('/users', params)
      .pipe(
        map(response => {
          // Transformamos los datos para adaptarlos a nuestro modelo
          if (response.data && Array.isArray(response.data)) {
            response.data = response.data.map((user: any) => ({
              id: user._id || user.id, // Usar _id si existe, de lo contrario usar id
              name: user.name, // Usar el nombre completo de la API
              email: user.email,
              role: user.role,
              roles: user.roles || [user.role], // Compatibilidad con el nuevo modelo
              companyId: user.companyId,
              active: user.active,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              lastLogin: user.lastLogin,
              preferences: user.preferences
            }));
          }
          return response as UsersResponse;
        })
      );
  }

  /**
   * Obtiene los detalles de un usuario específico
   * @param id ID del usuario
   */
  getUserById(id: string): Observable<UserResponse> {
    return this.apiService.get<any>(`/users/${id}`)
      .pipe(
        map(response => {
          if (response.data) {
            response.data = {
              id: response.data._id || response.data.id,
              name: response.data.name,
              email: response.data.email,
              role: response.data.role,
              roles: response.data.roles || [response.data.role], // Compatibilidad con el nuevo modelo
              companyId: response.data.companyId,
              active: response.data.active,
              createdAt: response.data.createdAt,
              updatedAt: response.data.updatedAt,
              lastLogin: response.data.lastLogin,
              preferences: response.data.preferences
            };
          }
          return response as UserResponse;
        })
      );
  }

  /**
   * Alias para getUserById para mantener consistencia en la API
   * @param id ID del usuario
   */
  getUser(id: string): Observable<UserResponse> {
    return this.getUserById(id);
  }

  /**
   * Obtiene los datos del usuario actual
   */
  getCurrentUser(): Observable<UserResponse> {
    return this.apiService.get<any>('/users/me')
      .pipe(
        map(response => {
          if (response.data) {
            response.data = {
              id: response.data._id || response.data.id,
              name: response.data.name,
              email: response.data.email,
              role: response.data.role,
              roles: response.data.roles || [response.data.role], // Compatibilidad con el nuevo modelo
              companyId: response.data.companyId,
              active: response.data.active,
              createdAt: response.data.createdAt,
              updatedAt: response.data.updatedAt,
              lastLogin: response.data.lastLogin,
              preferences: response.data.preferences
            };
          }
          return response as UserResponse;
        })
      );
  }

  /**
   * Actualiza el perfil del usuario actual
   * @param userData Datos a actualizar
   */
  updateProfile(userData: any): Observable<UserResponse> {
    return this.apiService.put<UserResponse>('/users/profile', userData);
  }

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   */
  createUser(user: CreateUserData): Observable<UserResponse> {
    const userData = {
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.roles || ['user_responsible'], // Usar roles como array
      companyId: user.companyId,
      preferences: user.preferences || {
        language: 'es',
        theme: 'light',
        defaultView: 'list'
      }
    };
    return this.apiService.post<UserResponse>('/users', userData).pipe(
      map(response => {
        if (response.data) {
          response.data = {
            id: response.data._id || response.data.id,
            name: response.data.name,
            email: response.data.email,
            role: response.data.role,
            roles: response.data.roles || [response.data.role], // Compatibilidad con el nuevo modelo
            companyId: response.data.companyId,
            active: response.data.active,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            preferences: response.data.preferences
          } as User;
        }
        return response as UserResponse;
      })
    );
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario
   * @param user Datos actualizados del usuario
   */
  updateUser(id: string, user: Partial<User>): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/users/${id}`, user);
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   */
  deleteUser(id: string): Observable<any> {
    return this.apiService.delete<any>(`/users/${id}`);
  }

  /**
   * Resetea la contraseña de un usuario
   * @param id ID del usuario
   */
  resetPassword(id: string): Observable<any> {
    return this.apiService.post<any>(`/users/${id}/reset-password`, {});
  }

  /**
   * Actualiza las preferencias de un usuario
   * @param id ID del usuario
   * @param preferences Preferencias a actualizar
   */
  updatePreferences(id: string, preferences: any): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/users/${id}/preferences`, preferences);
  }

  /**
   * Obtiene los roles de un usuario
   * @param id ID del usuario
   */
  getUserRoles(id: string): Observable<any> {
    return this.apiService.get<any>(`/users/${id}/roles`);
  }

  /**
   * Añade un rol a un usuario
   * @param id ID del usuario
   * @param role Rol a añadir
   */
  addRole(id: string, role: string): Observable<any> {
    return this.apiService.post<any>(`/users/${id}/roles`, { role });
  }

  /**
   * Elimina un rol de un usuario
   * @param id ID del usuario
   * @param role Rol a eliminar
   */
  removeRole(id: string, role: string): Observable<any> {
    return this.apiService.delete<any>(`/users/${id}/roles/${role}`);
  }

  /**
   * Activa o desactiva un usuario
   * @param id ID del usuario
   * @param active Estado de activación
   */
  setActiveStatus(id: string, active: boolean): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/users/${id}/status`, { active });
  }
} 