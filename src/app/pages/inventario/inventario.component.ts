import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

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
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css',
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
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
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