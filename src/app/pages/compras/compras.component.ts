import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type PurchaseStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED' | 'PAID' | 'CANCELLED';
type Supplier       = { id: number; name: string };
type Product        = { id: number; name: string; price: number };
type BankAccount    = { id: number; accountName: string | null; bank: string; accountNumber: string; balance: number; currency: string };
type Warehouse      = { id: number; name: string; active: boolean };
type PurchaseItem   = { productId: number; productName: string; quantity: number; price: number };

type PurchaseItemResponse = { productName: string; quantity: number; price: number; subtotal: number };

type PurchaseResponse = {
  id: number;
  supplierName: string;
  bankAccountName: string;
  warehouseName: string;
  status: PurchaseStatus;
  total: number;
  createdAt: string;
  items: PurchaseItemResponse[];
};

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT:     'Borrador',
  SENT:      'Enviado',
  CONFIRMED: 'Confirmado',
  RECEIVED:  'Recibido',
  PAID:      'Pagado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT:     'bg-muted text-muted-foreground',
  SENT:      'bg-yellow-500/20 text-yellow-600',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  RECEIVED:  'bg-accent/20 text-accent',
  PAID:      'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-destructive/20 text-destructive',
};

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css',
})
export class ComprasComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);
  loading = true;

  rows: PurchaseResponse[]    = [];
  suppliers: Supplier[]       = [];
  products: Product[]         = [];
  bankAccounts: BankAccount[] = [];
  warehouses: Warehouse[]     = [];
  items: PurchaseItem[]       = [];
  open              = false;
  saving            = false;
  supplierId        = '';
  bankAccountId     = '' as number | '';
  warehouseId       = '' as number | '';
  selectedProductId = '';
  prefillRequestId: number | null = null;

  editingPurchase: PurchaseResponse | null = null;
  editItems: PurchaseItem[] = [];
  editSupplierId            = '';
  editBankAccountId         = '' as number | '';
  editWarehouseId           = '' as number | '';
  editSelectedProductId     = '';
  savingEdit                = false;

  readonly statusEntries = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    key:   key as PurchaseStatus,
    label,
    color: STATUS_COLORS[key as PurchaseStatus],
  }));

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.loadSuppliers(),
        this.loadProducts(),
        this.loadPurchases(),
        this.loadBankAccounts(),
        this.loadWarehouses(),
      ]);

      const prefill = history.state?.prefill;
      if (prefill) {
        const product = this.products.find(p => p.name === prefill.productName);
        if (product) {
          this.items = [{
            productId:   product.id,
            productName: product.name,
            quantity:    prefill.quantity,
            price:       product.price,
          }];
          this.prefillRequestId = prefill.requestId ?? null;
          this.open = true;
          this.toast.success(`Prellenado con: ${prefill.productName} × ${prefill.quantity}`);
        }
      }
    } finally {
      this.loading = false;
    }
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

  async loadWarehouses(): Promise<void> {
    try {
      const all = await this.api.get<Warehouse[]>('/warehouses');
      this.warehouses = all.filter(w => w.active);
    } catch {}
  }

  addItem(): void {
    const p = this.products.find(x => String(x.id) === this.selectedProductId);
    if (!p) return;
    const existing = this.items.find(i => i.productId === p.id);
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

  statusLabel(s: PurchaseStatus): string { return STATUS_LABELS[s] ?? s; }
  statusColor(s: PurchaseStatus): string { return STATUS_COLORS[s] ?? ''; }

  resetForm(): void {
    this.supplierId        = '';
    this.bankAccountId     = '';
    this.warehouseId       = '';
    this.selectedProductId = '';
    this.items             = [];
    this.prefillRequestId  = null;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      const created = await this.api.post<PurchaseResponse>('/purchases', {
        supplierId:    Number(this.supplierId),
        bankAccountId: this.bankAccountId ? Number(this.bankAccountId) : null,
        warehouseId:   this.warehouseId ? Number(this.warehouseId) : null,
        items: this.items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      this.rows = [created, ...this.rows];
      this.toast.success('Orden creada en borrador');
      this.open = false;

      if (this.prefillRequestId) {
        await this.api.patch(`/purchase-requests/${this.prefillRequestId}/purchase-created`);
        this.prefillRequestId = null;
      }

      this.resetForm();
    } catch {
      this.toast.error('Error al crear orden');
    } finally {
      this.saving = false;
    }
  }

  openEdit(r: PurchaseResponse): void {
    this.editingPurchase   = r;
    this.editSupplierId    = String(this.suppliers.find(s => s.name === r.supplierName)?.id ?? '');
    this.editBankAccountId = '';
    this.editWarehouseId   = this.warehouses.find(w => w.name === r.warehouseName)?.id ?? '';
    this.editItems = r.items.map(i => {
      const p = this.products.find(p => p.name === i.productName);
      return { productId: p?.id ?? 0, productName: i.productName, quantity: i.quantity, price: Number(i.price) };
    });
    this.editSelectedProductId = '';
  }

  addEditItem(): void {
    const p = this.products.find(x => String(x.id) === this.editSelectedProductId);
    if (!p) return;
    const existing = this.editItems.find(i => i.productId === p.id);
    if (existing) { existing.quantity++; }
    else { this.editItems = [...this.editItems, { productId: p.id, productName: p.name, quantity: 1, price: p.price }]; }
    this.editSelectedProductId = '';
  }

  removeEditItem(i: number): void {
    this.editItems = this.editItems.filter((_, j) => j !== i);
  }

  editTotal(): number {
    return this.editItems.reduce((s, i) => s + i.quantity * i.price, 0);
  }

  async saveEdit(): Promise<void> {
    if (!this.editingPurchase) return;
    this.savingEdit = true;
    try {
      const updated = await this.api.put<PurchaseResponse>(`/purchases/${this.editingPurchase.id}`, {
        supplierId:    Number(this.editSupplierId),
        bankAccountId: this.editBankAccountId ? Number(this.editBankAccountId) : null,
        warehouseId:   this.editWarehouseId ? Number(this.editWarehouseId) : null,
        items: this.editItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      this.rows = this.rows.map(r => r.id === updated.id ? updated : r);
      this.toast.success('Orden actualizada');
      this.editingPurchase = null;
    } catch {
      this.toast.error('Error al actualizar orden');
    } finally {
      this.savingEdit = false;
    }
  }

  async advance(id: number, action: string): Promise<void> {
    try {
      const updated = await this.api.patch<PurchaseResponse>(`/purchases/${id}/${action}`);
      this.rows = this.rows.map(r => r.id === id ? updated : r);
      this.toast.success('Estado actualizado');
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Error al actualizar estado');
    }
  }
}