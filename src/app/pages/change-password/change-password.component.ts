import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';
  saving          = false;
  error           = '';

  async submit(): Promise<void> {
    this.error = '';

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.saving = true;
    try {
      await this.api.put('/profile/change-password', {
        currentPassword: this.currentPassword,
        newPassword:     this.newPassword,
      });
      this.auth.updateUser({ mustChangePassword: false });
      this.toast.success('Contraseña cambiada correctamente');
      await this.router.navigateByUrl('/app/dashboard');
    } catch {
      this.error = 'Contraseña temporal incorrecta';
    } finally {
      this.saving = false;
    }
  }
}