import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-auth-forgot',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="font-display text-3xl font-bold">Recuperar cuenta</h2>
    <p class="mt-2 text-sm text-muted-foreground">Te enviaremos un correo para restablecer la contraseña.</p>
    <form class="mt-8 space-y-4" (ngSubmit)="onSubmit()">
      <div>
        <label class="text-sm font-medium" for="email">Correo</label>
        <input
          id="email"
          type="email"
          required
          [(ngModel)]="email"
          [ngModelOptions]="{ standalone: true }"
          class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        [disabled]="loading"
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Enviar enlace
      </button>
    </form>
    <p class="mt-6 text-center text-sm">
      <a routerLink="/auth/login" class="text-accent hover:underline">Volver al login</a>
    </p>
  `,
})
export class AuthForgotComponent {
  private readonly supa = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  email = '';
  loading = false;

  async onSubmit(): Promise<void> {
    this.loading = true;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await this.supa.supabase.auth.resetPasswordForEmail(this.email, {
      redirectTo: `${origin}/auth/reset`,
    });
    this.loading = false;
    if (error) {
      this.toast.error(error.message);
      return;
    }
    this.toast.success('Te enviamos un correo con instrucciones.');
  }
}
