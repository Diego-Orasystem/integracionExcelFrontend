import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translate: TranslateService) {
    // Inicializar con el idioma guardado en localStorage o por defecto español
    const savedLang = localStorage.getItem('language') as Language;
    const defaultLang: Language = savedLang || 'es';
    
    this.translate.setDefaultLang('es');
    this.setLanguage(defaultLang);
  }

  setLanguage(language: Language): void {
    // Guardar en localStorage
    localStorage.setItem('language', language);
    
    // Actualizar el idioma en el servicio de traducción
    this.translate.use(language);
    
    // Actualizar el Subject
    this.currentLanguageSubject.next(language);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  getAvailableLanguages(): { code: Language, name: string }[] {
    return [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' }
    ];
  }
} 