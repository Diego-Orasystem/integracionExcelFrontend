import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { FileStatusDashboardComponent } from './file-status-dashboard/file-status-dashboard.component';
import { PuzzleVisualizationComponent } from './puzzle-visualization/puzzle-visualization.component';
import { StatusMetricsComponent } from './status-metrics/status-metrics.component';
import { HttpClientModule } from '@angular/common/http';

const routes: Routes = [
  { path: '', component: FileStatusDashboardComponent }
];

@NgModule({
  declarations: [
    FileStatusDashboardComponent,
    PuzzleVisualizationComponent,
    StatusMetricsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    FileStatusDashboardComponent,
    PuzzleVisualizationComponent,
    StatusMetricsComponent
  ]
})
export class FileStatusModule { } 