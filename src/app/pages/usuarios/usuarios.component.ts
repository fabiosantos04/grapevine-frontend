import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type UserResponse = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
  mustChangePassword: boolean;
};

const ROLES = ['ADMIN', 'CAJERO', 'LOGISTICA'] as const;
type Role = typeof ROLES[number];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit {
  readonly ROLES         = ROLES;
  private readonly api   = inject(ApiService);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  list: UserResponse[] = [];
  open      = false;
  saving    = false;
  editingId: number | null = null;
  form: { fullName: string; email: string; role: Role; enabled: boolean } = {
    fullName: '', email: '', role: 'CAJERO', enabled: true,
  };

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    if (!this.auth.roles().includes('admin')) {
      await this.router.navigateByUrl('/app/dashboard');
      return;
    }
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<UserResponse[]>('/users');
    } catch {
      this.toast.error('Error al cargar usuarios');
    }
  }

  openCreate(): void {
    this.editingId = null;
    this.form = { fullName: '', email: '', role: 'CAJERO', enabled: true };
    this.open = true;
  }

  openEdit(u: UserResponse): void {
    this.editingId = u.id;
    this.form = { fullName: u.fullName, email: u.email, role: u.role as Role, enabled: u.enabled };
    this.open = true;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      if (this.editingId) {
        await this.api.put(`/users/${this.editingId}`, {
          fullName: this.form.fullName,
          role:     this.form.role,
          enabled:  this.form.enabled,
        });
        this.toast.success('Usuario actualizado');
      } else {
        await this.api.post('/users', {
          fullName: this.form.fullName,
          email:    this.form.email,
          role:     this.form.role,
        });
        this.toast.success('Usuario creado — se envió email con credenciales');
      }
      this.open = false;
      await this.load();
    } catch {
      this.toast.error(this.editingId ? 'Error al actualizar' : 'Error al crear usuario');
    } finally {
      this.saving = false;
    }
  }
}