import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { FileUploadCustomNameDirective } from '../directives/file-upload-custom-name.directive';

/**
 * Este módulo proporciona componentes y servicios para la carga de archivos con nombre personalizado.
 * Incluye el componente FileUploadComponent con la opción de nombre personalizado habilitada por defecto.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    FileUploadComponent, 
    FileUploadCustomNameDirective
  ],
  exports: [
    FileUploadComponent,
    FileUploadCustomNameDirective
  ],
  providers: []
})
export class FileUploadCustomizationModule { } 