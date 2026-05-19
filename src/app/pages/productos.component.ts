import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  volume: number | null;
  year: number | null;
  imageUrl: string | null;
  active: boolean;
};

const CATEGORIES = [
  { value: 'VINO_TINTO',  label: 'Vino Tinto' },
  { value: 'VINO_BLANCO', label: 'Vino Blanco' },
  { value: 'VINO_ROSADO', label: 'Vino Rosado' },
  { value: 'ESPUMANTE',   label: 'Espumante' },
  { value: 'PISCO',       label: 'Pisco' },
];

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Productos" description="Catálogo de vinos, piscos y espumantes.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nuevo producto
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nuevo producto</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Nombre</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.name" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Descripción</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.description" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Categoría</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="form.category" [ngModelOptions]="{ standalone: true }">
                    @for (c of CATEGORIES; track c.value) {
                      <option [value]="c.value">{{ c.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="text-sm">Precio (S/)</label>
                  <input type="number" min="0" step="0.01"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.price" [ngModelOptions]="{ standalone: true }" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Stock inicial</label>
                  <input type="number" min="0"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.stock" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">Volumen (ml)</label>
                  <input type="number" min="0"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.volume" [ngModelOptions]="{ standalone: true }" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Año cosecha</label>
                  <input type="number" min="1900" max="2099"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.year" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">URL imagen</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.imageUrl" [ngModelOptions]="{ standalone: true }" placeholder="https://..." />
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.name || !form.price"
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
              <th class="p-3">Categoría</th>
              <th class="p-3">Año</th>
              <th class="p-3">Volumen</th>
              <th class="p-3 text-right">Precio</th>
              <th class="p-3 text-right">Stock</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of list; track p.id) {
              <tr class="border-t border-border/60"
                [class]="p.stock <= 5 ? 'bg-destructive/5' : ''">
                <td class="p-3 font-medium">{{ p.name }}</td>
                <td class="p-3 text-muted-foreground">{{ categoryLabel(p.category) }}</td>
                <td class="p-3 text-muted-foreground">{{ p.year || '—' }}</td>
                <td class="p-3 text-muted-foreground">{{ p.volume ? p.volume + ' ml' : '—' }}</td>
                <td class="p-3 text-right font-mono">S/ {{ p.price | number: '1.2-2' }}</td>
                <td class="p-3 text-right font-mono"
                  [class]="p.stock <= 5 ? 'font-bold text-destructive' : ''">
                  {{ p.stock }}
                </td>
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
                <td colspan="7" class="p-6 text-center text-muted-foreground">Sin productos registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ProductosComponent implements OnInit {
  readonly CATEGORIES = CATEGORIES;
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Product[] = [];
  open   = false;
  saving = false;
  form = {
    name: '', description: '', price: 0, stock: 0,
    category: 'VINO_TINTO', volume: null as number | null,
    year: null as number | null, imageUrl: ''
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Product[]>('/products');
    } catch {
      this.toast.error('Error al cargar productos');
    }
  }

  categoryLabel(value: string): string {
    return CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  resetForm(): void {
    this.form = {
      name: '', description: '', price: 0, stock: 0,
      category: 'VINO_TINTO', volume: null, year: null, imageUrl: ''
    };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/products', this.form);
      this.toast.success('Producto creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear producto');
    } finally {
      this.saving = false;
    }
  }
}