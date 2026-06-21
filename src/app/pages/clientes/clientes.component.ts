import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

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

type OrderResponse = {
  id: number;
  customerName: string;
  customerDocument: string;
  warehouseName: string;
  total: number;
  status: string;
  createdAt: string;
  details: { productName: string; quantity: number; price: number; subtotal: number }[];
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
})
export class ClientesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = true;

  list: Customer[] = [];
  open      = false;
  saving    = false;
  editingId: number | null = null;

  search = '';
  filterTipoDocumento: DocumentType | '' = '';
  filterEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  historyOpen = false;
  historyLoading = false;
  historyCustomer: Customer | null = null;
  historyOrders: OrderResponse[] = [];

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
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Customer[]>('/customers');
    } catch {
      this.toast.error('Error al cargar clientes');
    }
  }

  get filtered(): Customer[] {
    const term = this.search.trim().toLowerCase();
    return this.list.filter(c => {
      const matchSearch = !term
        || c.razonSocial.toLowerCase().includes(term)
        || c.documento.toLowerCase().includes(term)
        || (c.email ?? '').toLowerCase().includes(term)
        || (c.contacto ?? '').toLowerCase().includes(term);
      const matchTipo = !this.filterTipoDocumento || c.tipoDocumento === this.filterTipoDocumento;
      const matchEstado = this.filterEstado === 'todos'
        || (this.filterEstado === 'activos' && c.active)
        || (this.filterEstado === 'inactivos' && !c.active);
      return matchSearch && matchTipo && matchEstado;
    });
  }

  resetForm(): void {
    this.form = { razonSocial: '', tipoDocumento: 'DNI', documento: '', contacto: '', telefono: '', email: '', segmento: '' };
    this.editingId = null;
  }

  openCreate(): void {
    this.resetForm();
    this.open = true;
  }

  openEdit(c: Customer): void {
    this.editingId = c.id;
    this.form = {
      razonSocial: c.razonSocial,
      tipoDocumento: c.tipoDocumento,
      documento: c.documento,
      contacto: c.contacto ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      segmento: c.segmento ?? '',
    };
    this.open = true;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      if (this.editingId) {
        await this.api.put(`/customers/${this.editingId}`, this.form);
        this.toast.success('Cliente actualizado');
      } else {
        await this.api.post('/customers', this.form);
        this.toast.success('Cliente creado');
      }
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error(this.editingId ? 'Error al actualizar cliente' : 'Error al crear cliente');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(c: Customer): Promise<void> {
    try {
      await this.api.patch(`/customers/${c.id}/toggle-active`);
      this.toast.success(c.active ? 'Cliente inhabilitado' : 'Cliente habilitado');
      await this.load();
    } catch {
      this.toast.error('Error al cambiar estado del cliente');
    }
  }

  async openHistory(c: Customer): Promise<void> {
    this.historyCustomer = c;
    this.historyOrders = [];
    this.historyOpen = true;
    this.historyLoading = true;
    try {
      this.historyOrders = await this.api.get<OrderResponse[]>(`/orders/by-customer/${c.documento}`);
    } catch {
      this.toast.error('Error al cargar el historial');
    } finally {
      this.historyLoading = false;
    }
  }

  historyTotal(): number {
    return this.historyOrders.reduce((s, o) => s + Number(o.total), 0);
  }
}