import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

interface StorageLocation {
  location: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  addItemForm: FormGroup;
  boxes: string[] = []; // Box options
  locations: string[] = []; // Storage locations
  file: File | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {
    this.addItemForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      box: ['', Validators.required],
      bag: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      foundLocation: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.firestore.collection<StorageLocation>('StorageLocation').get().subscribe(querySnapshot => {
      this.locations = querySnapshot.docs.map(doc => (doc.data() as StorageLocation).location);
      console.log('Fetched locations:', this.locations); // Log fetched locations
    }, error => {
      this.showAlert('Error', 'There was an error loading storage locations.');
      console.error(error);
    });
  }

  onFileChange(event: any) {
    this.file = event.target.files[0];
  }

  logInvalidFields() {
    const invalidFields = [];
    for (const field in this.addItemForm.controls) {
      if (this.addItemForm.controls[field].invalid) {
        invalidFields.push(field);
      }
    }
    console.log('Invalid fields:', invalidFields);
  }

  async onSubmit() {
    if (this.addItemForm.invalid) {
      this.logInvalidFields();
      this.showAlert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const formData = this.addItemForm.value;
    const date = new Date().toISOString(); // Set the current date and time
    const filePath = this.file ? this.file.name : null;

    try {
      // Save image to Firebase Storage if a file is selected
      let fileUrl = null;
      if (this.file) {
        const fileRef = this.storage.ref(`images/${filePath}`);
        const task = this.storage.upload(`images/${filePath}`, this.file);

        task.snapshotChanges().pipe(
          finalize(async () => {
            fileUrl = await fileRef.getDownloadURL().toPromise();
            // Save form data to Firestore
            await this.saveItemToFirestore(formData, date, fileUrl);
          })
        ).subscribe();
      } else {
        // Save form data to Firestore
        await this.saveItemToFirestore(formData, date, fileUrl);
      }
    } catch (error) {
      this.showAlert('Error', 'There was an error adding the item.');
      console.error(error);
    }
  }

  async saveItemToFirestore(formData: any, date: string, fileUrl: string | null) {
    await this.firestore.collection('items').add({
      name: formData.name,
      date: date,
      description: formData.description,
      box: formData.box,
      bag: formData.bag,
      foundLocation: formData.foundLocation,
      filePath: fileUrl,
    });

    this.showAlert('Success', 'Item added successfully.');
    this.resetForm();
  }

  resetForm() {
    this.addItemForm.reset();
    this.file = null;
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
