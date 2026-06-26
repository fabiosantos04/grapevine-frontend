import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { strongPasswordValidator, passwordMatchValidator } from '../../core/validators';

type ProfileResponse = {
  id: number; fullName: string; email: string;
  role: string; enabled: boolean; mustChangePassword: boolean; avatar: string | null;
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  readonly auth          = inject(AuthService);
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  loading       = true;
  fullName      = '';
  avatar: string | null = null;
  savingProfile = false;
  savingPassword = false;
  savingAvatar  = false;

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword()     { return this.passwordForm.get('newPassword')!;     }
  get confirmPassword() { return this.passwordForm.get('confirmPassword')!; }

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    try {
      const profile = await this.api.get<ProfileResponse>('/profile');
      this.fullName = profile.fullName;
      this.avatar   = profile.avatar ?? null;
    } catch {
      this.fullName = this.auth.user()?.fullName ?? '';
    } finally {
      this.loading = false;
    }
  }

  initials(): string {
    return (this.auth.user()?.fullName ?? '?')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { this.toast.error('La imagen no debe superar 1 MB'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64      = reader.result as string;
      this.avatar       = base64;
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
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword = true;
    try {
      await this.api.put('/profile/change-password', {
        currentPassword: this.currentPassword.value,
        newPassword:     this.newPassword.value,
      });
      this.passwordForm.reset();
      this.toast.success('Contraseña cambiada correctamente');
    } catch {
      this.passwordForm.setErrors({ wrongCurrent: true });
    } finally {
      this.savingPassword = false;
    }
  }
}