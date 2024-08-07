import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

@Component({
  selector: 'app-member-inquiry',
  templateUrl: './member-inquiry.page.html',
  styleUrls: ['./member-inquiry.page.scss'],
})
export class MemberInquiryPage implements OnInit {
  inquiryForm: FormGroup;
  loading = false;  // Add a loading state variable

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private functions: AngularFireFunctions
  ) {
    this.inquiryForm = this.fb.group({
      memberName: ['', Validators.required],
      phoneNumber: [''],
      emailAddress: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      club: ['', Validators.required],
      gender: [''],
      color: ['', Validators.required],
    });
  }

  ngOnInit() {}

  async submitInquiryForm() {
    if (this.inquiryForm.valid) {
      this.loading = true;
      let formValue = this.inquiryForm.value;
      formValue = {
        ...formValue,
        name: formValue.name.toLowerCase(),
      };
      try {
        const checkItemInquiry = this.functions.httpsCallable('checkItemInquiry');
        const result = await checkItemInquiry(formValue).toPromise();
        if (result.match) {
          await this.firestore.collection('openInquiries').add(formValue);
          await this.showAlert(
            'Success',
            `Your inquiry has been submitted. We found a matching item with ${(result.score * 100).toFixed(2)}% similarity. The club will contact you soon.`
          );
        } else {
          const inquiryWithStatus = {
            ...formValue,
            status: 'No Matching Item'
          };
          await this.firestore.collection('allInquiries').add(inquiryWithStatus);
          await this.showAlert(
            'No Matches Found',
            `No items matched your description at this time. We've recorded your inquiry, and if something matching your description turns up, we'll be sure to reach out to you. Thank you for your patience!`
          );
        }
        this.inquiryForm.reset();
      } catch (error) {
        console.error('Error submitting inquiry:', error);
        await this.showAlert('Error', 'There was an issue submitting your inquiry. Please try again.');
      } finally {
        this.loading = false;
      }
    } else {
      this.markFormControlsTouched(this.inquiryForm);
    }
  }
  
  // Helper function to mark all form controls as touched
  markFormControlsTouched(group: FormGroup) {
    Object.keys(group.controls).forEach((key) => {
      const control = group.get(key);
      control?.markAsTouched();
    });
  }
 

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
