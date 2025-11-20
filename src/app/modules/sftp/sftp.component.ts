import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SFTPService, SFTPFile, SFTPStatus } from '../../core/services/sftp.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-sftp',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule
  ],
  templateUrl: './sftp.component.html',
  styleUrls: ['./sftp.component.scss']
})
export class SftpComponent implements OnInit, OnDestroy {
  currentPath = '/';
  files: SFTPFile[] = [];
  loading = true;
  error: string | null = null;
  status: SFTPStatus | null = null;
  private statusSubscription?: Subscription;

  constructor(private sftpService: SFTPService) {}

  ngOnInit(): void {
    this.checkStatus();
    this.loadDirectory('/');
    
    // Actualizar estado cada 30 segundos
    this.statusSubscription = interval(30000).subscribe(() => {
      this.checkStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  checkStatus(): void {
    this.sftpService.getStatus().subscribe({
      next: (data) => this.status = data,
      error: (err) => console.error('Error verificando estado:', err)
    });
  }

  loadDirectory(path: string): void {
    this.loading = true;
    this.error = null;
    this.sftpService.listDirectory(path).subscribe({
      next: (data) => {
        if (data.success) {
          this.files = data.files;
          this.currentPath = data.path;
        } else {
          this.error = data.error || 'Error al cargar directorio';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error de conexión: ' + (err.message || 'Error desconocido');
        this.loading = false;
      }
    });
  }

  navigateTo(path: string): void {
    this.loadDirectory(path);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('es-ES');
  }

  getBreadcrumb(): string[] {
    const parts = this.currentPath.split('/').filter(p => p);
    return ['/', ...parts];
  }

  getBreadcrumbPath(index: number): string {
    const breadcrumb = this.getBreadcrumb();
    return breadcrumb.slice(0, index + 1).join('/') || '/';
  }
} 