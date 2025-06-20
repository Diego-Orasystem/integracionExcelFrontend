import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileHelpers {
  /**
   * Obtiene el icono correspondiente según la extensión del archivo
   */
  getFileIconByExtension(fileName: string): string {
    if (!fileName) return 'alt';
    
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const iconMap: {[key: string]: string} = {
      // Documentos
      'pdf': 'pdf',
      'doc': 'word',
      'docx': 'word',
      'txt': 'alt',
      'rtf': 'alt',
      
      // Hojas de cálculo
      'xls': 'excel',
      'xlsx': 'excel',
      'csv': 'csv',
      
      // Presentaciones
      'ppt': 'powerpoint',
      'pptx': 'powerpoint',
      
      // Imágenes
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'svg': 'image',
      'bmp': 'image',
      
      // Comprimidos
      'zip': 'archive',
      'rar': 'archive',
      '7z': 'archive',
      'tar': 'archive',
      'gz': 'archive',
      
      // Audio/Video
      'mp3': 'audio',
      'wav': 'audio',
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      
      // Código
      'html': 'code',
      'css': 'code',
      'js': 'code',
      'json': 'code',
      'xml': 'code',
      'py': 'code',
      'java': 'code'
    };
    
    return iconMap[extension] || 'alt';
  }
  
  /**
   * Formatea el tamaño de archivo a una unidad legible
   */
  getFileSizeLabel(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Obtiene la extensión de un archivo a partir de su nombre
   */
  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
  }
  
  /**
   * Verifica si un tipo MIME corresponde a una imagen
   */
  isImageFile(mimeType: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }
} 