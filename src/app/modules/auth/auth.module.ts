import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

// Definir las rutas usando la carga diferida de componentes standalone
const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login-with-code',
    loadComponent: () => import('./login-with-code/login-with-code.component').then(m => m.LoginWithCodeComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./recover-password/recover-password.component').then(m => m.RecoverPasswordComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AuthModule { } 