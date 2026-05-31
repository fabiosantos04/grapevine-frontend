import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.css',
})
export class AuthLoginComponent {
  protected readonly auth  = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);

  email    = '';
  password = '';

  async onSubmit(): Promise<void> {
    try {
      await this.auth.login({ email: this.email, password: this.password });
      this.toast.success('Bienvenido');
      await this.router.navigateByUrl('/app/dashboard');
    } catch {
      this.toast.error('Credenciales incorrectas');
    }
  }
}