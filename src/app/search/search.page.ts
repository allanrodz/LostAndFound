import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { ItemDetailModalComponent } from '../item-detail-modal/item-detail-modal.component';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Import AngularFireAuth

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  

  items$: Observable<any[]> = of([]); // Observable holding all items
  filteredItems$: Observable<any[]> = of([]); // Observable holding filtered items
  filters = {
    category: '',
    club: '',
    gender: '',
    color: '',
    condition: '',
    keyword: '',
    sortOrder: 'newest' // Default to "Newest First"
  };
  userEmail = 'user@example.com'; // Default user email

  constructor(
    private firestore: AngularFirestore, 
    private modalController: ModalController,
    private afAuth: AngularFireAuth // Inject AngularFireAuth
  ) {}

  formatDate(dateString: string): string {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  }

  ngOnInit() {
    // Get the current user email and auto-fill the club filter
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || 'Anonymous';
        const club = this.getClubFromEmail(this.userEmail);
        if (club) {
          this.filters.club = club;
        }
        this.applyFilters(); // Apply filters after setting the club
      }
    });

    // Fetch all items from Firestore
    this.items$ = this.firestore.collection('items').valueChanges();
    
    // Initially, show all items
    this.filteredItems$ = this.items$;
  }

  // Method to extract the club name from the user's email
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

  applyFilters() {
    this.filteredItems$ = this.items$.pipe(
      map(items => items
        .filter(item => {
          return (this.filters.category ? item.category === this.filters.category : true) &&
                 (this.filters.club ? item.club === this.filters.club : true) &&
                 (this.filters.gender ? item.gender === this.filters.gender : true) &&
                 (this.filters.color ? item.color === this.filters.color : true) &&
                 (this.filters.condition ? item.condition === this.filters.condition : true) &&
                 (this.filters.keyword ? item.name.toLowerCase().includes(this.filters.keyword.toLowerCase()) : true);
        })
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (this.filters.sortOrder === 'oldest') {
            return dateA - dateB; // Oldest first
          } else {
            return dateB - dateA; // Newest first
          }
        })
      )
    );
  }

  async openItemDetail(item: any) {
    const modal = await this.modalController.create({
      component: ItemDetailModalComponent,
      componentProps: { item }
    });
    await modal.present();
  }
}
