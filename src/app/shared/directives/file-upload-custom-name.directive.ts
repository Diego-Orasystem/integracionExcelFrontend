import { Directive, AfterViewInit, ContentChildren, QueryList } from '@angular/core';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';

@Directive({
  selector: '[appFileUploadCustomName]',
  standalone: true
})
export class FileUploadCustomNameDirective implements AfterViewInit {
  @ContentChildren(FileUploadComponent, { descendants: true }) 
  fileUploads!: QueryList<FileUploadComponent>;

  constructor() { }

  ngAfterViewInit(): void {
    // Asegurarse de que todos los componentes de carga de archivos
    // tengan la opción de nombre personalizado habilitada
    this.fileUploads.forEach(fileUpload => {
      fileUpload.allowCustomName = true;
    });
  }
} 