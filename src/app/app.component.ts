import { Component, OnInit, Injector } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { LanguageSelectorComponent } from './shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    SharedModule,
    TranslateModule,
    LanguageSelectorComponent
  ]
})
export class AppComponent implements OnInit {
  title = 'Gestor de Archivos Excel';
  isLoggedIn = false;
  showHeader = true;
  showSidebar = true;
  private authService!: AuthService;
  
  constructor(
    private router: Router,
    private injector: Injector,
    private languageService: LanguageService
  ) {
    // Inyección lazy para evitar dependencias circulares
    setTimeout(() => {
      this.authService = this.injector.get(AuthService);
    });
  }
  
  ngOnInit(): void {
    // Obtenemos la referencia a AuthService
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    
    // Comprueba si el usuario está autenticado
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
    
    // Oculta el encabezado y la barra lateral en páginas de autenticación
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.url;
        this.showHeader = !url.includes('/auth/');
        this.showSidebar = !url.includes('/auth/');
      });
  }
  
  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }
  
  logout(): void {
    // Asegurarnos de tener la referencia a AuthService
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 