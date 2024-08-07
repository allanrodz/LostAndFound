import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Import AngularFireAuth for user authentication

@Component({
  selector: 'app-item-detail-modal',
  templateUrl: './item-detail-modal.component.html',
  styleUrls: ['./item-detail-modal.component.scss'],
})
export class ItemDetailModalComponent {
  @Input() item: any;
  userEmail: string | null = null;

  constructor(
    private modalController: ModalController,
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private afAuth: AngularFireAuth // Inject AngularFireAuth
  ) {
    // Get the logged-in user's email
    this.afAuth.authState.subscribe(user => {
      if (user && user.email) {
        this.userEmail = user.email;
      }
    });
  }
  

  formatDate(dateString: string): string {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async markAsCollected() {
    if (this.userEmail && this.isUserAuthorized()) {
      const alert = await this.alertController.create({
        header: 'Confirm Collection',
        message: 'Are you sure you want to mark this item as collected? This action cannot be undone.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Collection canceled');
            }
          },
          {
            text: 'Collect',
            role: 'destructive',
            handler: async () => {
              this.executeMarkAsCollected(); // Call the function to move and delete the item
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.showAlert('Unauthorized', 'You are not authorized to mark this item as collected. Please contact the respective club.');
    }
  }

  isUserAuthorized(): boolean {
    if (!this.userEmail || !this.item.club) {
      return false;
    }

    // Extract the club name from the user's email
    const emailPrefix = this.userEmail.split('@')[0];
    const clubMap: { [key: string]: string } = {
      'astonquay': 'Aston Quay',
      'clontarf': 'Clontarf',
      'sandymount': 'Sandymount',
      'westmanstown': 'Westmanstown',
      'leopardstown': 'Leopardstown',
      'dunlaoghaire': 'Dun Laoghaire'
    };

    const userClub = clubMap[emailPrefix.toLowerCase()] || '';

    // Check if the user's club matches the item's club
    return userClub.toLowerCase() === this.item.club.toLowerCase();
  }

  executeMarkAsCollected() {
    const batch = this.firestore.firestore.batch();

    // Reference to the current item in the 'items' collection based on its date
    this.firestore.collection<Item>('items', ref => ref.where('date', '==', this.item.date)).get().subscribe(querySnapshot => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];

        // Reference to the new item in the 'collectedItems' collection
        const collectedItemRef = this.firestore.collection('collectedItems').doc(doc.id).ref;

        // Add a new field 'collectedDate' to store the date and time when the item was marked as collected
        const collectedItemData = {
          ...this.item,
          collectedDate: new Date().toISOString()  // Add the current date and time
        };

        // Move to 'collectedItems' collection
        batch.set(collectedItemRef, collectedItemData);

        // Delete from 'items' collection
        batch.delete(doc.ref);

        // Commit the batch
        batch.commit().then(() => {
          console.log('Item marked as collected and moved to collectedItems with collectedDate.');
          this.dismiss(); // Close the modal after the operation
        }).catch(error => {
          console.error('Error marking item as collected: ', error);
          this.showAlert('Error', 'Failed to mark item as collected. Please try again.');
        });
      } else {
        console.error('No matching item found for deletion.');
        this.showAlert('Error', 'No matching item found. Please try again.');
      }
    }, error => {
      console.error('Error fetching item for deletion: ', error);
      this.showAlert('Error', 'Failed to find the item to delete. Please try again.');
    });
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

interface Item {
  id?: string;  // Optional since Firestore auto-generates IDs
  date: string;
  club: string;
  // Add other fields that your `items` collection contains
  [key: string]: any;
}
