import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-auth-reset',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="font-display text-3xl font-bold">Nueva contraseña</h2>
    <form class="mt-8 space-y-4" (ngSubmit)="onSubmit()">
      <div>
        <label class="text-sm font-medium" for="password">Nueva contraseña</label>
        <input
          id="password"
          type="password"
          required
          minlength="6"
          [(ngModel)]="password"
          [ngModelOptions]="{ standalone: true }"
          class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        [disabled]="loading"
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Actualizar
      </button>
    </form>
  `,
})
export class AuthResetComponent {
  private readonly supa = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  password = '';
  loading = false;

  async onSubmit(): Promise<void> {
    if (this.password.length < 6) {
      this.toast.error('Mínimo 6 caracteres');
      return;
    }
    this.loading = true;
    const { error } = await this.supa.supabase.auth.updateUser({ password: this.password });
    this.loading = false;
    if (error) {
      this.toast.error(error.message);
      return;
    }
    this.toast.success('Contraseña actualizada');
    await this.router.navigateByUrl('/app/dashboard');
  }
}
