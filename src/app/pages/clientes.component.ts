import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type DocumentType = 'DNI' | 'RUC' | 'CE';

type Customer = {
  id: number;
  razonSocial: string;
  tipoDocumento: DocumentType;
  documento: string;
  contacto: string;
  telefono: string;
  email: string;
  segmento: string;
  active: boolean;
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Clientes" description="Cartera de clientes.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nuevo cliente
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nuevo cliente</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Razón social / Nombre</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.razonSocial" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Tipo documento</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="form.tipoDocumento" [ngModelOptions]="{ standalone: true }">
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm">Número de documento</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.documento" [ngModelOptions]="{ standalone: true }" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Contacto</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.contacto" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">Teléfono</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.telefono" [ngModelOptions]="{ standalone: true }" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Email</label>
                  <input type="email" class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.email" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">Segmento</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.segmento" [ngModelOptions]="{ standalone: true }"
                    placeholder="Ej: Mayorista, Minorista…" />
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.razonSocial || !form.documento"
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
              <th class="p-3">Cliente</th>
              <th class="p-3">Documento</th>
              <th class="p-3">Teléfono</th>
              <th class="p-3">Email</th>
              <th class="p-3">Segmento</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (c of list; track c.id) {
              <tr class="border-t border-border/60">
                <td class="p-3 font-medium">{{ c.razonSocial }}</td>
                <td class="p-3 text-muted-foreground">{{ c.tipoDocumento }}: {{ c.documento }}</td>
                <td class="p-3 text-muted-foreground">{{ c.telefono || '—' }}</td>
                <td class="p-3 text-muted-foreground">{{ c.email || '—' }}</td>
                <td class="p-3 text-muted-foreground">{{ c.segmento || '—' }}</td>
                <td class="p-3">
                  <span class="rounded-full px-2 py-0.5 text-xs"
                    [class]="c.active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                    {{ c.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            }
            @if (!list.length) {
              <tr>
                <td colspan="6" class="p-6 text-center text-muted-foreground">Sin clientes registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ClientesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Customer[] = [];
  open   = false;
  saving = false;
  form: {
    razonSocial: string;
    tipoDocumento: DocumentType;
    documento: string;
    contacto: string;
    telefono: string;
    email: string;
    segmento: string;
  } = { razonSocial: '', tipoDocumento: 'DNI', documento: '', contacto: '', telefono: '', email: '', segmento: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Customer[]>('/customers');
    } catch {
      this.toast.error('Error al cargar clientes');
    }
  }

  resetForm(): void {
    this.form = { razonSocial: '', tipoDocumento: 'DNI', documento: '', contacto: '', telefono: '', email: '', segmento: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/customers', this.form);
      this.toast.success('Cliente creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear cliente');
    } finally {
      this.saving = false;
    }
  }
}