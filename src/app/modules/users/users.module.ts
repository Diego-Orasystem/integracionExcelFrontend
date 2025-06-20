import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Importar los componentes
const UsersComponent = () => import('./users.component').then(m => m.UsersComponent);
const CreateUserComponent = () => import('./create-user/create-user.component').then(m => m.CreateUserComponent);
const EditUserComponent = () => import('./edit-user/edit-user.component').then(m => m.EditUserComponent);
const RolesComponent = () => import('./roles/roles.component').then(m => m.RolesComponent);
const PermissionsComponent = () => import('./permissions/permissions.component').then(m => m.PermissionsComponent);
const UserRolesComponent = () => import('./user-roles/user-roles.component').then(m => m.UserRolesComponent);

// Definición de rutas
const routes: Routes = [
  {
    path: '',
    loadComponent: UsersComponent
  },
  {
    path: 'create',
    loadComponent: CreateUserComponent
  },
  {
    path: 'edit/:id',
    loadComponent: EditUserComponent
  },
  {
    path: 'roles',
    loadComponent: RolesComponent
  },
  {
    path: 'permissions',
    loadComponent: PermissionsComponent
  },
  {
    path: ':id/roles',
    loadComponent: UserRolesComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class UsersModule { } 