import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-card">
      <div class="card-header">
        <h2>{{ title }}</h2>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .card-header {
      padding: 15px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #eee;
    }
    
    .card-header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #444;
    }
    
    .card-body {
      padding: 20px;
      flex: 1;
    }
  `]
})
export class DashboardCardComponent {
  @Input() title: string = '';
} 