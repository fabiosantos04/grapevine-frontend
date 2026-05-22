import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background p-4">
      <div class="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-wine">
        <h2 class="font-display text-2xl font-bold">Cambiar contraseña</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Tu cuenta tiene una contraseña temporal. Debes cambiarla antes de continuar.
        </p>
        <div class="mt-6 space-y-4">
          <div>
            <label class="text-sm font-medium">Contraseña temporal</label>
            <input type="password"
              class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              [(ngModel)]="currentPassword" [ngModelOptions]="{ standalone: true }" />
          </div>
          <div>
            <label class="text-sm font-medium">Nueva contraseña</label>
            <input type="password"
              class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              [(ngModel)]="newPassword" [ngModelOptions]="{ standalone: true }" />
          </div>
          <div>
            <label class="text-sm font-medium">Confirmar nueva contraseña</label>
            <input type="password"
              class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              [(ngModel)]="confirmPassword" [ngModelOptions]="{ standalone: true }" />
          </div>
          @if (error) {
            <p class="text-sm text-destructive">{{ error }}</p>
          }
          <button type="button"
            class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            [disabled]="saving"
            (click)="submit()">
            {{ saving ? 'Guardando…' : 'Cambiar contraseña' }}
          </button>
        </div>
      </div>
    </div>
  `,
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