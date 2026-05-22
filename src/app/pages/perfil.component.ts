import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type ProfileResponse = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
  mustChangePassword: boolean;
  avatar: string | null;
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Mi perfil" description="Gestiona tu información personal." />

      <div class="grid gap-6 lg:grid-cols-3">

        <!-- Foto y datos básicos -->
        <div class="rounded-xl border border-border/60 bg-card p-6">
          <div class="flex flex-col items-center gap-4">
            <div class="relative">
              <div class="h-24 w-24 overflow-hidden rounded-full border-2 border-accent/30 bg-muted">
                @if (avatar) {
                  <img [src]="avatar" alt="Foto de perfil" class="h-full w-full object-cover" />
                } @else {
                  <div class="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                    {{ initials() }}
                  </div>
                }
              </div>
              <label
                class="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shadow"
                title="Cambiar foto">
                ✎
                <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event)" />
              </label>
            </div>
            <div class="text-center">
              <p class="font-display font-semibold">{{ auth.user()?.fullName }}</p>
              <p class="text-sm text-muted-foreground">{{ auth.user()?.email }}</p>
              <span class="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs text-accent">
                {{ auth.user()?.role }}
              </span>
            </div>
            @if (savingAvatar) {
              <p class="text-xs text-muted-foreground">Guardando foto…</p>
            }
          </div>
        </div>

        <!-- Editar datos -->
        <div class="rounded-xl border border-border/60 bg-card p-6 lg:col-span-2 space-y-5">
          <div>
            <h3 class="font-semibold">Información personal</h3>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm font-medium">Nombre completo</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="fullName" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm font-medium">Correo electrónico</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm bg-muted/40 cursor-not-allowed"
                  [value]="auth.user()?.email ?? ''" disabled />
                <p class="mt-1 text-xs text-muted-foreground">El correo no se puede modificar.</p>
              </div>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="savingProfile"
                (click)="saveProfile()">
                {{ savingProfile ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            </div>
          </div>

          <div class="border-t border-border/60 pt-5">
            <h3 class="font-semibold">Cambiar contraseña</h3>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm font-medium">Contraseña actual</label>
                <input type="password" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="currentPassword" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm font-medium">Nueva contraseña</label>
                <input type="password" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="newPassword" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm font-medium">Confirmar nueva contraseña</label>
                <input type="password" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="confirmPassword" [ngModelOptions]="{ standalone: true }" />
              </div>
              @if (passwordError) {
                <p class="text-sm text-destructive">{{ passwordError }}</p>
              }
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="savingPassword"
                (click)="savePassword()">
                {{ savingPassword ? 'Guardando…' : 'Cambiar contraseña' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PerfilComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  fullName        = '';
  avatar: string | null = null;
  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';
  passwordError   = '';
  savingProfile   = false;
  savingPassword  = false;
  savingAvatar    = false;

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    try {
      const profile = await this.api.get<ProfileResponse>('/profile');
      this.fullName = profile.fullName;
      this.avatar   = profile.avatar ?? null;
    } catch {
      this.fullName = this.auth.user()?.fullName ?? '';
    }
  }

  initials(): string {
    return (this.auth.user()?.fullName ?? '?')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (file.size > 1_000_000) {
      this.toast.error('La imagen no debe superar 1 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      this.avatar = base64;
      this.savingAvatar = true;
      try {
        await this.api.put('/profile', { avatar: base64 });
        this.auth.updateUser({ fullName: this.fullName });
        this.toast.success('Foto actualizada');
      } catch {
        this.toast.error('Error al guardar foto');
      } finally {
        this.savingAvatar = false;
      }
    };
    reader.readAsDataURL(file);
  }

  async saveProfile(): Promise<void> {
    if (!this.fullName.trim()) return;
    this.savingProfile = true;
    try {
      await this.api.put('/profile', { fullName: this.fullName });
      this.auth.updateUser({ fullName: this.fullName });
      this.toast.success('Perfil actualizado');
    } catch {
      this.toast.error('Error al actualizar perfil');
    } finally {
      this.savingProfile = false;
    }
  }

  async savePassword(): Promise<void> {
    this.passwordError = '';
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'Mínimo 6 caracteres';
      return;
    }
    this.savingPassword = true;
    try {
      await this.api.put('/profile/change-password', {
        currentPassword: this.currentPassword,
        newPassword:     this.newPassword,
      });
      this.currentPassword = '';
      this.newPassword     = '';
      this.confirmPassword = '';
      this.toast.success('Contraseña cambiada correctamente');
    } catch {
      this.passwordError = 'Contraseña actual incorrecta';
    } finally {
      this.savingPassword = false;
    }
  }
}