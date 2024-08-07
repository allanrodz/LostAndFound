import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MemberInquiryPage } from './member-inquiry.page';

const routes: Routes = [
  {
    path: '',
    component: MemberInquiryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemberInquiryPageRoutingModule {}
