import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SampleFile } from '../../../../core/models/subarea.model';
import { SampleFileService } from '../../../../core/services/sample-file.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsHelper } from '../../../utils/permissions.helper';

@Component({
  selector: 'app-sample-files-list',
  templateUrl: './sample-files-list.component.html',
  styleUrls: ['./sample-files-list.component.scss']
})
export class SampleFilesListComponent implements OnInit, OnDestroy {
  @Input() subareaId!: string;
  @Input() subareaName?: string;
  
  sampleFiles: SampleFile[] = [];
  loading = true;
  error: string | null = null;
  
  // Permisos
  canCreate = false;
  canDelete = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private sampleFileService: SampleFileService,
    private authService: AuthService,
    private permissionsHelper: PermissionsHelper
  ) {}

  ngOnInit(): void {
    // Verificar permisos
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.canCreate = this.permissionsHelper.hasPermission(user, 'sample_file_create');
        this.canDelete = this.permissionsHelper.hasPermission(user, 'sample_file_delete');
      });
    
    // Cargar archivos de ejemplo
    this.loadSampleFiles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los archivos de ejemplo de la subárea
   */
  loadSampleFiles(): void {
    if (!this.subareaId) {
      this.error = 'ID de subárea no válido';
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    this.sampleFileService.getSampleFiles(this.subareaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (files) => {
          this.sampleFiles = files;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar archivos de ejemplo';
          this.loading = false;
          console.error('Error cargando archivos de ejemplo:', err);
        }
      });
  }

  /**
   * Abre el modal para subir un nuevo archivo de ejemplo
   */
  openFileUploader(): void {
    // Esta implementación requerirá el uso de algún servicio de modal/diálogo
    // Por ahora implementaremos un manejo básico
    console.log('Abrir modal para subir archivo');
    
    // Aquí se abriría un diálogo modal para subir archivos
    // Cuando se complete, se llamaría a addSampleFile con los datos del archivo
  }

  /**
   * Añade un archivo como ejemplo a la subárea
   */
  addSampleFile(fileData: any): void {
    this.sampleFileService.addSampleFile(this.subareaId, {
      fileId: fileData.id,
      name: fileData.name,
      description: fileData.description
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadSampleFiles(); // Recargar la lista
      },
      error: (err) => {
        this.error = 'Error al añadir archivo de ejemplo';
        console.error('Error añadiendo archivo de ejemplo:', err);
      }
    });
  }

  /**
   * Elimina un archivo de ejemplo
   */
  removeSampleFile(fileId: string): void {
    if (confirm('¿Está seguro de eliminar este archivo de ejemplo?')) {
      this.sampleFileService.removeSampleFile(this.subareaId, fileId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadSampleFiles(); // Recargar la lista
          },
          error: (err) => {
            this.error = 'Error al eliminar archivo de ejemplo';
            console.error('Error eliminando archivo de ejemplo:', err);
          }
        });
    }
  }

  /**
   * Descarga un archivo
   */
  downloadFile(fileId: string): void {
    this.sampleFileService.downloadFile(fileId);
  }
} 