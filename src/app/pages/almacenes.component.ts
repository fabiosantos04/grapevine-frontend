import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type Warehouse = {
  id: number;
  name: string;
  address: string;
  active: boolean;
};

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Almacenes" description="Gestión de almacenes y depósitos.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nuevo almacén
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nuevo almacén</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Nombre</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.name" [ngModelOptions]="{ standalone: true }" />
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
              <th class="p-3">Dirección</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (w of list; track w.id) {
              <tr class="border-t border-border/60">
                <td class="p-3 font-medium">{{ w.name }}</td>
                <td class="p-3 text-muted-foreground">{{ w.address || '—' }}</td>
                <td class="p-3">
                  <span class="rounded-full px-2 py-0.5 text-xs"
                    [class]="w.active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                    {{ w.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            }
            @if (!list.length) {
              <tr>
                <td colspan="3" class="p-6 text-center text-muted-foreground">Sin almacenes registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AlmacenesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Warehouse[] = [];
  open   = false;
  saving = false;
  form   = { name: '', address: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Warehouse[]>('/warehouses');
    } catch {
      this.toast.error('Error al cargar almacenes');
    }
  }

  resetForm(): void {
    this.form = { name: '', address: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/warehouses', this.form);
      this.toast.success('Almacén creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear almacén');
    } finally {
      this.saving = false;
    }
  }
}