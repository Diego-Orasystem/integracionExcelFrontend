import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Importar los componentes directamente desde los archivos
const AdminComponent = () => import('./admin.component').then(m => m.AdminComponent);
const FilePermissionsComponent = () => import('./file-permissions/file-permissions.component').then(m => m.FilePermissionsComponent);

// Definición de rutas
const routes: Routes = [
  {
    path: '',
    loadComponent: AdminComponent
  },
  {
    path: 'file-permissions/:id',
    loadComponent: FilePermissionsComponent,
    data: { 
      roles: ['admin', 'company_admin'],
      permissions: ['file_admin']
    }
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { } 