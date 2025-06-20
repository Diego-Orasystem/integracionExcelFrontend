import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirmar';
  @Input() message: string = '¿Estás seguro de realizar esta acción?';
  @Input() confirmBtnText: string = 'Confirmar';
  @Input() cancelBtnText: string = 'Cancelar';
  @Input() showDialog: boolean = false;
  
  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  
  constructor() { }
  
  onConfirm(): void {
    this.confirm.emit();
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
} 