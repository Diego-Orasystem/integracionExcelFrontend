import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ExplorerComponent } from './explorer.component';

const routes: Routes = [
  { path: '', component: ExplorerComponent },
  { path: 'folders', loadChildren: () => import('./folders/folder.module').then(m => m.FolderModule) }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ExplorerModule { } 