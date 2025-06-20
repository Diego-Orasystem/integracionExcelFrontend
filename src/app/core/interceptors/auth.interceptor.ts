import { Injectable, inject, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private authService!: AuthService;

  constructor(
    private injector: Injector,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtenemos AuthService de forma lazy para evitar dependencia circular
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }

    // No agregar token a las solicitudes de autenticación
    if (this.isAuthRequest(request)) {
      return next.handle(request);
    }
    
    // Agregar token a las solicitudes
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            return this.handle401Error(request, next);
          } else if (error.status === 403) {
            // Acceso prohibido
            this.router.navigate(['/forbidden']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private isAuthRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('/auth/login') || 
           request.url.includes('/auth/register') || 
           request.url.includes('/auth/forgot-password');
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Asegurarnos de tener la referencia a AuthService
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    
    // Si la URL es de refresh token y recibimos 401, significa que el refresh token expiró
    if (request.url.includes('/auth/refresh-token')) {
      console.log('Refresh token expirado, redirigiendo al login');
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return of();
    }
    
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log('Token expirado, intentando refrescar...');
      
      return this.authService.refreshToken().pipe(
        switchMap((user: User) => {
          console.log('Token refrescado exitosamente');
          this.refreshTokenSubject.next(user.token);
          return next.handle(this.addToken(request, user.token || ''));
        }),
        catchError((err) => {
          console.error('Error al refrescar token:', err);
          
          // Si hay un error al refrescar el token, cerramos la sesión y redirigimos al login
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Si ya se está refrescando, esperar a que termine y usar el nuevo token
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request, jwt));
        })
      );
    }
  }
}

// Función factory para usar con withInterceptors en provideHttpClient
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  // No inyectamos AuthService directamente para evitar dependencias circulares
  const injector = inject(Injector);
  const router = inject(Router);
  
  // No agregar token a las solicitudes de autenticación
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/register') || 
      req.url.includes('/auth/forgot-password')) {
    return next(req);
  }
  
  // Función auxiliar que crea un nuevo request con el token
  const addToken = (request: HttpRequest<any>, token: string): HttpRequest<any> => {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  // Obtenemos el token directamente de localStorage para evitar dependencia circular
  const getStoredToken = (): string | null => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.token || null;
      }
    } catch (error) {
      console.error('Error al obtener token desde localStorage', error);
    }
    return null;
  };
  
  const token = getStoredToken();
  
  // Si hay token, agregarlo a la solicitud
  if (token) {
    const clonedReq = addToken(req, token);
    
    // Manejar errores de autenticación
    return next(clonedReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            console.error('Error 401 en interceptor funcional:', error);
            // Obtenemos AuthService solo cuando lo necesitamos
            const authService = injector.get(AuthService);
            authService.logout();
            router.navigate(['/auth/login']);
          } else if (error.status === 403) {
            router.navigate(['/forbidden']);
          }
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
}; 