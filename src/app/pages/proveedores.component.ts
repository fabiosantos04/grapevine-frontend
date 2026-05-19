import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
};

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Proveedores" description="Gestión de proveedores y contactos.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true">
            + Nuevo proveedor
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nuevo proveedor</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Nombre / Razón social</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.name" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Email</label>
                <input type="email" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.email" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Teléfono</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.phone" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Dirección</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.address" [ngModelOptions]="{ standalone: true }" />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.name"
                (click)="submit()">
                {{ saving ? 'Guardando…' : 'Guardar' }}
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
              <th class="p-3">Email</th>
              <th class="p-3">Teléfono</th>
              <th class="p-3">Dirección</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of list; track p.id) {
              <tr class="border-t border-border/60">
                <td class="p-3 font-medium">{{ p.name }}</td>
                <td class="p-3 text-muted-foreground">{{ p.email || '—' }}</td>
                <td class="p-3 text-muted-foreground">{{ p.phone || '—' }}</td>
                <td class="p-3 text-muted-foreground">{{ p.address || '—' }}</td>
                <td class="p-3">
                  <span class="rounded-full px-2 py-0.5 text-xs"
                    [class]="p.active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                    {{ p.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            }
            @if (!list.length) {
              <tr>
                <td colspan="5" class="p-6 text-center text-muted-foreground">Sin proveedores registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ProveedoresComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Supplier[] = [];
  open  = false;
  saving = false;
  form = { name: '', email: '', phone: '', address: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Supplier[]>('/suppliers');
    } catch {
      this.toast.error('Error al cargar proveedores');
    }
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/suppliers', { ...this.form, active: true });
      this.toast.success('Proveedor creado');
      this.open = false;
      this.form = { name: '', email: '', phone: '', address: '' };
      await this.load();
    } catch {
      this.toast.error('Error al crear proveedor');
    } finally {
      this.saving = false;
    }
  }
}