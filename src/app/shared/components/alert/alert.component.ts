import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AlertComponent {
  @Input() type: 'success' | 'warning' | 'danger' | 'info' = 'info';
  @Input() message: string = '';
  @Input() dismissible: boolean = true;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  
  constructor() { }
  
  onClose(): void {
    this.close.emit();
  }
} 