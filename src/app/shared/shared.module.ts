import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

// Componentes compartidos
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ForbiddenComponent } from './components/forbidden/forbidden.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { AlertComponent } from './components/alert/alert.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';

// Directivas
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { HasPermissionDirective } from './directives/has-permission.directive';
import { PermissionDirective } from './directives/permission.directive';

// Pipes
import { FileSizePipe } from './pipes/file-size.pipe';
import { DateFormatPipe } from './pipes/date-format.pipe';

// Componentes del menú lateral
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { MenuItemsComponent } from './components/layout/side-menu/menu-items.component';

// Componentes de archivos de ejemplo
import { SampleFilesListComponent } from './components/files/sample-files/sample-files-list.component';

// Utilidades
import { FileHelpers } from './utils/file-helpers';
import { PermissionsHelper } from './utils/permissions.helper';

@NgModule({
  declarations: [
    // Componentes
    SideMenuComponent,
    MenuItemsComponent,
    SampleFilesListComponent,
    
    // Directivas
    PermissionDirective
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule
  ],
  exports: [
    // Módulos comunes
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    
    // Componentes
    SideMenuComponent,
    SampleFilesListComponent,
    
    // Directivas
    PermissionDirective
  ],
  providers: [
    FileHelpers,
    PermissionsHelper
  ]
})
export class SharedModule { } 