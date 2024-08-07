import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { ModalController, AlertController } from '@ionic/angular';
import { ItemDetailModalComponent } from '../item-detail-modal/item-detail-modal.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs/operators';

interface InquiryData {
  memberName: string;
  phoneNumber: string;
  emailAddress: string;
  name: string;
  club: string;
  brand: string;
  gender: string;
  color: string;
}

interface Item {
  name: string;
  date: string;
  brand?: string;
  color: string;
  club: string;
  gender?: string;
  category: string;
  imageUrl?: string;
}

interface Item {
  name: string;
  date: string;
  brand?: string;
  color: string;
  club: string;
  gender?: string;
  category: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-inquiries',
  templateUrl: './inquiries.page.html',
  styleUrls: ['./inquiries.page.scss'],
})

export class InquiriesPage implements OnInit {

  availableItems: Item[] = [];
  showAiMessage: boolean = true;  // Variable to control AI message visibility
  openInquiries: Observable<any[]> = of([]);
  allInquiries: Observable<any[]> = of([]);
  filteredOpenInquiries: Observable<any[]> = of([]);
  filteredAllInquiries: Observable<any[]> = of([]);
  inquiryForm: FormGroup;
  loggedInClub: string = '';
  clubs: string[] = ['Aston Quay', 'Clontarf', 'Sandymount', 'Westmanstown', 'Leopardstown', 'Dun Laoghaire'];
  selectedClub: string = '';
  inquiryPlaceholders: { [inquiryId: string]: string } = {};  // Add this line

  constructor(
    private firestore: AngularFirestore, 
    private modalController: ModalController,
    private alertController: AlertController,
    private fb: FormBuilder,
    private afAuth: AngularFireAuth
  ) {
    this.inquiryForm = this.fb.group({
      name: ['', Validators.required],
      club: ['', Validators.required],
      gender: [''],
      color: ['']
    });
  }

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.loggedInClub = this.getClubFromEmail(user.email || '');
        this.selectedClub = this.loggedInClub;  // Set the default selected club to the logged-in club
        this.loadInquiries();
        this.loadItems();  // Load items for the logged-in club on initialization
      }
    });
  }
  
  loadItems() {
    console.log(`Loading items for club: ${this.selectedClub}`);
    this.firestore.collection('items', ref => ref.where('club', '==', this.selectedClub))
      .valueChanges()
      .subscribe(items => {
        this.availableItems = items as Item[];
        console.log('Available items:', this.availableItems);
      });
  }
  
  assignItemManually(inquiry: any) {
    const selectedItem = this.availableItems.find(item => item.name === inquiry.selectedItemName);
  
    if (selectedItem) {
      inquiry.selectedItem = selectedItem;
  
      // Update the placeholder text to indicate that an item has been selected
      this.inquiryPlaceholders[inquiry.id] = inquiry.selectedItemName;
  
      // Save the manually selected item to the inquiry
      this.firestore.collection('allInquiries').doc(inquiry.id).update({
        manuallyAssignedItem: selectedItem
      }).then(() => {
        console.log(`Item ${selectedItem.name} assigned to inquiry ${inquiry.id}`);
      }).catch(error => {
        console.error('Error updating inquiry:', error);
      });
    } else {
      console.warn('No item selected');
    }
  }
  

  loadItemsForInquiry(club: string): Promise<void> {
    console.log(`Loading items for club: ${club}`);
    return new Promise<void>((resolve, reject) => {
      this.firestore.collection('items', ref => ref.where('club', '==', club))
        .valueChanges()
        .subscribe(items => {
          this.availableItems = items as Item[];
          console.log('Available items:', this.availableItems);
          resolve(); // Resolve the promise once items are loaded
        }, error => {
          console.error('Error loading items:', error);
          reject(error);
        });
    });
  }

  sendManualEmailToMember(inquiry: any) {
    // Fetch the manually assigned item directly from the inquiry object
    const item = inquiry.manuallyAssignedItem;

    if (!item) {
      this.showAlert('No Item Assigned', 'Please assign an item before sending an email.');
      return;
    }

    // Construct and send the email using the manually assigned item
    const memberName = inquiry.memberName;
    const memberEmail = inquiry.emailAddress;
    const clubName = inquiry.club;

    const subject = `Regarding your lost item inquiry - ${inquiry.name}`;

    const body = `Hi ${memberName},\n\n` +
                `I hope you're well.\n\n` +
                `We recently received your inquiry about a lost ${inquiry.name}. Although our system didn't automatically find an exact or correct match, we have identified an item that might be what you're looking for.\n\n` +
                `Item Details:\n` +
                `- Name: ${item.name}\n` +
                `- Date: ${new Date(item.date).toLocaleDateString()}\n` +
                `- Color: ${item.color}\n` +
                `- Club: ${clubName}\n` +
                `- Gender: ${item.gender || 'N/A'}\n` +
                `- Category: ${item.category}\n\n` +
                `Item Image:\n` +
                `You can view it here: ${item.imageUrl || 'N/A'}\n\n` +
                `Can you please confirm if this is your lost item?\n\n` +
                `Looking forward to hearing from you.\n\n` +
                `Thank you,\n` +
                `Westwood Club ${clubName}`;

    const mailtoLink = `mailto:${memberEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');

  }


  hideAiMessage() {
    this.showAiMessage = false;
  }


  getClubFromEmail(email: string): string {
    const emailPrefix = email.split('@')[0];
    const clubMap: { [key: string]: string } = {
      'astonquay': 'Aston Quay',
      'clontarf': 'Clontarf',
      'sandymount': 'Sandymount',
      'westmanstown': 'Westmanstown',
      'leopardstown': 'Leopardstown',
      'dunlaoghaire': 'Dun Laoghaire'
    };
    return clubMap[emailPrefix.toLowerCase()] || '';
  }

  loadInquiries() {
    this.openInquiries = this.firestore.collection('openInquiries').valueChanges({ idField: 'id' });
    this.allInquiries = this.firestore.collection('allInquiries').valueChanges({ idField: 'id' });
    this.filterInquiries();
  }

  filterInquiries() {
    this.filteredOpenInquiries = this.openInquiries.pipe(
      map(inquiries => inquiries.filter(inquiry => this.selectedClub === 'all' || inquiry.club === this.selectedClub))
    );

    this.filteredAllInquiries = this.allInquiries.pipe(
      map(inquiries => inquiries.filter(inquiry => this.selectedClub === 'all' || inquiry.club === this.selectedClub))
    );
  }

  async confirmEmailSent(inquiryId: string) {
    const inquiryDoc = await this.firestore.collection('openInquiries').doc(inquiryId).get().toPromise();
    if (inquiryDoc && inquiryDoc.exists) {
      const inquiryData = inquiryDoc.data() as InquiryData;
      if (inquiryData && this.loggedInClub === inquiryData.club) {
        const alert = await this.alertController.create({
          header: 'Solve and Archive',
          message: 'Are you sure you want to confirm the email was sent to the member? Once confirmed, this action cannot be undone.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Confirmation canceled');
              }
            },
            {
              text: 'Confirm',
              handler: async () => {
                // Add the inquiry to the allInquiries collection with the status update
                await this.firestore.collection('allInquiries').add({
                  ...inquiryData,
                  emailSent: true,
                  status: 'Email Sent to Member' // Update the status
                });
  
                // Remove the inquiry from the openInquiries collection
                await this.firestore.collection('openInquiries').doc(inquiryId).delete();
  
                // Display a success alert
                await this.showAlert('Success', 'Email confirmed and inquiry moved to All Inquiries with status updated to "Email Sent to Member".');
              }
            }
          ]
        });
        await alert.present();
      } else {
        await this.showAlert('For another Club', 'You do not have permission to confirm this inquiry.');
      }
    }
  }
  

  async confirmEmailSentToMember(inquiry: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Email Sent',
      message: 'Are you sure you want to mark this email as sent?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Email confirmation canceled');
          }
        },
        {
          text: 'Confirm',
          handler: async () => {
            // Update the status to 'Email Sent to Member'
            await this.firestore.collection('allInquiries').doc(inquiry.id).update({
              status: 'Email Sent to Member'
            }).then(() => {
              console.log(`Email status updated for inquiry ${inquiry.id}`);
              inquiry.status = 'Email Sent to Member'; // Update the local status
            }).catch(error => {
              console.error('Error updating status:', error);
            });
          }
        }
      ]
    });
    await alert.present();
  }
  

  async openItemDetail(inquiry: any) {
    const nameLowerCase = inquiry.name.toLowerCase();
    const colorLowerCase = inquiry.color.toLowerCase();
    const brandLowerCase = inquiry.brand ? inquiry.brand.toLowerCase() : null;
    const genderLowerCase = inquiry.gender ? inquiry.gender.toLowerCase() : null;
  
    // Fetch all items in the club
    const itemsSnapshot = await this.firestore.collection('items', ref => 
      ref.where('club', '==', inquiry.club)
    ).get().toPromise();
  
    if (itemsSnapshot && !itemsSnapshot.empty) {
      const items = itemsSnapshot.docs.map(doc => doc.data() as Item);
  
      let bestMatch = null;
      let highestMatchCount = 0;
  
      // Iterate over each item and count the number of matching fields
      items.forEach(item => {
        let matchCount = 0;
  
        if (item.name && item.name.toLowerCase().includes(nameLowerCase)) matchCount++;
        if (item.color && item.color.toLowerCase() === colorLowerCase) matchCount++;
        if (item.brand && brandLowerCase && item.brand.toLowerCase() === brandLowerCase) matchCount++;
        if (item.gender && genderLowerCase && item.gender.toLowerCase() === genderLowerCase) matchCount++;
  
        // Track the best match based on the highest match count
        if (matchCount > highestMatchCount) {
          highestMatchCount = matchCount;
          bestMatch = item;
        }
      });
  
      if (bestMatch) {
        // If a manual item is selected and inquiry.selectedItem exists, do not overwrite bestMatch
        if (!inquiry.selectedItem) {
          inquiry.selectedItem = bestMatch;  // This ensures the correct item is shown in detail
        }
  
        const modal = await this.modalController.create({
          component: ItemDetailModalComponent,
          componentProps: { item: bestMatch }
        });
        await modal.present();
      } else {
        await this.showAlert('No Item Found', 'No item matches the description provided in the inquiry.');
      }
    } else {
      await this.showAlert('No Item Found', 'No items found in the selected club.');
    }
  }
  

  async openItemDetailManuallySelectedItem(inquiry: any) {
    // Fetch the manually assigned item directly from the inquiry object
    const selectedItem = inquiry.manuallyAssignedItem;

    if (selectedItem) {
      const modal = await this.modalController.create({
        component: ItemDetailModalComponent,
        componentProps: { item: selectedItem }
      });
      await modal.present();
    } else {
      await this.showAlert('No Item Selected', 'Please assign an item manually before viewing its details.');
    }
  }

  async sendEmailToMember(inquiry: any) {
    const nameLowerCase = inquiry.name.toLowerCase();
    const colorLowerCase = inquiry.color.toLowerCase();

    // Fetch all items in the club
    const itemsSnapshot = await this.firestore.collection('items', ref => 
      ref.where('club', '==', inquiry.club)
    ).get().toPromise();

    if (itemsSnapshot && !itemsSnapshot.empty) {
      const items = itemsSnapshot.docs.map(doc => doc.data() as Item);

      let matchingItem: Item | null = null;
      let highestMatchCount = 0;

      // Iterate over each item and count the number of matching fields (name and color)
      items.forEach(item => {
        let matchCount = 0;

        if (item.name && item.name.toLowerCase().includes(nameLowerCase)) matchCount++;
        if (item.color && item.color.toLowerCase() === colorLowerCase) matchCount++;

        // Track the best match based on the highest match count
        if (matchCount > highestMatchCount) {
          highestMatchCount = matchCount;
          matchingItem = item;
        }
      });

      if (matchingItem) {
        const user = await this.afAuth.currentUser;
        const userEmail = user?.email || '';
        const userClub = this.getClubFromEmail(userEmail);

        if (userClub !== inquiry.club) {
          this.showAlert('Unauthorized', 'You do not have permission to send an email for this club.');
          return;
        }

        const memberName = inquiry.memberName;
        const memberEmail = inquiry.emailAddress;
        const clubName = inquiry.club;
        
        // Use a type assertion here to ensure TypeScript recognizes matchingItem as Item
        const item = matchingItem as Item;
        
        const subject = `Regarding your lost item inquiry - ${inquiry.name}`;
        
        const body = `Hi ${memberName},\n\n` +
                    `I hope you're well.\n\n` +
                    `We recently received your inquiry about a lost ${inquiry.name}, and we have something that matches the details you provided.\n\n` +
                    `Item Details:\n` +
                    `- Name: ${item.name}\n` +
                    `- Date: ${new Date(item.date).toLocaleDateString()}\n` +
                    `- Color: ${item.color}\n` +
                    `- Club: ${clubName}\n` +
                    `- Gender: ${item.gender || 'N/A'}\n` +
                    `- Category: ${item.category}\n\n` +
                    `Item Image: \n` +
                    `You can view it here: ${item.imageUrl || 'N/A'}\n\n` +
                    `Can you please confirm if this is the lost item you're looking for?\n\n` +
                    `Looking forward to hearing from you.\n\n` +
                    `Thank you,\n` +
                    `Westwood Club ${clubName}`;
        
        const mailtoLink = `mailto:${memberEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
      } else {
        this.showAlert('No Match Found', 'No matching item found in the database.');
      }
    } else {
      this.showAlert('No Match Found', 'No items found in the selected club.');
    }
  }


  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  downloadQrInstructions() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    const qrImage = new Image();
    const logoImage = new Image();
  
    qrImage.src = 'assets/qr.png';
    logoImage.src = 'assets/images.png';  // Assuming this is the correct path to your logo
  
    // Ensure both images are loaded before drawing
    Promise.all([
      new Promise((resolve) => { qrImage.onload = resolve; }),
      new Promise((resolve) => { logoImage.onload = resolve; })
    ]).then(() => {
      canvas.width = 500;
      canvas.height = 750;  // Increased height to accommodate the logo and title
  
      // Background color
      context!.fillStyle = '#fff';
      context!.fillRect(0, 0, canvas.width, canvas.height);
  
      // Draw the logo
      context!.drawImage(logoImage, 150, 20, 200, 200);  // Centered logo, adjust positions if needed
  
      // Title
      context!.font = 'bold 24px Arial';
      context!.fillStyle = '#000';
      context!.fillText('Lost Something? Find it.', 90, 250);  // Adjust position to be under the logo
  
      // QR Code
      context!.drawImage(qrImage, 25, 300, 200, 200);  // Adjust position to be under the title
  
      // Instructions
      context!.font = '20px Arial';
      context!.fillStyle = '#000';
      context!.fillText('Simple Steps:', 250, 330);
      context!.fillText('1. Scan with your phone.', 250, 380);
      context!.fillText('2. Complete the form.', 250, 430);
      context!.fillText('3. That’s it!', 250, 480);
  
      // Create a download link and trigger the download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'QR_Code_Instructions.png';
      link.click();
    });
  }
  
}
