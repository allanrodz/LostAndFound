import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InquiriesPage } from './inquiries.page';

const routes: Routes = [
  {
    path: '',
    component: InquiriesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InquiriesPageRoutingModule {}
