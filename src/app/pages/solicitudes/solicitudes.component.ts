import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type PurchaseRequest = {
  id: number;
  productName: string;
  requestedBy: string;
  quantity: number;
  justification: string;
  status: RequestStatus;
  purchaseCreated: boolean;
  createdAt: string;
};

type Product = { id: number; name: string; stock: number };

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css',
})
export class SolicitudesComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);
  loading = true;

  rows: PurchaseRequest[] = [];
  products: Product[]     = [];
  open    = false;
  saving  = false;
  form    = { productId: '' as number | '', quantity: 1, justification: '' };

  filterStatus: '' | RequestStatus = '';
  filterProduct = '';
  filterRequestedBy = '';
  filterFrom = '';
  filterTo = '';

  get canApprovePurchases(): boolean {
    return this.auth.canApprovePurchases();
  }

  get isAdmin(): boolean {
    return this.auth.roles().includes('admin');
  }

  get canCreateRequest(): boolean {
    const roles = this.auth.roles();
    return roles.includes('almacenero') || roles.includes('ingeniero');
  }

  get requesters(): string[] {
    return Array.from(new Set(this.rows.map(r => r.requestedBy))).sort();
  }

  get dateRangeInvalid(): boolean {
    return !!this.filterFrom && !!this.filterTo && this.filterTo < this.filterFrom;
  }

  get filtered(): PurchaseRequest[] {
    const term = this.filterProduct.trim().toLowerCase();
    const from = this.filterFrom ? new Date(this.filterFrom + 'T00:00:00').getTime() : null;
    const to   = this.filterTo ? new Date(this.filterTo + 'T23:59:59').getTime() : null;

    return this.rows.filter(r => {
      const matchStatus = !this.filterStatus || r.status === this.filterStatus;
      const matchProduct = !term || r.productName.toLowerCase().includes(term);
      const matchRequester = !this.filterRequestedBy || r.requestedBy === this.filterRequestedBy;
      const time = new Date(r.createdAt).getTime();
      const matchFrom = from === null || time >= from;
      const matchTo   = to === null || time <= to;
      return matchStatus && matchProduct && matchRequester && matchFrom && matchTo;
    });
  }

  async ngOnInit(): Promise<void> {
    await this.load();
    if (this.canCreateRequest) {
      await this.loadProducts();
    }
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      this.rows = await this.api.get<PurchaseRequest[]>('/purchase-requests');
    } catch {
      this.toast.error('Error al cargar solicitudes');
    }
  }

  async loadProducts(): Promise<void> {
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
  }

  statusLabel(s: RequestStatus): string {
    return { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' }[s];
  }

  limpiarFiltros(): void {
    this.filterStatus = '';
    this.filterProduct = '';
    this.filterRequestedBy = '';
    this.filterFrom = '';
    this.filterTo = '';
  }

  resetForm(): void {
    this.form = { productId: '', quantity: 1, justification: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/purchase-requests', {
        productId:     Number(this.form.productId),
        quantity:      this.form.quantity,
        justification: this.form.justification,
      });
      this.toast.success('Solicitud enviada');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al enviar solicitud');
    } finally {
      this.saving = false;
    }
  }

  async approve(id: number): Promise<void> {
    try {
      await this.api.patch(`/purchase-requests/${id}/approve`);
      this.toast.success('Solicitud aprobada');
      await this.load();
    } catch {
      this.toast.error('Error al aprobar solicitud');
    }
  }

  async reject(id: number): Promise<void> {
    try {
      await this.api.patch(`/purchase-requests/${id}/reject`);
      this.toast.success('Solicitud rechazada');
      await this.load();
    } catch {
      this.toast.error('Error al rechazar solicitud');
    }
  }

  createPurchase(r: PurchaseRequest): void {
    this.router.navigate(['/app/compras'], {
      state: { prefill: { productName: r.productName, quantity: r.quantity, requestId: r.id } }
    });
    this.toast.success('Abriendo módulo de compras con los datos de la solicitud…');
  }
}