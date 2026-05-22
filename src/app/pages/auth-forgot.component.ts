import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-auth-forgot',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="font-display text-3xl font-bold">Recuperar cuenta</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Te enviaremos una contraseña temporal a tu correo registrado.
    </p>
    @if (!sent) {
      <div class="mt-8 space-y-4">
        <div>
          <label class="text-sm font-medium" for="email">Correo electrónico</label>
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
          type="button"
          [disabled]="loading || !email"
          class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          (click)="onSubmit()">
          {{ loading ? 'Enviando…' : 'Enviar contraseña temporal' }}
        </button>
      </div>
    } @else {
      <div class="mt-8 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
        Se envió una contraseña temporal a <strong>{{ email }}</strong>. Revisa tu bandeja de entrada y úsala para iniciar sesión.
      </div>
    }
    <p class="mt-6 text-center text-sm">
      <a routerLink="/auth/login" class="text-accent hover:underline">Volver al login</a>
    </p>
  `,
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