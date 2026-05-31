import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

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
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css',
})
export class SolicitudesComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  rows: PurchaseRequest[] = [];
  products: Product[]     = [];
  open    = false;
  saving  = false;
  form    = { productId: '' as number | '', quantity: 1, justification: '' };

  get isAdmin(): boolean {
    return this.auth.roles().includes('admin');
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadProducts()]);
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