import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type TransferType = 'COMPRA' | 'VENTA' | 'TRASLADO' | 'IMPORTACION';
type Warehouse    = { id: number; name: string };
type Product      = { id: number; name: string; stock: number };
type GuideItem    = { productId: number; productName: string; quantity: number };

type TransferGuideResponse = {
  id: number;
  type: TransferType;
  originWarehouse: string;
  destinationWarehouse: string;
  description: string;
  createdBy: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

const TYPE_LABELS: Record<TransferType, string> = {
  COMPRA: 'Compra', VENTA: 'Venta', TRASLADO: 'Traslado', IMPORTACION: 'Importación',
};

@Component({
  selector: 'app-guias',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './guias.component.html',
  styleUrl: './guias.component.css',
})
export class GuiasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  rows: TransferGuideResponse[] = [];
  warehouses: Warehouse[]       = [];
  products: Product[]           = [];
  items: GuideItem[]            = [];
  open              = false;
  saving            = false;
  selectedProductId = '';
  form = {
    type: 'TRASLADO' as TransferType,
    originWarehouseId: '' as number | '',
    destinationWarehouseId: '' as number | '',
    description: '',
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadWarehouses(), this.loadProducts()]);
  }

  async load(): Promise<void> {
    try {
      this.rows = await this.api.get<TransferGuideResponse[]>('/transfer-guides');
    } catch {
      this.toast.error('Error al cargar guías');
    }
  }

  async loadWarehouses(): Promise<void> {
    try { this.warehouses = await this.api.get<Warehouse[]>('/warehouses'); } catch {}
  }

  async loadProducts(): Promise<void> {
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
  }

  typeLabel(t: TransferType): string {
    return TYPE_LABELS[t] ?? t;
  }

  addItem(): void {
    const p = this.products.find((x) => String(x.id) === this.selectedProductId);
    if (!p) return;
    const existing = this.items.find((i) => i.productId === p.id);
    if (existing) { existing.quantity++; }
    else { this.items = [...this.items, { productId: p.id, productName: p.name, quantity: 1 }]; }
    this.selectedProductId = '';
  }

  removeItem(i: number): void {
    this.items = this.items.filter((_, j) => j !== i);
  }

  resetForm(): void {
    this.form = { type: 'TRASLADO', originWarehouseId: '', destinationWarehouseId: '', description: '' };
    this.items = [];
    this.selectedProductId = '';
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/transfer-guides', {
        type:                   this.form.type,
        originWarehouseId:      this.form.originWarehouseId ? Number(this.form.originWarehouseId) : null,
        destinationWarehouseId: this.form.destinationWarehouseId ? Number(this.form.destinationWarehouseId) : null,
        description:            this.form.description,
        items:                  this.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      this.toast.success('Guía creada');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear guía');
    } finally {
      this.saving = false;
    }
  }
}