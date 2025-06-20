import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Importar componentes
const CompaniesComponent = () => import('./companies.component').then(m => m.CompaniesComponent);
const CompanyDetailComponent = () => import('./company-detail.component').then(m => m.CompanyDetailComponent);

// Definición de rutas
const routes: Routes = [
  {
    path: '',
    loadComponent: CompaniesComponent
  },
  {
    path: ':id',
    loadComponent: CompanyDetailComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CompaniesModule { } 