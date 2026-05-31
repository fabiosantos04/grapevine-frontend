import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type Product = { id: number; name: string; price: number; stock: number };

type OrderItem = { productId: number; productName: string; quantity: number; price: number };

type OrderResponse = {
  id: number;
  customerName: string;
  customerDocument: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  details: { productName: string; quantity: number; price: number; subtotal: number }[];
};

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css',
})
export class VentasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  rows: OrderResponse[] = [];
  products: Product[]   = [];
  items: OrderItem[]    = [];
  open              = false;
  saving            = false;
  selectedProductId = '';
  form = { customerName: '', customerDocument: '' };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadOrders(), this.loadProducts()]);
  }

  async loadOrders(): Promise<void> {
    try {
      this.rows = await this.api.get<OrderResponse[]>('/orders');
    } catch {
      this.toast.error('Error al cargar ventas');
    }
  }

  async loadProducts(): Promise<void> {
    try {
      this.products = await this.api.get<Product[]>('/products');
    } catch {
      this.toast.error('Error al cargar productos');
    }
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
    this.form = { customerName: '', customerDocument: '' };
    this.items = [];
    this.selectedProductId = '';
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/orders', {
        customerName:     this.form.customerName,
        customerDocument: this.form.customerDocument,
        items: this.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      this.toast.success('Venta registrada');
      this.open = false;
      this.resetForm();
      await this.loadOrders();
    } catch {
      this.toast.error('Error al registrar venta');
    } finally {
      this.saving = false;
    }
  }
}