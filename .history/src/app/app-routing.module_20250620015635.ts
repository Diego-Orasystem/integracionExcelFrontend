import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'explorer',
    loadChildren: () => import('./modules/explorer').then(m => m.ExplorerModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'companies',
    loadChildren: () => import('./modules/companies').then(m => m.CompaniesModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'users',
    loadChildren: () => import('./modules/users').then(m => m.UsersModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'sftp',
    loadChildren: () => import('./modules/sftp').then(m => m.SftpModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'logs',
    loadChildren: () => import('./modules/logs/logs.module').then(m => m.LogsModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'organization',
    loadChildren: () => import('./modules/organization/organization.module').then(m => m.OrganizationModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'company_admin'] }
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },
  {
    path: 'file-status',
    loadChildren: () => import('./modules/file-status/file-status.module').then(m => m.FileStatusModule),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 