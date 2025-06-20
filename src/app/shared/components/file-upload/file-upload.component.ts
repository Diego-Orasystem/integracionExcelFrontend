import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  standalone: true,
  imports: [CommonModule, FileSizePipe, FormsModule]
})
export class FileUploadComponent {
  @Input() accept: string = '.xlsx,.xls';
  @Input() multiple: boolean = false;
  @Input() label: string = 'Seleccionar archivo';
  @Input() allowCustomName: boolean = true;
  @Output() fileSelected: EventEmitter<File[]> = new EventEmitter<File[]>();
  @Output() fileSelectedWithCustomName: EventEmitter<{files: File[], customNames: string[]}> = new EventEmitter();
  
  files: File[] = [];
  customNames: string[] = [];
  
  constructor() { }
  
  onFileSelected(event: any): void {
    this.files = Array.from(event.target.files);
    
    // Inicializar los nombres personalizados con los nombres originales
    if (this.allowCustomName) {
      this.customNames = this.files.map(file => file.name);
    }
    
    if (this.allowCustomName) {
      this.fileSelectedWithCustomName.emit({
        files: this.files,
        customNames: this.customNames
      });
    } else {
      this.fileSelected.emit(this.files);
    }
  }
  
  removeFile(index: number): void {
    this.files.splice(index, 1);
    
    if (this.allowCustomName) {
      this.customNames.splice(index, 1);
      this.fileSelectedWithCustomName.emit({
        files: this.files,
        customNames: this.customNames
      });
    } else {
      this.fileSelected.emit(this.files);
    }
  }
  
  updateCustomName(index: number, name: string): void {
    this.customNames[index] = name;
    this.fileSelectedWithCustomName.emit({
      files: this.files,
      customNames: this.customNames
    });
  }
  
  handleNameChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    this.updateCustomName(index, input.value);
  }
  
  formatFileSize(size: number): string {
    if (size === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(1024));
    
    return (size / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
  }
} 