import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { delay } from 'rxjs/operators';

// Interfaz para los datos de registro en el formato que espera el backend
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  companyId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private isRefreshingToken = false;
  private readonly TOKEN_KEY = 'currentUser';
  private router!: Router;
  
  constructor(
    private http: HttpClient,
    private injector: Injector
  ) {
    // Inicializar BehaviorSubject con datos del localStorage
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    console.log('AuthService inicializado, URL API:', this.apiUrl);
    
    // Intentar cargar el usuario desde localStorage y validar token
    this.loadUserFromStorage();
  }

  // Obtenemos el router bajo demanda para evitar dependencias circulares
  private getRouter(): Router {
    if (!this.router) {
      this.router = this.injector.get(Router);
    }
    return this.router;
  }

  // Cargar usuario desde el almacenamiento local e inicializar el estado de autenticación
  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(this.TOKEN_KEY);
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        console.log('Usuario cargado desde localStorage:', user);
        
        if (user && user.token) {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          
          // Validar el token en segundo plano
          this.validateToken().subscribe(
            isValid => {
              if (!isValid) {
                console.log('Token inválido o expirado, cerrando sesión...');
                this.clearUserData();
                this.navigateToLogin();
              } else {
                console.log('Token validado correctamente');
              }
            }
          );
        } else {
          console.log('No hay token en localStorage');
          this.clearUserData();
        }
      } else {
        console.log('No hay datos de usuario en localStorage');
      }
    } catch (error) {
      console.error('Error al cargar usuario desde localStorage:', error);
      this.clearUserData();
    }
  }

  // Método auxiliar para navegar al login
  private navigateToLogin(returnUrl?: string): void {
    const router = this.getRouter();
    const navigationOptions = returnUrl ? { queryParams: { returnUrl } } : undefined;
    router.navigate(['/auth/login'], navigationOptions);
  }

  // Validar si el token almacenado es válido
  validateToken(): Observable<boolean> {
    const user = this.currentUserSubject.value;
    if (!user || !user.token) {
      console.log('No hay token disponible para validar');
      return of(false);
    }

    console.log('Validando token con el servidor...');
    
    // Creamos una petición HTTP sin usar interceptores para evitar dependencias circulares
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${user.token}`
    });
    
    // Intenta verificar el token mediante una petición al backend
    return this.http.get<any>(`${this.apiUrl}/auth/profile`, { headers })
      .pipe(
        map(response => {
          console.log('Respuesta de validación de token:', response);
          return true;
        }),
        catchError(error => {
          console.error('Error validando token:', error);
          if (error.status === 401) {
            // Si el token expiró, intentar refrescarlo
            return this.silentRefreshToken().pipe(
              map(success => success),
              catchError(() => of(false))
            );
          }
          return of(false);
        })
      );
  }

  // Intento silencioso de refrescar el token
  silentRefreshToken(): Observable<boolean> {
    const user = this.currentUserSubject.value;
    if (!user || !user.refreshToken || this.isRefreshingToken) {
      return of(false);
    }

    this.isRefreshingToken = true;
    console.log('Intentando refrescar token silenciosamente...');
    
    const headers = new HttpHeaders();
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/refresh-token`, 
      { refreshToken: user.refreshToken },
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const updatedUser = {
            ...user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            lastLogin: new Date().toISOString()
          };
          
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
          console.log('Token refrescado exitosamente');
          return true;
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('Error al refrescar token silenciosamente:', error);
        return of(false);
      }),
      finalize(() => {
        this.isRefreshingToken = false;
      })
    );
  }

  // Implementación real de login
  login(email: string, password: string): Observable<User> {
    console.log(`Intentando login con email: ${email} a ${this.apiUrl}/auth/login`);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/login`, 
      { email, password },
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Login exitoso:', response);
          
          // Construir objeto de usuario con los datos de la respuesta
          const user: User = {
            id: response.data.user.id,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            name: response.data.user.name || `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim(),
            email: response.data.user.email,
            role: response.data.user.role,
            roles: response.data.user.roles || [response.data.user.role],
            companyId: response.data.user.companyId,
            active: response.data.user.active,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            createdAt: response.data.user.createdAt,
            updatedAt: response.data.user.updatedAt,
            lastLogin: response.data.user.lastLogin,
            loginMethod: response.data.user.loginMethod || 'email_code',
            preferences: response.data.user.preferences
          };
          
          // Guardar usuario en localStorage
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          return user;
        } else {
          console.error('Formato de respuesta inesperado:', response);
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  // Método auxiliar para acceder al usuario actual
  get currentUser(): User | null {
    return this.currentUserSubject?.value;
  }

  // Método auxiliar para establecer el usuario actual
  set currentUser(user: User | null) {
    if (user) {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    if (this.currentUserSubject) {
      this.currentUserSubject.next(user);
    }
  }

  // Obtener token del usuario actual
  getToken(): string | null {
    return this.currentUser?.token || null;
  }

  // Verificar si el usuario actual está autenticado
  get isLoggedIn(): boolean {
    return !!this.currentUser && !!this.currentUser.token;
  }

  // Cerrar sesión
  logout(): void {
    const token = this.getToken();
    
    // Si hay token, intentar logout en el servidor
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.post<any>(
        `${this.apiUrl}/auth/logout`, 
        {},
        { headers }
      ).pipe(
        tap(() => this.clearUserData()),
        catchError(error => {
          console.error('Error en logout:', error);
          this.clearUserData();
          return of(null);
        })
      ).subscribe();
    } else {
      // Si no hay token, solo limpiamos datos locales
      this.clearUserData();
    }
    
    // Redirigir al login
    this.navigateToLogin();
  }
  
  private clearUserData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Refrescar token explícitamente
  refreshToken(): Observable<User> {
    const user = this.currentUserSubject.value;
    
    if (!user || !user.refreshToken) {
      return throwError(() => new Error('No se encontró un token de actualización válido'));
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/refresh-token`, 
      { refreshToken: user.refreshToken },
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Token refrescado correctamente:', response);
          
          const updatedUser: User = {
            ...user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            roles: user.roles || [user.role as any], // Aseguramos que roles esté definido
            lastLogin: new Date().toISOString()
          };
          
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
          return updatedUser;
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('Error al refrescar token:', error);
        // Si hay un error de autenticación, cerrar sesión
        if (error.status === 401) {
          this.clearUserData();
          this.navigateToLogin();
        }
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(requiredRoles: string[]): boolean {
    const user = this.currentUser;
    if (!user) return false;
    
    // Si el usuario tiene roles como array, verificar si tiene al menos uno de los roles requeridos
    if (user.roles && Array.isArray(user.roles)) {
      return requiredRoles.some(role => user.roles.includes(role as any));
    }
    
    // Compatibilidad con versión anterior
    if (user.role) {
      return requiredRoles.includes(user.role as string);
    }
    
    return false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser;
    if (!user) return false;
    
    console.log(`Verificando permiso: ${permission} para usuario con roles: ${user.roles?.join(', ')}`);
    
    // El administrador global tiene todos los permisos
    if (user.roles?.includes('admin')) {
      console.log('Es admin global - tiene todos los permisos');
      return true;
    }
    
    // Permisos para administrador de compañía
    if (user.roles?.includes('company_admin')) {
      console.log('Es admin de compañía - verificando permisos específicos');
      
      // El administrador de compañía debe tener permisos básicos de gestión de archivos y carpetas
      const companyAdminPermissions = [
        'file_read', 'file_write', 'file_delete', 'file_admin',
        'folder_read', 'folder_create', 'folder_delete',
        'area_read', 'area_write', 'area_create', 'area_edit', 'area_delete',
        'subarea_read', 'subarea_write', 'subarea_create', 'subarea_edit', 'subarea_delete'
      ];
      
      if (companyAdminPermissions.includes(permission)) {
        console.log(`Permiso ${permission} concedido para admin de compañía`);
        return true;
      }
    }
    
    // Los usuarios con rol "user_control" tienen permisos para ver carpetas y archivos pero no borrarlos
    if (user.roles?.includes('user_control')) {
      const controlUserPermissions = [
        'file_read', 'file_write', 'folder_read', 'folder_list'
      ];
      
      if (controlUserPermissions.includes(permission)) {
        console.log(`Permiso ${permission} concedido para user_control`);
        return true;
      }
    }
    
    // Los usuarios responsables tienen permisos de lectura y gestión básica de archivos
    if (user.roles?.includes('user_responsible')) {
      const responsibleUserPermissions = [
        'file_read', 'file_write', 'file_delete', 'folder_read', 'folder_list'
      ];
      
      if (responsibleUserPermissions.includes(permission)) {
        console.log(`Permiso ${permission} concedido para usuario responsable`);
        return true;
      }
    }
    
    // Implementación básica, en una versión más completa
    // aquí se consultarían los permisos reales del usuario desde la API
    console.log(`Permiso ${permission} denegado para roles ${user.roles?.join(', ')}`);
    return false;
  }

  // Nuevo método para determinar si un usuario puede acceder a una carpeta específica
  canAccessFolder(folder: any): boolean {
    if (!folder) return false;
    
    const user = this.currentUser;
    if (!user) return false;
    
    console.log('Evaluando permisos para carpeta:', folder.name);
    
    // Admin global puede acceder a todo
    if (user.roles?.includes('admin')) {
      console.log('Usuario es admin global - acceso permitido');
      return true;
    }
    
    // Extraer el ID de la compañía, que puede venir como string o como objeto
    const folderCompanyId = typeof folder.companyId === 'object' ? folder.companyId?._id : folder.companyId;
    console.log('CompanyId de carpeta:', folderCompanyId, 'CompanyId de usuario:', user.companyId);
    
    // Si la carpeta es de una compañía diferente a la del usuario, denegar acceso
    if (folderCompanyId !== user.companyId) {
      console.log('Compañía de carpeta no coincide con compañía de usuario - acceso denegado');
      return false;
    }
    
    // Admin de compañía puede acceder a todas las carpetas de su compañía
    if (user.roles?.includes('company_admin')) {
      console.log('Usuario es admin de compañía - acceso permitido');
      return true;
    }
    
    // Usuario control puede ver todas las carpetas de su empresa
    if (user.roles?.includes('user_control')) {
      console.log('Usuario control puede ver todas las carpetas de su empresa - acceso permitido');
      return true;
    }
    
    // Si el usuario es responsable de área (user_responsible)
    if (user.roles?.includes('user_responsible')) {
      console.log('Usuario es responsable de área - verificando acceso específico');
      
      // Si la carpeta tiene un responsable asignado
      if (folder.responsibleUserId) {
        const responsible = typeof folder.responsibleUserId === 'object' ? 
                            folder.responsibleUserId?._id : folder.responsibleUserId;
        
        // Si el usuario es el responsable de la carpeta, permitir acceso
        const isResponsible = responsible === user.id;
        console.log('¿Usuario es responsable de esta carpeta?', isResponsible);
        
        return isResponsible;
      }
      
      // Si la carpeta tiene un área asignada y el usuario es responsable de esa área
      if (folder.areaId && 
          ('areaId' in user) && 
          folder.areaId === (user as any).areaId) {
        console.log('Carpeta pertenece al área del usuario responsable - acceso permitido');
        return true;
      }
      
      // Si la carpeta no tiene área, permitir acceso a los usuarios de la empresa
      if (!folder.areaId) {
        console.log('Carpeta sin área - acceso permitido a usuario de la compañía');
        return true;
      }
      
      console.log('Responsable no cumple criterios para ver la carpeta - acceso denegado');
      return false;
    }
    
    // Por defecto, denegar acceso si no se cumple ninguna condición
    console.log('No se cumple ningún criterio de acceso - acceso denegado');
    return false;
  }

  register(userData: any): Observable<any> {
    // Adaptar el formato de los datos para que coincida con lo que espera el backend
    const requestData: RegisterRequest = {
      name: `${userData.firstName} ${userData.lastName}`, // Combinar firstName y lastName en name
      email: userData.email,
      password: userData.password,
      role: userData.role
    };
    
    // Añadir companyId solo si está definido
    if (userData.companyId) {
      requestData.companyId = userData.companyId;
    }
    
    console.log('Datos de registro adaptados:', requestData);
    
    return this.http.post<any>(`${this.apiUrl}/auth/register`, requestData)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Error en el registro');
          }
        }),
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Error al procesar la solicitud');
          }
        }),
        catchError(error => {
          console.error('Error en recuperación de contraseña:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para solicitar código de verificación por email
  requestLoginCode(email: string): Observable<any> {
    console.log(`Solicitando código de verificación para: ${email}`);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/request-code`, 
      { email },
      { headers }
    ).pipe(
      map(response => {
        console.log('Respuesta de solicitud de código:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error al solicitar código de verificación:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para verificar código y realizar login
  verifyLoginCode(email: string, code: string): Observable<User> {
    console.log(`Verificando código para: ${email}`);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/verify-code`, 
      { email, code },
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Verificación de código exitosa:', response);
          
          // Construir objeto de usuario con los datos de la respuesta
          const user: User = {
            id: response.data.user.id,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            name: response.data.user.name || `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim(),
            email: response.data.user.email,
            role: response.data.user.role,
            roles: response.data.user.roles || [response.data.user.role],
            companyId: response.data.user.companyId,
            active: response.data.user.active,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            createdAt: response.data.user.createdAt,
            updatedAt: response.data.user.updatedAt,
            lastLogin: response.data.user.lastLogin,
            loginMethod: response.data.user.loginMethod || 'email_code',
            preferences: response.data.user.preferences
          };
          
          // Guardar usuario en localStorage
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          return user;
        } else {
          console.error('Formato de respuesta inesperado:', response);
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('Error al verificar código:', error);
        return throwError(() => error);
      })
    );
  }
} 