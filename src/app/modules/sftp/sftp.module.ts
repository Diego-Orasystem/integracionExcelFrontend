import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Importar el componente directamente desde el archivo de índice
const SftpComponent = () => import('./sftp.component').then(m => m.SftpComponent);

// Definición de rutas
const routes: Routes = [
  {
    path: '',
    loadComponent: SftpComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SftpModule { } 