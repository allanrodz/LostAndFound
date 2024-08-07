import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private alertController: AlertController
  ) {}
 
  async onSubmit() {
    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      this.router.navigate(['/tabs/add']); // Redirect to the protected route
    } catch (error) {
      this.showAlert('Login Failed', (error as any).message);
    }
  }

  async signUp() {
    try {
      await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      this.router.navigate(['/login']);
    } catch (error) {
      this.showAlert('Signup Failed', (error as any).message);
    }
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
