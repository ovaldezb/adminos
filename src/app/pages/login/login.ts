import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly rememberMe = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly showPassword = signal(false);

  constructor(private router: Router) {}

  onLogin(): void {
    this.isLoading.set(true);
    
    // Simular autenticación
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/inicio']);
    }, 1500);
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }
}
