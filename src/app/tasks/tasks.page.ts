import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
})
export class TasksPage implements OnInit {
  hasExpiredItems: boolean = false; // Determine if there are expired items
  showExpiredItemsMessage: boolean = true;  // Variable to control expired items message visibility
  
  // ... other existing properties and methods

  hideExpiredItemsMessage() {
    this.showExpiredItemsMessage = false;
  }

  filters = {
    club: '',
    category: '',
    gender: '',
    color: '',
    condition: '',
    brand: '',
    sortOrder: 'newest' // Default to "Newest First"
  };

  reportData: Item[] = [];
  showDiscardButton = false;
  userEmail = 'user@example.com';

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || 'Anonymous';
        const club = this.getClubFromEmail(this.userEmail);
        if (club) {
          this.filters.club = club;
        }
      }
    });
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

  generateReport() {
    this.showDiscardButton = false;
  
    this.firestore.collection<Item>('items').valueChanges().pipe(
      map((items: Item[]) => {
        return items
          .filter((item: Item) => {
            return (
              (this.filters.club ? item.club === this.filters.club : true) &&
              (this.filters.category ? item.category === this.filters.category : true) &&
              (this.filters.gender ? item.gender === this.filters.gender : true) &&
              (this.filters.color ? item.color === this.filters.color : true) &&
              (this.filters.condition ? item.condition === this.filters.condition : true) &&
              (this.filters.brand ? item.brand === this.filters.brand : true)
            );
          })
          .sort((a, b) => {
            const dateA = new Date(a.date || '1970-01-01').getTime(); // Default to epoch if undefined
            const dateB = new Date(b.date || '1970-01-01').getTime(); // Default to epoch if undefined
            if (this.filters.sortOrder === 'oldest') {
              return dateA - dateB; // Oldest first
            } else {
              return dateB - dateA; // Newest first
            }
          })
          .map(item => { 
            if (item.date) {
              const dateObj = new Date(item.date);
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear();
              const hours = dateObj.getHours().toString().padStart(2, '0');
              const minutes = dateObj.getMinutes().toString().padStart(2, '0');
              item.date = `${day}/${month}/${year} at ${hours}:${minutes}`;
            }
            return item;
          });
      })
    ).subscribe((filteredItems: Item[]) => {
      this.reportData = filteredItems.map(item => ({
        name: item.name, // Include item name in the report
        ...item
      }));
    });
  }
  

  downloadReport() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.reportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'report');
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${fileName}_${new Date().getTime()}.xlsx`);
  }

  generateExpiredItemsReport() {
    const now = new Date();
    const expirationDate = new Date(now.setDate(now.getDate() - 21));
  
    this.firestore.collection<Item>('items').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Item;
        const id = a.payload.doc.id;
        return { id, ...data };
      })),
      map((items: Item[]) => {
        return items.filter((item: Item) => {
          const itemDate = new Date(item.date || '');
          return itemDate <= expirationDate && (this.filters.club ? item.club === this.filters.club : true);
        }).map(item => {
          if (item.date) {
            const dateObj = new Date(item.date);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            item.date = `${day}/${month}/${year} at ${hours}:${minutes}`;
          }
          return item;
        });
      })
    ).subscribe((expiredItems: Item[]) => {
      this.reportData = expiredItems.map(item => ({
        name: item.name, // Include item name in the expired items report
        ...item
      }));
      this.showDiscardButton = expiredItems.length > 0;
      if (expiredItems.length === 0) {
        this.showNoExpiredItemsAlert();
      }
    });
  }
  

  async discardExpiredItems() {
    if (this.filters.club && this.isUserAuthorized()) {
      const alert = await this.alertController.create({
        header: 'Confirm Discard',
        message: 'Are you sure you want to discard all expired items? This action cannot be undone.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {}
          },
          {
            text: 'Discard',
            role: 'destructive',
            handler: () => {
              this.executeDiscardExpiredItems();
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.showAlert('Unauthorized', 'You are not authorized to discard items for this club. Please contact the respective club.');
    }
  }

  isUserAuthorized(): boolean {
    if (!this.userEmail || !this.filters.club) {
      return false;
    }

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
    return userClub.toLowerCase() === this.filters.club.toLowerCase();
  }

  executeDiscardExpiredItems() {
    const now = new Date();
    const expirationDate = new Date(now.setDate(now.getDate() - 21));

    this.firestore.collection<Item>('items', ref => ref.where('date', '<=', expirationDate.toISOString())).get().subscribe(querySnapshot => {
      const batch = this.firestore.firestore.batch();

      querySnapshot.forEach(doc => {
        const itemData = doc.data() as Item;
        const expiredItemRef = this.firestore.collection('expiredItems').doc(doc.id).ref;

        batch.set(expiredItemRef, itemData);
        batch.delete(doc.ref);
      });

      batch.commit().then(() => {
        this.showDiscardButton = false;
        this.showAlert('Success', 'Expired items have been discarded.');
      }).catch(error => {
        this.showAlert('Error', 'Failed to discard expired items. Please try again.');
      });
    });
  }

  async showNoExpiredItemsAlert() {
    const alert = await this.alertController.create({
      header: 'No Expired Items',
      message: `There are no expired items for the selected club.`,
      buttons: ['OK']
    });

    await alert.present();
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
  id?: string;
  name?: string;  // Add the name property here
  club: string;
  category: string;
  gender?: string;
  color?: string;
  condition?: string;
  brand?: string;
  storage?: string;
  bag?: string;
  imageUrl?: string;
  date?: string;
}


const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
