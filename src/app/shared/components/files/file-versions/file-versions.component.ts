import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileVersionService } from '../../../../core/services/file-version.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../../shared.module';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner.component';
import { UserService } from '../../../../core/services/user.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-file-versions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    SharedModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="versions-container">
      <h3>{{ 'VERSION.HISTORY_TITLE' | translate }}</h3>

      <div *ngIf="loading" class="loading-state">
        <app-loading-spinner></app-loading-spinner>
        {{ 'VERSION.LOADING_VERSIONS' | translate }}
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <table *ngIf="!loading && versions.length > 0" class="versions-table">
        <thead>
          <tr>
            <th>{{ 'VERSION.VERSION' | translate }}</th>
            <th>{{ 'VERSION.DATE' | translate }}</th>
            <th>{{ 'VERSION.UPLOADED_BY' | translate }}</th>
            <th>{{ 'VERSION.SIZE' | translate }}</th>
            <th>{{ 'VERSION.ACTIONS' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let version of versions" [class.current-version]="version.version === currentVersion">
            <td>{{ version.version }}</td>
            <td>{{ version.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ getUserName(version) }}</td>
            <td>{{ formatFileSize(version.size) }}</td>
            <td class="actions-cell">
              <button (click)="downloadVersion(version._id, version.name)" class="btn-download">
                <i class="fas fa-download"></i> {{ 'VERSION.DOWNLOAD' | translate }}
              </button>
              <button 
                *ngIf="version.version !== currentVersion" 
                (click)="revertToVersion(version._id)" 
                class="btn-revert">
                <i class="fas fa-history"></i> {{ 'VERSION.REVERT' | translate }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && versions.length === 0" class="empty-state">
        {{ 'VERSION.NO_VERSIONS' | translate }}
      </div>

      <div class="upload-new-version">
        <h4>{{ 'VERSION.UPLOAD_NEW' | translate }}</h4>
        
        <div class="upload-form">
          <div class="form-group">
            <label for="versionFile">{{ 'VERSION.SELECT_FILE' | translate }}</label>
            <input 
              type="file" 
              id="versionFile" 
              (change)="onFileSelected($event)"
              accept=".xlsx,.xls,.csv,.ods"
            >
          </div>
          
          <div class="form-group">
            <label for="versionDesc">{{ 'VERSION.DESCRIPTION' | translate }}</label>
            <textarea 
              id="versionDesc" 
              [(ngModel)]="versionDescription" 
              placeholder="{{ 'VERSION.DESCRIPTION_PLACEHOLDER' | translate }}"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button 
              (click)="uploadNewVersion()" 
              class="btn-primary" 
              [disabled]="!selectedFile || uploading">
              <i class="fas fa-upload"></i> 
              {{ uploading ? ('VERSION.UPLOADING' | translate) : ('VERSION.UPLOAD' | translate) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .versions-container {
      padding: 1rem;
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h3 {
      margin-top: 0;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    
    .versions-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    .versions-table th,
    .versions-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .versions-table th {
      background-color: #f9f9f9;
      font-weight: 600;
    }
    
    .current-version {
      background-color: #f0f8ff;
    }
    
    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-download,
    .btn-revert {
      padding: 0.3rem 0.5rem;
      border: none;
      border-radius: 3px;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .btn-download {
      background-color: #f0f0f0;
      color: #333;
    }
    
    .btn-revert {
      background-color: #eef2ff;
      color: #4f46e5;
    }
    
    .btn-download:hover {
      background-color: #e0e0e0;
    }
    
    .btn-revert:hover {
      background-color: #dde7ff;
    }
    
    .loading-state {
      padding: 1.5rem;
      text-align: center;
      color: #666;
    }
    
    .error-message {
      padding: 1rem;
      background-color: #fff2f2;
      color: #d92626;
      border-radius: 4px;
      margin: 1rem 0;
    }
    
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #666;
      background-color: #f9f9f9;
      border-radius: 4px;
      margin: 1rem 0;
    }
    
    .upload-new-version {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
    }
    
    .btn-primary {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .btn-primary:hover {
      background-color: #4338ca;
    }
    
    .btn-primary:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class FileVersionsComponent implements OnInit {
  @Input() fileId: string = '';
  @Output() versionsUpdated = new EventEmitter<void>();
  
  versions: any[] = [];
  currentVersion: number = 0;
  loading = false;
  error: string | null = null;
  
  selectedFile: File | null = null;
  versionDescription: string = '';
  uploading = false;
  
  // Caché para los nombres de usuarios
  userNameCache: {[key: string]: string} = {};

  constructor(
    private fileVersionService: FileVersionService,
    private toastService: ToastService,
    private translate: TranslateService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    if (!this.fileId) return;
    
    this.loading = true;
    this.fileVersionService.getFileVersions(this.fileId)
      .subscribe({
        next: (response) => {
          this.versions = response.data;
          
          // Recopilar todos los IDs de usuario para cargarlos
          const userIds: string[] = [];
          
          this.versions.forEach(version => {
            // Si uploadedBy es un string (ID), añadirlo a la lista para cargar
            if (typeof version.uploadedBy === 'string') {
              version.uploadedByUserId = version.uploadedBy;
              version.uploadedBy = null;
              
              // Verificar si ya tenemos este ID en caché
              if (!this.userNameCache[version.uploadedByUserId]) {
                userIds.push(version.uploadedByUserId);
              }
            }
          });
          
          if (this.versions.length > 0) {
            this.currentVersion = Math.max(...this.versions.map(v => v.version));
          }
          
          // Cargar nombres de usuarios si hay IDs para cargar
          if (userIds.length > 0) {
            this.loadUserNames(userIds);
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          this.error = 'Error al cargar versiones: ' + (error.message || error);
          this.loading = false;
        }
      });
  }
  
  /**
   * Carga los nombres de usuarios a partir de sus IDs
   */
  loadUserNames(userIds: string[]): void {
    // Crear un array de observables para cada solicitud de usuario
    const requests = userIds.map(userId => 
      this.userService.getUserById(userId).pipe(
        catchError(error => {
          console.error(`Error cargando usuario ${userId}:`, error);
          // Devolver un objeto con un nombre por defecto en caso de error
          return of({ data: { name: this.translate.instant('VERSION.UNKNOWN_USER') }, success: false });
        })
      )
    );
    
    // Ejecutar todas las solicitudes en paralelo
    forkJoin(requests)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (responses) => {
          // Procesar las respuestas y actualizar el caché
          responses.forEach((response, index) => {
            if (response.success && response.data) {
              this.userNameCache[userIds[index]] = response.data.name;
            } else {
              this.userNameCache[userIds[index]] = this.translate.instant('VERSION.UNKNOWN_USER');
            }
          });
          
          // Forzar actualización de la vista
          this.versions = [...this.versions];
        },
        error: (error) => {
          console.error('Error cargando nombres de usuarios:', error);
        }
      });
  }

  downloadVersion(versionId: string, fileName: string): void {
    this.fileVersionService.downloadVersion(versionId)
      .subscribe({
        next: (blob) => {
          // Crear un objeto URL para el blob
          const url = window.URL.createObjectURL(blob);
          // Crear un elemento ancla oculto
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          // Anexar al cuerpo, hacer clic y eliminar
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Liberar el objeto URL
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error al descargar versión:', error);
          this.toastService.showError('Error al descargar la versión del archivo');
        }
      });
  }

  revertToVersion(versionId: string): void {
    if (confirm('¿Está seguro de que desea revertir a esta versión? Esta acción creará una nueva versión basada en la seleccionada.')) {
      this.fileVersionService.revertToVersion(this.fileId, versionId)
        .subscribe({
          next: (response) => {
            this.toastService.showSuccess('Archivo revertido exitosamente a la versión seleccionada');
            this.loadVersions();
            this.versionsUpdated.emit();
          },
          error: (error) => {
            console.error('Error al revertir versión:', error);
            this.toastService.showError('Error al revertir a la versión seleccionada');
          }
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  uploadNewVersion(): void {
    if (!this.selectedFile) return;
    
    this.uploading = true;
    this.fileVersionService.uploadNewVersion(this.fileId, this.selectedFile, this.versionDescription)
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Nueva versión subida exitosamente');
          this.selectedFile = null;
          this.versionDescription = '';
          this.uploading = false;
          this.loadVersions();
          this.versionsUpdated.emit();
        },
        error: (error) => {
          console.error('Error al subir versión:', error);
          this.toastService.showError('Error al subir la nueva versión');
          this.uploading = false;
        }
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el nombre del usuario que subió la versión
   */
  getUserName(version: any): string {
    // Caso 1: Objeto uploadedBy con propiedad name
    if (version.uploadedBy && version.uploadedBy.name) {
      return version.uploadedBy.name;
    }
    
    // Caso 2: Propiedad uploadedByName
    if (version.uploadedByName) {
      return version.uploadedByName;
    }
    
    // Caso 3: ID del usuario en caché
    if (version.uploadedByUserId && this.userNameCache[version.uploadedByUserId]) {
      return this.userNameCache[version.uploadedByUserId];
    }
    
    // Caso 4: Solo tenemos el ID pero no está en caché
    if (version.uploadedByUserId) {
      return `${this.translate.instant('VERSION.USER_ID')}: ${version.uploadedByUserId.substring(0, 8)}...`;
    }
    
    // Caso por defecto: Usuario desconocido
    return this.translate.instant('VERSION.UNKNOWN_USER');
  }
} 