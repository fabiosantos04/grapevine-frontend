import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Product   = { id: number; name: string; price: number; stock: number };
type Warehouse = { id: number; name: string; active: boolean };

type Customer = {
  id: number;
  razonSocial: string;
  tipoDocumento: string;
  documento: string;
  active: boolean;
};

type WarehouseStock = {
  productId: number;
  productName: string;
  stock: number;
};

type OrderItem = { productId: number; productName: string; quantity: number; price: number };

type OrderResponse = {
  id: number;
  customerName: string;
  customerDocument: string;
  warehouseName: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  cancelReason: string | null;
  cancelledAt: string | null;
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

  rows: OrderResponse[]       = [];
  warehouses: Warehouse[]     = [];
  customers: Customer[]       = [];
  stockInWarehouse: WarehouseStock[] = [];
  items: OrderItem[]          = [];
  open              = false;
  saving            = false;
  selectedProductId = '';

  clienteRegistrado = true;
  selectedCustomerId: number | '' = '';

  form = { customerName: '', customerDocument: '', warehouseId: '' as number | '' };

  search = '';
  filterStatus: '' | 'PENDING' | 'PAID' | 'CANCELLED' = '';
  filterWarehouse: number | '' = '';
  filterFrom = '';
  filterTo = '';

  cancelOpen = false;
  cancelSaving = false;
  cancelOrder: OrderResponse | null = null;
  cancelReason = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadOrders(), this.loadWarehouses(), this.loadCustomers()]);
  }

  async loadOrders(): Promise<void> {
    try {
      this.rows = await this.api.get<OrderResponse[]>('/orders');
    } catch {
      this.toast.error('Error al cargar ventas');
    }
  }

  async loadWarehouses(): Promise<void> {
    try {
      const all = await this.api.get<Warehouse[]>('/warehouses');
      this.warehouses = all.filter(w => w.active);
    } catch {}
  }

  async loadCustomers(): Promise<void> {
    try {
      const all = await this.api.get<Customer[]>('/customers');
      this.customers = all.filter(c => c.active);
    } catch {}
  }

  get filtered(): OrderResponse[] {
    const term = this.search.trim().toLowerCase();
    const from = this.filterFrom ? new Date(this.filterFrom + 'T00:00:00').getTime() : null;
    const to   = this.filterTo ? new Date(this.filterTo + 'T23:59:59').getTime() : null;

    return this.rows.filter(o => {
      const matchSearch = !term
        || (o.customerName ?? '').toLowerCase().includes(term)
        || (o.customerDocument ?? '').toLowerCase().includes(term);
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      const matchWarehouse = !this.filterWarehouse
        || o.warehouseName === this.warehouses.find(w => w.id === Number(this.filterWarehouse))?.name;
      const time = new Date(o.createdAt).getTime();
      const matchFrom = from === null || time >= from;
      const matchTo   = to === null || time <= to;
      return matchSearch && matchStatus && matchWarehouse && matchFrom && matchTo;
    });
  }

  onClienteModeChange(): void {
    this.selectedCustomerId = '';
    this.form.customerName = '';
    this.form.customerDocument = '';
  }

  onCustomerSelect(): void {
    const c = this.customers.find(x => x.id === Number(this.selectedCustomerId));
    if (c) {
      this.form.customerName = c.razonSocial;
      this.form.customerDocument = c.documento;
    }
  }

  async onWarehouseChange(): Promise<void> {
    this.items = [];
    this.selectedProductId = '';
    this.stockInWarehouse = [];
    if (!this.form.warehouseId) return;
    try {
      this.stockInWarehouse = await this.api.get<WarehouseStock[]>(
        `/inventory/stock?warehouseId=${this.form.warehouseId}`
      );
    } catch {
      this.toast.error('Error al cargar stock del almacén');
    }
  }

  async addItem(): Promise<void> {
    const s = this.stockInWarehouse.find(x => String(x.productId) === this.selectedProductId);
    if (!s) return;
    if (s.stock <= 0) {
      this.toast.error('Sin stock disponible en este almacén');
      return;
    }
    const existing = this.items.find(i => i.productId === s.productId);
    if (existing) {
      if (existing.quantity >= s.stock) {
        this.toast.error('No hay más stock disponible');
        return;
      }
      existing.quantity++;
    } else {
      let price = 0;
      try {
        const product = await this.api.get<Product>(`/products/${s.productId}`);
        price = product.price;
      } catch {
        this.toast.error('No se pudo obtener el precio del producto');
        return;
      }
      this.items = [...this.items, {
        productId: s.productId,
        productName: s.productName,
        quantity: 1,
        price,
      }];
    }
    this.selectedProductId = '';
  }

  stockOf(productId: number): number {
    return this.stockInWarehouse.find(s => s.productId === productId)?.stock ?? 0;
  }

  removeItem(i: number): void {
    this.items = this.items.filter((_, j) => j !== i);
  }

  total(): number {
    return this.items.reduce((s, i) => s + i.quantity * i.price, 0);
  }

  resetForm(): void {
    this.form = { customerName: '', customerDocument: '', warehouseId: '' };
    this.items = [];
    this.selectedProductId = '';
    this.stockInWarehouse = [];
    this.clienteRegistrado = true;
    this.selectedCustomerId = '';
  }

  canSubmit(): boolean {
    if (this.saving || !this.form.warehouseId || !this.items.length) return false;
    if (this.clienteRegistrado) return !!this.selectedCustomerId;
    return !!this.form.customerName.trim();
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      const created = await this.api.post<OrderResponse>('/orders', {
        customerName:     this.form.customerName,
        customerDocument: this.form.customerDocument,
        warehouseId:      Number(this.form.warehouseId),
        items: this.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      this.toast.success('Venta registrada');
      this.open = false;
      this.resetForm();
      await this.loadOrders();
      this.generarComprobante(created);
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Error al registrar venta');
    } finally {
      this.saving = false;
    }
  }

  openCancel(order: OrderResponse): void {
    this.cancelOrder = order;
    this.cancelReason = '';
    this.cancelOpen = true;
  }

  async confirmCancel(): Promise<void> {
    if (!this.cancelOrder) return;
    this.cancelSaving = true;
    try {
      await this.api.patch(`/orders/${this.cancelOrder.id}/cancel`, {
        reason: this.cancelReason,
      });
      this.toast.success('Venta anulada y stock repuesto');
      this.cancelOpen = false;
      this.cancelOrder = null;
      await this.loadOrders();
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Error al anular la venta');
    } finally {
      this.cancelSaving = false;
    }
  }

  generarComprobante(order: OrderResponse): void {
    const doc = new jsPDF();
    const wine: [number, number, number] = [122, 28, 46];
    const gold: [number, number, number] = [201, 168, 76];

    doc.setFillColor(...wine);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Vitivinícolas Perú', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20123456789', 14, 26);
    doc.text('Av. La Viña 123, Lima - Perú', 14, 31);

    doc.setTextColor(...gold);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE VENTA', 196, 18, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`N° ${String(order.id).padStart(6, '0')}`, 196, 26, { align: 'right' });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    const y = 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName || '—', 40, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 14, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerDocument || '—', 40, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 130, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.createdAt).toLocaleString('es-PE'), 150, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Almacén:', 130, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(order.warehouseName || '—', 150, y + 6);

    autoTable(doc, {
      startY: y + 14,
      head: [['Producto', 'Cant.', 'Precio unit.', 'Subtotal']],
      body: order.details.map(d => [
        d.productName,
        String(d.quantity),
        `S/ ${Number(d.price).toFixed(2)}`,
        `S/ ${Number(d.subtotal).toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: wine, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 244, 245] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(...gold);
    doc.rect(130, finalY, 66, 12, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 134, finalY + 8);
    doc.text(`S/ ${Number(order.total).toFixed(2)}`, 192, finalY + 8, { align: 'right' });

    if (order.status === 'CANCELLED') {
      doc.setTextColor(200, 40, 40);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.text('ANULADA', 105, 160, { align: 'center', angle: 20 });
    }

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento interno sin valor tributario oficial. Gracias por su compra.', 105, 285, { align: 'center' });

    doc.save(`comprobante-${String(order.id).padStart(6, '0')}.pdf`);
  }
}