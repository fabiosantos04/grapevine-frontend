import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type AdjustmentRow = {
  id: number;
  productName: string;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

type Product = { id: number; name: string; stock: number };

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Inventario físico" description="Historial de ajustes de stock por producto.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Ajustar stock
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Ajuste de stock</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Producto</label>
                <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [(ngModel)]="form.productId" [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="onProductChange($event)">
                  <option value="">Selecciona producto</option>
                  @for (p of products; track p.id) {
                    <option [value]="p.id">{{ p.name }} (stock actual: {{ p.stock }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm">Nuevo stock</label>
                <input type="number" min="0"
                  class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.newStock" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Razón del ajuste</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.reason" [ngModelOptions]="{ standalone: true }"
                  placeholder="Ej: Conteo físico, merma, devolución…" />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.productId || !form.reason"
                (click)="submit()">
                {{ saving ? 'Guardando…' : 'Guardar ajuste' }}
              </button>
            </div>
          </div>
        </div>
      }

      <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table class="w-full text-sm">
          <thead class="bg-card-foreground/5 text-xs uppercase text-muted-foreground">
            <tr>
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Producto</th>
              <th class="px-4 py-3 text-right">Stock anterior</th>
              <th class="px-4 py-3 text-right">Stock nuevo</th>
              <th class="px-4 py-3 text-left">Razón</th>
            </tr>
          </thead>
          <tbody>
            @if (!rows.length) {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-muted-foreground">Sin ajustes registrados</td>
              </tr>
            } @else {
              @for (r of rows; track r.id) {
                <tr class="border-t border-border/40">
                  <td class="px-4 py-3 text-muted-foreground">{{ r.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 font-medium">{{ r.productName }}</td>
                  <td class="px-4 py-3 text-right font-mono text-muted-foreground">{{ r.previousStock }}</td>
                  <td class="px-4 py-3 text-right font-mono"
                    [class]="r.newStock > r.previousStock ? 'text-accent' : 'text-destructive'">
                    {{ r.newStock }}
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{{ r.reason }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class InventarioComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  rows: AdjustmentRow[] = [];
  products: Product[]   = [];
  open   = false;
  saving = false;
  form   = { productId: '' as number | '', newStock: 0, reason: '' };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadProducts()]);
  }

  async load(): Promise<void> {
    try {
      this.rows = await this.api.get<AdjustmentRow[]>('/inventory');
    } catch {
      this.toast.error('Error al cargar inventario');
    }
  }

  async loadProducts(): Promise<void> {
    try {
      this.products = await this.api.get<Product[]>('/products');
    } catch {}
  }

  onProductChange(id: number | ''): void {
    const p = this.products.find((x) => x.id === Number(id));
    if (p) this.form.newStock = p.stock;
  }

  resetForm(): void {
    this.form = { productId: '', newStock: 0, reason: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/inventory/adjust', {
        productId: Number(this.form.productId),
        newStock:  this.form.newStock,
        reason:    this.form.reason,
      });
      this.toast.success('Stock ajustado');
      this.open = false;
      this.resetForm();
      await Promise.all([this.load(), this.loadProducts()]);
    } catch {
      this.toast.error('Error al ajustar stock');
    } finally {
      this.saving = false;
    }
  }
}