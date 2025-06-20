import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Language, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  template: `
    <div class="language-selector dropdown">
      <button class="btn btn-link dropdown-toggle text-white" type="button" id="languageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-language me-1"></i>
        <span>{{ getCurrentLanguageDisplay() }}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
        <li *ngFor="let lang of availableLanguages">
          <button class="dropdown-item" (click)="changeLanguage(lang.code)" [class.active]="currentLanguage === lang.code">
            {{ lang.name }}
          </button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .language-selector {
      display: inline-block;
    }
    .dropdown-item.active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: Language = 'es';
  availableLanguages: { code: Language, name: string }[] = [];

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.availableLanguages = this.languageService.getAvailableLanguages();
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  changeLanguage(language: Language): void {
    this.languageService.setLanguage(language);
  }

  getCurrentLanguageDisplay(): string {
    const current = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    return current ? current.name : 'Español';
  }
} 