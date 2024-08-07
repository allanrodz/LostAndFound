import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';  // Import ReactiveFormsModule
import { IonicModule } from '@ionic/angular';

import { InquiriesPageRoutingModule } from './inquiries-routing.module';
import { InquiriesPage } from './inquiries.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,  // Add ReactiveFormsModule here
    IonicModule,
    InquiriesPageRoutingModule
  ],
  declarations: [InquiriesPage]
})
export class InquiriesPageModule {}
