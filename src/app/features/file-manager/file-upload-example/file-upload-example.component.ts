import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { FileUploadProgress } from '../../../core/models/file-upload-progress.model';

@Component({
  selector: 'app-file-upload-example',
  templateUrl: './file-upload-example.component.html',
  styleUrls: ['./file-upload-example.component.scss'],
  standalone: true,
  imports: [CommonModule, FileUploadComponent]
})
export class FileUploadExampleComponent {
  uploadProgress: number = 0;
  isUploading: boolean = false;
  error: string | null = null;
  uploadCompleted: boolean = false;
  
  selectedFiles: File[] = [];
  customNames: string[] = [];
  
  constructor(private fileUploadService: FileUploadService) {}
  
  /**
   * Manejador para la selección de archivos con nombre personalizado
   */
  onFilesSelectedWithCustomName(event: {files: File[], customNames: string[]}) {
    this.selectedFiles = event.files;
    this.customNames = event.customNames;
    
    // Reset progress
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadCompleted = false;
    this.error = null;
  }
  
  /**
   * Inicia la carga de archivos con nombres personalizados
   */
  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.error = 'Por favor, seleccione al menos un archivo para subir.';
      return;
    }
    
    this.isUploading = true;
    this.error = null;
    
    if (this.selectedFiles.length === 1) {
      // Si solo hay un archivo, usamos el método de carga individual
      this.fileUploadService.uploadFileWithCustomName(
        this.selectedFiles[0], 
        this.customNames[0]
      ).subscribe({
        next: (progress: FileUploadProgress) => {
          this.uploadProgress = progress.progress;
          
          if (progress.progress === 100) {
            this.isUploading = false;
            this.uploadCompleted = true;
          }
        },
        error: (error) => {
          this.isUploading = false;
          this.error = 'Error al subir el archivo. Por favor, inténtelo de nuevo.';
          console.error('Error en la carga:', error);
        }
      });
    } else {
      // Si hay múltiples archivos, usamos el método de carga múltiple
      this.fileUploadService.uploadMultipleFilesWithCustomNames(
        this.selectedFiles,
        this.customNames
      ).subscribe({
        next: (progressArray: FileUploadProgress[]) => {
          // Calculamos el progreso total promediando el progreso de todos los archivos
          const totalProgress = progressArray.reduce((sum, curr) => sum + curr.progress, 0);
          this.uploadProgress = Math.round(totalProgress / progressArray.length);
          
          if (this.uploadProgress === 100) {
            this.isUploading = false;
            this.uploadCompleted = true;
          }
        },
        error: (error) => {
          this.isUploading = false;
          this.error = 'Error al subir los archivos. Por favor, inténtelo de nuevo.';
          console.error('Error en la carga múltiple:', error);
        }
      });
    }
  }
  
  /**
   * Reinicia el formulario de carga
   */
  resetUpload() {
    this.selectedFiles = [];
    this.customNames = [];
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadCompleted = false;
    this.error = null;
  }
} 