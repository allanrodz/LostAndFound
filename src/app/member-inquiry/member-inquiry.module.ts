import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MemberInquiryPageRoutingModule } from './member-inquiry-routing.module';
import { MemberInquiryPage } from './member-inquiry.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,  // Add ReactiveFormsModule here
    IonicModule,
    MemberInquiryPageRoutingModule
  ],
  declarations: [MemberInquiryPage]
})
export class MemberInquiryPageModule {}
