import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type AdjustmentRow = {
  id: number;
  productName: string;
  warehouseName: string;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

type WarehouseStock = {
  warehouseStockId: number;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  productCategory: string;
  stock: number;
};

type Warehouse = { id: number; name: string; active: boolean };
type Product   = { id: number; name: string; stock: number };

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css',
})
export class InventarioComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  rows: AdjustmentRow[]     = [];
  stockRows: WarehouseStock[] = [];
  warehouses: Warehouse[]   = [];
  products: Product[]       = [];

  activeTab: 'stock' | 'ajustes' = 'stock';
  open   = false;
  saving = false;

  filterWarehouseId: number | '' = '';
  form = {
    productId:   '' as number | '',
    warehouseId: '' as number | '',
    newStock:    0,
    reason:      '',
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadWarehouses(),
      this.loadProducts(),
      this.loadStock(),
      this.loadAdjustments(),
    ]);

    // Leer ?almacen=ID desde la URL (viene de almacenes → Ver stock)
    this.route.queryParams.subscribe(params => {
      if (params['almacen']) {
        this.filterWarehouseId = Number(params['almacen']);
        this.activeTab = 'stock';
        this.applyStockFilter();
      }
    });
  }

  async loadWarehouses(): Promise<void> {
    try { this.warehouses = await this.api.get<Warehouse[]>('/warehouses'); } catch {}
  }

  async loadProducts(): Promise<void> {
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
  }

  async loadStock(): Promise<void> {
    try {
      const url = this.filterWarehouseId
        ? `/inventory/stock?warehouseId=${this.filterWarehouseId}`
        : '/inventory/stock';
      this.stockRows = await this.api.get<WarehouseStock[]>(url);
    } catch {
      this.toast.error('Error al cargar stock');
    }
  }

  async loadAdjustments(): Promise<void> {
    try {
      const url = this.filterWarehouseId
        ? `/inventory?warehouseId=${this.filterWarehouseId}`
        : '/inventory';
      this.rows = await this.api.get<AdjustmentRow[]>(url);
    } catch {
      this.toast.error('Error al cargar ajustes');
    }
  }

  async applyStockFilter(): Promise<void> {
    await Promise.all([this.loadStock(), this.loadAdjustments()]);
  }

  onProductChange(id: number | ''): void {
    const p = this.products.find(x => x.id === Number(id));
    if (p) this.form.newStock = p.stock;
  }

  resetForm(): void {
    this.form = { productId: '', warehouseId: '', newStock: 0, reason: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/inventory/adjust', {
        productId:   Number(this.form.productId),
        warehouseId: Number(this.form.warehouseId),
        newStock:    this.form.newStock,
        reason:      this.form.reason,
      });
      this.toast.success('Stock ajustado');
      this.open = false;
      this.resetForm();
      await Promise.all([this.loadStock(), this.loadAdjustments(), this.loadProducts()]);
    } catch {
      this.toast.error('Error al ajustar stock');
    } finally {
      this.saving = false;
    }
  }
}