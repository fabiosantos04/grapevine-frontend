import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type UserResponse = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
};

const ROLES = ['ADMIN', 'CAJERO', 'LOGISTICA'] as const;
type Role = typeof ROLES[number];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Usuarios del sistema" description="Crea cuentas para los trabajadores y asigna su rol.">
        <div slot="actions">
          <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" (click)="open = true">+ Nuevo usuario</button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Crear cuenta de trabajador</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Nombre completo</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.fullName" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Correo electrónico</label>
                <input type="email" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.email" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Rol</label>
                <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [(ngModel)]="form.role" [ngModelOptions]="{ standalone: true }">
                  @for (r of ROLES; track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button" class="rounded-md border border-border px-4 py-2 text-sm" (click)="open = false">Cancelar</button>
              <button
                type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.email || !form.fullName"
                (click)="submit()"
              >
                {{ saving ? 'Creando…' : 'Crear usuario' }}
              </button>
            </div>
          </div>
        </div>
      }

      <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th class="p-3">Nombre</th>
              <th class="p-3">Correo</th>
              <th class="p-3">Rol</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (u of list; track u.id) {
              <tr class="border-t border-border/60">
                <td class="p-3">{{ u.fullName }}</td>
                <td class="p-3 text-muted-foreground">{{ u.email }}</td>
                <td class="p-3">
                  <span class="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    {{ u.role }}
                  </span>
                </td>
                <td class="p-3">
                  <span class="rounded-full px-2 py-0.5 text-xs"
                    [class]="u.enabled ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                    {{ u.enabled ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            }
            @if (!list.length) {
              <tr>
                <td colspan="4" class="p-6 text-center text-muted-foreground">Sin usuarios.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UsuariosComponent implements OnInit {
  readonly ROLES = ROLES;
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  list: UserResponse[] = [];
  open  = false;
  saving = false;
  form: { fullName: string; email: string; role: Role } = {
    fullName: '',
    email: '',
    role: 'CAJERO',
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

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/users', this.form);
      this.toast.success('Usuario creado');
      this.open = false;
      this.form = { fullName: '', email: '', role: 'CAJERO' };
      await this.load();
    } catch {
      this.toast.error('Error al crear usuario');
    } finally {
      this.saving = false;
    }
  }
}