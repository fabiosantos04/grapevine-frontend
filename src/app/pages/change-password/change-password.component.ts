import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { strongPasswordValidator, passwordMatchValidator } from '../../core/validators';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);
  private readonly fb     = inject(FormBuilder);

  saving = false;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  get currentPassword() { return this.form.get('currentPassword')!; }
  get newPassword()     { return this.form.get('newPassword')!;     }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    try {
      await this.api.put('/profile/change-password', {
        currentPassword: this.currentPassword.value,
        newPassword:     this.newPassword.value,
      });
      this.auth.updateUser({ mustChangePassword: false });
      this.toast.success('Contraseña cambiada correctamente');
      await this.router.navigateByUrl('/app/dashboard');
    } catch {
      this.form.setErrors({ wrongCurrent: true });
    } finally {
      this.saving = false;
    }
  }
}