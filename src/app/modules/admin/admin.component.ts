import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule
  ],
  template: `
    <div class="admin-container">
      <h1>Panel de Administración</h1>
      <p>Administra configuraciones globales del sistema.</p>
      <div class="admin-panel">
        <div class="empty-state">
          <p>Área de administración en construcción</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
    }
    .admin-panel {
      margin-top: 20px;
      min-height: 300px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #777;
    }
    h1 {
      margin-bottom: 15px;
      color: #333;
    }
  `]
})
export class AdminComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // Inicialización del componente
  }
} 