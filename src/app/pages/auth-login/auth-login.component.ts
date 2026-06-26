import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { emailValidator } from '../../core/validators';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.css',
})
export class AuthLoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);
  private readonly fb     = inject(FormBuilder);

  form = this.fb.group({
    email:    ['', [Validators.required, emailValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email()    { return this.form.get('email')!;    }
  get password() { return this.form.get('password')!; }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    try {
      await this.auth.login({
        email:    this.email.value!,
        password: this.password.value!,
      });
      this.toast.success('Bienvenido');
      await this.router.navigateByUrl('/app/dashboard');
    } catch {
      this.toast.error('Credenciales incorrectas');
    }
  }
}