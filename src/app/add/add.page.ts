import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Import AngularFireAuth
import { finalize } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor, Plugins } from '@capacitor/core';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage implements OnInit {

  showMessage: boolean = true;  // Variable to control message visibility
  showHelpMessage: boolean = true;  // Variable to control "Need Help?" message visibility

  hideMessage() {
    this.showMessage = false;
  }

  hideHelpMessage() {
    this.showHelpMessage = false;
  }

  @ViewChild('itemFormElement') itemFormElement!: ElementRef;
  itemForm: FormGroup;
  isSubmitting = false;
  showWebcam = false;
  imagePreview: string | null = null;
  isFeedbackFormVisible = false;
  feedbackType = 'feedback';
  feedbackText = '';
  userEmail = 'user@example.com';
  brightness = 1;
  lastBagUsed: string | null = null;

  

  quickEntryItems: QuickEntryItem[] = [
    { label: 'Sunglasses', icon: './assets/sunglasses.png', name: 'Sunglasses', category: 'accessories' },
    { label: 'Hat', icon: './assets/cap.png', name: 'Hat', category: 'accessories' },
    { label: 'Shorts', icon: './assets/clothes.png', name: 'Shorts', category: 'clothes' },
    { label: 'Goggles', icon: './assets/goggles.png', name: 'Goggles', category: 'accessories' },
    { label: 'Flip Flops', icon: './assets/sandals.png', name: 'Flip Flops', category: 'clothes' },
    { label: 'Water Bottle', icon: './assets/water.png', name: 'Water Bottle', category: 'accessories' },
    { label: 'Towel', icon: './assets/towel.png', name: 'Towel', category: 'accessories' },
    { label: 'Earphones', icon: './assets/headphones.png', name: 'Earphones', category: 'electronics' },
    { label: 'Watch', icon: './assets/smartwatch.png', name: 'Watch', category: 'electronics' },
    { label: 'Runners', icon: './assets/runners.png', name: 'Runners', category: 'clothes' },
    { label: 'Bag', icon: './assets/bag.png', name: 'Bag', category: 'accessories' },
  ];

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private alertController: AlertController,
    private afAuth: AngularFireAuth
  ) {
    this.itemForm = this.fb.group({
      club: ['', Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      gender: ['', Validators.required],
      color: [''],
      condition: ['', Validators.required],
      storage: ['', Validators.required],
      bag: [''], // This will be auto-filled later
      image: [null, Validators.required],
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || 'Anonymous';
        const club = this.getClubFromEmail(this.userEmail);
        if (club) {
          this.itemForm.patchValue({ club: club });
        }
      }
    });
  }


  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || 'Anonymous';
        const club = this.getClubFromEmail(this.userEmail);
        if (club) {
          this.getLastUsedBag(club);
        }
      }
    });

    this.itemForm.get('club')!.valueChanges.subscribe(club => {
      if (club) {
        this.getLastUsedBag(club);
      }
    });
  }

  // getBagPlaceholder(): string {
  //   if (this.lastBagUsed && this.lastBagUsed !== 'N/A' && this.lastBagUsed !== 'No entries yet') {
  //     const nextBag = parseInt(this.lastBagUsed, 10) + 1;
  //     return `Last used: ${this.lastBagUsed}, Suggested: ${nextBag}`;
  //   } else {
  //     return 'Last label id used: No entries yet, Suggested: 1';
  //   }
  // }
  
  getLastUsedBag(club: string) {
    this.firestore.collection('items', ref => ref
      .where('club', '==', club)
      .orderBy('bag', 'asc') // Order by bag in ascending order to check gaps
    ).valueChanges().subscribe(items => {
      if (items.length > 0) {
        const usedBags = items.map((item: any) => parseInt(item.bag, 10));
        this.lastBagUsed = this.findNextAvailableBag(usedBags).toString();
        this.itemForm.patchValue({ bag: this.lastBagUsed });
      } else {
        this.lastBagUsed = '1';
        this.itemForm.patchValue({ bag: '1' });
      }
    }, error => {
      console.error('Error fetching last used bag:', error);
    });
  }

  findNextAvailableBag(usedBags: number[]): number {
    usedBags.sort((a, b) => a - b);
    let nextBag = 1;
    for (let i = 0; i < usedBags.length; i++) {
      if (usedBags[i] > nextBag) {
        break;
      }
      nextBag = usedBags[i] + 1;
    }
    return nextBag;
  }
  
  applyBrightness() {
    const video = document.getElementById('video') as HTMLVideoElement;
    if (video) {
      video.style.filter = `brightness(${this.brightness})`;
    }
  }

  // Scroll to the form when an image is uploaded or taken
  scrollToForm() {
    this.itemFormElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  selectItem(item: QuickEntryItem) {
    this.itemForm.patchValue({
      name: item.name,
      category: item.category,
    });
    this.scrollToForm(); // Scroll to the form after the image is captured

  }

  async onSubmit() {
    if (this.itemForm.invalid) {
      Object.keys(this.itemForm.controls).forEach(control => {
        this.itemForm.get(control)?.markAsTouched();
      });
      this.showAlert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    this.isSubmitting = true;
    const formData = {
      ...this.itemForm.value,
      name: this.itemForm.value.name.toLowerCase(),
      category: this.itemForm.value.category,
      gender: this.itemForm.value.gender,
      color: this.itemForm.value.color || '',
      condition: this.itemForm.value.condition,
      storage: this.itemForm.value.storage,
      bag: this.itemForm.value.bag,
      club: this.itemForm.value.club,
    };

    const date = new Date().toISOString();
    const file = formData.image;

    try {
      if (file) {
        const filePath = `images/${new Date().getTime()}_${file.name}`;
        const fileRef = this.storage.ref(filePath);
        const task = this.storage.upload(filePath, file);

        await task.snapshotChanges().pipe(
          finalize(async () => {
            const fileUrl = await fileRef.getDownloadURL().toPromise();
            await this.saveItemToFirestore(formData, date, fileUrl);
            this.isSubmitting = false;
          })
        ).toPromise();

      } else {
        await this.saveItemToFirestore(formData, date, null);
        this.isSubmitting = false;
      }

      this.resetForm();

    } catch (error) {
      this.isSubmitting = false;
      this.showAlert('Error', 'There was an error adding the item.');
      console.error(error);
    }
  }

  async saveItemToFirestore(formData: any, date: string, fileUrl: string | null) {
    await this.firestore.collection('items').add({
      name: formData.name || '',
      date: date,
      category: formData.category || '',
      gender: formData.gender || '',
      color: formData.color || '',
      condition: formData.condition || '',
      storage: formData.storage || '',
      bag: formData.bag || '',
      club: formData.club || '',
      imageUrl: fileUrl || null,
    });

    this.showAlert('Success', `Item added successfully with label: ${formData.bag}.`);
    this.resetForm();
  }

  resetForm() {
    this.itemForm.reset();
    const club = this.getClubFromEmail(this.userEmail);
    if (club) {
      this.itemForm.patchValue({ club: club });
    }
    this.imagePreview = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.itemForm.patchValue({ image: file });
      this.generateImagePreview(file);
      this.scrollToForm();
    }
  }

  openWebcam() {
    this.showWebcam = true;
    setTimeout(() => {
      const video = document.getElementById('video') as HTMLVideoElement;
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();
        })
        .catch(error => {
          console.error('Error accessing webcam:', error);
        });
    }, 100);
  }

  takePicture() {
    this.openWebcam();
  }

  dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  captureWebcamImage() {
    const video = document.getElementById('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

    canvas.toBlob(blob => {
      if (blob) {
        const fileName = `photo_${new Date().getTime()}.jpeg`;
        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });

        this.itemForm.patchValue({ image: imageFile });
        this.generateImagePreview(imageFile);
        this.scrollToForm();

        setTimeout(() => {
          this.showWebcam = false;
        }, 200);
      }
    }, 'image/jpeg');
  }

  private generateImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleFeedbackForm() {
    this.isFeedbackFormVisible = !this.isFeedbackFormVisible;
  }

  submitFeedback() {
    if (this.feedbackText.trim()) {
      const feedback = {
        type: this.feedbackType,
        text: this.feedbackText,
        timestamp: new Date(),
        email: this.userEmail,
      };
      this.firestore.collection('feedback').add(feedback).then(() => {
        this.feedbackText = '';
        this.toggleFeedbackForm();
        alert('Thank you for your feedback! The website admin will review it and get back to your club if a response is needed.');
      }).catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      });
    } else {
      alert('Feedback cannot be empty.');
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
}

interface QuickEntryItem {
  label: string;
  icon: string;
  name: string;
  category: string;
}