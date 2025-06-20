import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule
  ],
  template: `
    <div class="chart-container">
      <canvas
        baseChart
        [data]="chartData"
        [options]="chartOptions"
        [type]="chartType">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 100%;
      width: 100%;
      min-height: 150px;
    }
  `]
})
export class ChartComponent implements OnChanges {
  @Input() data: any = null;
  @Input() type: ChartType = 'bar';
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartData: ChartData = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    }
  };

  get chartType(): ChartType {
    return this.type;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.data;
      this.updateChart();
    }
    
    if (changes['type'] && this.chart) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (this.chart) {
      this.chart.update();
    }
  }
} 