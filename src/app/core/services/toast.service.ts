import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$ = this.toastSubject.asObservable();

  constructor() {}

  /**
   * Muestra un mensaje de éxito
   * @param message El mensaje a mostrar
   * @param duration Duración en milisegundos (opcional)
   */
  showSuccess(message: string, duration = 3000): void {
    this.toastSubject.next({
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Muestra un mensaje de error
   * @param message El mensaje a mostrar
   * @param duration Duración en milisegundos (opcional)
   */
  showError(message: string, duration = 5000): void {
    this.toastSubject.next({
      message,
      type: 'error',
      duration
    });
  }

  /**
   * Muestra un mensaje informativo
   * @param message El mensaje a mostrar
   * @param duration Duración en milisegundos (opcional)
   */
  showInfo(message: string, duration = 3000): void {
    this.toastSubject.next({
      message,
      type: 'info',
      duration
    });
  }

  /**
   * Muestra un mensaje de advertencia
   * @param message El mensaje a mostrar
   * @param duration Duración en milisegundos (opcional)
   */
  showWarning(message: string, duration = 4000): void {
    this.toastSubject.next({
      message,
      type: 'warning',
      duration
    });
  }
} 