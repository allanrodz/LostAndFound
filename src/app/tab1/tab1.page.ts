import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  searchCriteria: string = 'keywords';
  keyword: string = '';
  dateRange: any = {
    start: '',
    end: ''
  };
  tempDate: string = '';
  dateSelectionMode: 'start' | 'end' = 'start';
  datePickerLabel: string = 'Select Start Date';
  searchResults: any[] = [];
  selectedItem: any;

  constructor(private alertController: AlertController, private firestore: AngularFirestore) {}

  async searchByKeyword() {
    if (!this.keyword.trim()) {
      const alert = await this.alertController.create({
        header: 'Missing Keyword',
        message: 'Please enter a keyword to search for.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.firestore.collection('items', ref => ref.where('keyword', '==', this.keyword))
      .get()
      .subscribe(querySnapshot => {
        this.searchResults = querySnapshot.docs.map(doc => doc.data());
        if (this.searchResults.length === 0) {
          this.showAlert('No records found!', 'Fail');
        }
      }, error => {
        this.showAlert('No records found!', 'Fail');
      });
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value).toISOString();
    if (this.dateSelectionMode === 'start') {
      this.dateRange.start = selectedDate;
    } else {
      this.dateRange.end = selectedDate;
    }
  }

  toggleDateSelection() {
    if (this.dateSelectionMode === 'start') {
      this.dateSelectionMode = 'end';
      this.datePickerLabel = 'Select End Date';
    } else {
      this.dateSelectionMode = 'start';
      this.datePickerLabel = 'Select Start Date';
    }
  }

  async searchByDates() {
    const { start, end } = this.dateRange;

    if (!start || !end) {
      const alert = await this.alertController.create({
        header: 'Missing Dates',
        message: 'Please select a valid date range.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.firestore.collection('items', ref => ref.where('date', '>=', start).where('date', '<=', end))
      .get()
      .subscribe(querySnapshot => {
        this.searchResults = querySnapshot.docs.map(doc => doc.data());
        if (this.searchResults.length === 0) {
          this.showAlert('No records found!', 'Fail');
        }
      }, error => {
        this.showAlert('No records found!', 'Fail');
      });
  }

  selectSearchResult(item: any) {
    this.selectedItem = item;
  }

  async editItem() {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: 'Are you sure you want to edit this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            // Update the record in the Firestore
            this.firestore.collection('items').doc(this.selectedItem.id).update(this.selectedItem);
          }
        }
      ]
    });
    await alert.present();
  }

  async markAsCollected() {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: 'Are you sure you want to mark this item as collected?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.firestore.collection('items').doc(this.selectedItem.id).delete();
            this.resetFieldsSearch();
          }
        }
      ]
    });
    await alert.present();
  }

  async generatePDF() {
    // Implement PDF generation logic here
    // You can use libraries like jsPDF or pdfMake
  }

  resetFieldsSearch() {
    this.searchResults = [];
    this.selectedItem = null;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
