import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { AreasComponent } from './areas/areas.component';
import { SubareasComponent } from './subareas/subareas.component';

const routes: Routes = [
  { path: 'areas', component: AreasComponent },
  { path: 'subareas', component: SubareasComponent },
  { path: '', redirectTo: 'areas', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class OrganizationModule { } 