import { Injectable, Injector } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService!: AuthService;
  
  constructor(private injector: Injector, private router: Router) {
    // Inyección lazy para evitar dependencias circulares
    setTimeout(() => {
      this.authService = this.injector.get(AuthService);
    });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Asegurarnos de tener la referencia a AuthService
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    
    // Verificar si el usuario está autenticado localmente
    if (this.authService.isLoggedIn) {
      console.log('Usuario autenticado localmente, validando token con el servidor...');
      
      // Validar el token con el servidor antes de permitir acceso
      return this.authService.validateToken().pipe(
        tap(isValid => {
          console.log('Resultado de validación de token:', isValid);
          if (!isValid) {
            console.warn('Token no válido, redirigiendo al login');
            this.authService.logout();
            this.router.navigate(['/auth/login'], { 
              queryParams: { returnUrl: state.url } 
            });
          }
        }),
        catchError(error => {
          console.error('Error al validar token en guard:', error);
          this.authService.logout();
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return of(false);
        }),
        switchMap(isValid => {
          if (isValid) {
            // Verificar roles si se especifican en los datos de la ruta
            if (route.data['roles'] && route.data['roles'].length) {
              const userRoles = this.authService.currentUser?.roles || [];
              
              // Verificar si al menos uno de los roles del usuario está incluido en los roles permitidos
              if (userRoles.length > 0 && route.data['roles'].some((role: string) => userRoles.includes(role as any))) {
                return of(true);
              } else {
                // Si el usuario no tiene ninguno de los roles requeridos, redirigir a la página de acceso prohibido
                console.warn('Usuario no tiene permisos suficientes');
                this.router.navigate(['/forbidden']);
                return of(false);
              }
            }
            
            // Si no hay roles especificados, solo verificamos que esté autenticado
            return of(true);
          }
          
          return of(false);
        })
      );
    }

    console.log('Usuario no autenticado, redirigiendo al login');
    // Guardar la URL de redirección para volver después del login
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return of(false);
  }
} 