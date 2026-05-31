import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-auth-forgot',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-forgot.component.html',
  styleUrl: './auth-forgot.component.css',
})
export class AuthForgotComponent {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  email   = '';
  loading = false;
  sent    = false;

  async onSubmit(): Promise<void> {
    this.loading = true;
    try {
      await this.api.post('/auth/forgot-password', { email: this.email });
      this.sent = true;
    } catch {
      this.toast.error('No encontramos una cuenta con ese correo.');
    } finally {
      this.loading = false;
    }
  }
}