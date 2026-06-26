import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { emailValidator } from '../../core/validators';

@Component({
  selector: 'app-auth-forgot',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-forgot.component.html',
  styleUrl: './auth-forgot.component.css',
})
export class AuthForgotComponent {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  loading = false;
  sent    = false;

  form = this.fb.group({
    email: ['', [Validators.required, emailValidator]],
  });

  get email() { return this.form.get('email')!; }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    try {
      await this.api.post('/auth/forgot-password', { email: this.email.value });
      this.sent = true;
    } catch {
      this.toast.error('No encontramos una cuenta con ese correo.');
    } finally {
      this.loading = false;
    }
  }
}