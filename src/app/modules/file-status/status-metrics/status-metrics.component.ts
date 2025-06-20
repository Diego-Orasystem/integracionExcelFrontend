import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { StatusData } from '../../../core/services/file-status.service';

@Component({
  selector: 'app-status-metrics',
  templateUrl: './status-metrics.component.html',
  styleUrls: ['./status-metrics.component.scss']
})
export class StatusMetricsComponent implements OnChanges {
  @Input() statusData: StatusData[] = [];
  
  totalArchivos = 0;
  totalPendientes = 0;
  totalProcesando = 0;
  totalProcesados = 0;
  totalErrores = 0;
  totalSize = 0;
  
  constructor() { }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statusData'] && this.statusData) {
      this.calculateMetrics();
    }
  }
  
  private calculateMetrics(): void {
    this.totalArchivos = 0;
    this.totalPendientes = 0;
    this.totalProcesando = 0;
    this.totalProcesados = 0;
    this.totalErrores = 0;
    this.totalSize = 0;
    
    this.statusData.forEach(item => {
      this.totalArchivos += item.total || 0;
      this.totalPendientes += item.pendiente || 0;
      this.totalProcesando += item.procesando || 0;
      this.totalProcesados += item.procesado || 0;
      this.totalErrores += item.error || 0;
      this.totalSize += item.totalSize || 0;
    });
  }
  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 