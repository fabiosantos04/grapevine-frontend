import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

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
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  readonly auth          = inject(AuthService);
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
      const profile  = await this.api.get<ProfileResponse>('/profile');
      this.fullName  = profile.fullName;
      this.avatar    = profile.avatar ?? null;
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
      const base64     = reader.result as string;
      this.avatar      = base64;
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