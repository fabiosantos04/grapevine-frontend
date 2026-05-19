import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type Supplier    = { id: number; name: string };
type Product     = { id: number; name: string; price: number };
type BankAccount = { id: number; bank: string; accountNumber: string; balance: number; currency: string };
type PurchaseItem = { productId: number; productName: string; quantity: number; price: number };

type PurchaseItemResponse = {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type PurchaseResponse = {
  id: number;
  supplierName: string;
  bankAccountName: string;
  total: number;
  createdAt: string;
  items: PurchaseItemResponse[];
};

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Compras y pagos" description="Registro de compras a proveedores.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nueva compra
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nueva compra</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Proveedor</label>
                <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [(ngModel)]="supplierId" [ngModelOptions]="{ standalone: true }">
                  <option value="">Seleccionar proveedor</option>
                  @for (s of suppliers; track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="text-sm">Cuenta bancaria de pago <span class="text-muted-foreground text-xs">(opcional)</span></label>
                <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [(ngModel)]="bankAccountId" [ngModelOptions]="{ standalone: true }">
                  <option value="">Sin cuenta asignada</option>
                  @for (b of bankAccounts; track b.id) {
                    <option [value]="b.id">
                      {{ b.bank }} - {{ b.accountNumber }} ({{ b.currency === 'PEN' ? 'S/' : '$' }} {{ b.balance | number: '1.2-2' }})
                    </option>
                  }
                </select>
              </div>

              <div class="border-t border-border/60 pt-3">
                <label class="text-sm">Agregar producto</label>
                <div class="mt-1 flex gap-2">
                  <select class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="selectedProductId" [ngModelOptions]="{ standalone: true }">
                    <option value="">Selecciona producto</option>
                    @for (p of products; track p.id) {
                      <option [value]="p.id">{{ p.name }} — S/ {{ p.price | number: '1.2-2' }}</option>
                    }
                  </select>
                  <button type="button"
                    class="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"
                    (click)="addItem()">Agregar</button>
                </div>
              </div>

              @if (items.length) {
                <table class="mt-2 w-full text-sm">
                  <thead class="text-xs text-muted-foreground">
                    <tr>
                      <th class="text-left">Producto</th>
                      <th class="text-center">Cantidad</th>
                      <th class="text-right">Precio unit.</th>
                      <th class="text-right">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (it of items; track $index; let i = $index) {
                      <tr class="border-t border-border/40">
                        <td class="py-2">{{ it.productName }}</td>
                        <td class="text-center">
                          <input type="number" min="1"
                            class="mx-auto w-16 rounded border border-input px-1 py-1 text-center"
                            [(ngModel)]="it.quantity" [ngModelOptions]="{ standalone: true }" />
                        </td>
                        <td class="text-right font-mono">S/ {{ it.price | number: '1.2-2' }}</td>
                        <td class="text-right font-mono">S/ {{ (it.quantity * it.price) | number: '1.2-2' }}</td>
                        <td>
                          <button type="button"
                            class="rounded px-2 text-destructive hover:bg-muted/40"
                            (click)="removeItem(i)">✕</button>
                        </td>
                      </tr>
                    }
                    <tr class="border-t border-border/60 font-bold">
                      <td colspan="3" class="py-3 text-right">Total</td>
                      <td class="text-right font-mono text-accent">S/ {{ total() | number: '1.2-2' }}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              }
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !supplierId || !items.length"
                (click)="submit()">
                {{ saving ? 'Guardando…' : 'Registrar compra' }}
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
              <th class="px-4 py-3 text-left">Proveedor</th>
              <th class="px-4 py-3 text-left">Cuenta pagada</th>
              <th class="px-4 py-3 text-left">Productos</th>
              <th class="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            @if (!rows.length) {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-muted-foreground">Sin compras registradas</td>
              </tr>
            } @else {
              @for (r of rows; track r.id) {
                <tr class="border-t border-border/40">
                  <td class="px-4 py-3 text-muted-foreground">{{ r.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 font-medium">{{ r.supplierName }}</td>
                  <td class="px-4 py-3 text-muted-foreground">{{ r.bankAccountName }}</td>
                  <td class="px-4 py-3 text-muted-foreground">
                    @for (it of r.items; track it.productName) {
                      <div>{{ it.productName }} × {{ it.quantity }}</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-accent">S/ {{ r.total | number: '1.2-2' }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ComprasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  rows: PurchaseResponse[]  = [];
  suppliers: Supplier[]     = [];
  products: Product[]       = [];
  bankAccounts: BankAccount[] = [];
  items: PurchaseItem[]     = [];
  open              = false;
  saving            = false;
  supplierId        = '';
  bankAccountId     = '' as number | '';
  selectedProductId = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadSuppliers(),
      this.loadProducts(),
      this.loadPurchases(),
      this.loadBankAccounts(),
    ]);
  }

  async loadSuppliers(): Promise<void> {
    try { this.suppliers = await this.api.get<Supplier[]>('/suppliers'); } catch {}
  }

  async loadProducts(): Promise<void> {
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
  }

  async loadPurchases(): Promise<void> {
    try {
      this.rows = await this.api.get<PurchaseResponse[]>('/purchases');
    } catch {
      this.toast.error('Error al cargar compras');
    }
  }

  async loadBankAccounts(): Promise<void> {
    try { this.bankAccounts = await this.api.get<BankAccount[]>('/bank-accounts'); } catch {}
  }

  addItem(): void {
    const p = this.products.find((x) => String(x.id) === this.selectedProductId);
    if (!p) return;
    const existing = this.items.find((i) => i.productId === p.id);
    if (existing) { existing.quantity++; }
    else { this.items = [...this.items, { productId: p.id, productName: p.name, quantity: 1, price: p.price }]; }
    this.selectedProductId = '';
  }

  removeItem(i: number): void {
    this.items = this.items.filter((_, j) => j !== i);
  }

  total(): number {
    return this.items.reduce((s, i) => s + i.quantity * i.price, 0);
  }

  resetForm(): void {
    this.supplierId = '';
    this.bankAccountId = '';
    this.selectedProductId = '';
    this.items = [];
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      const created = await this.api.post<PurchaseResponse>('/purchases', {
        supplierId:    Number(this.supplierId),
        bankAccountId: this.bankAccountId ? Number(this.bankAccountId) : null,
        items: this.items.map((i) => ({
          productId: i.productId,
          quantity:  i.quantity,
          price:     i.price,
        })),
      });
      this.rows = [created, ...this.rows];
      this.toast.success('Compra registrada');
      this.open = false;
      this.resetForm();
    } catch {
      this.toast.error('Error al registrar compra');
    } finally {
      this.saving = false;
    }
  }
}