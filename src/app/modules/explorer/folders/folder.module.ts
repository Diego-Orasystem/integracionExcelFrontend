import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FolderManagerComponent } from './folder-manager.component';

const routes: Routes = [
  { path: '', component: FolderManagerComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    FolderManagerComponent
  ]
})
export class FolderModule { } 