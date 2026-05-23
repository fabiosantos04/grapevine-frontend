import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

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
  template: `
    <div>
      <app-page-header title="Solicitudes de compra" description="Detección de stock bajo y solicitudes de reposición.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nueva solicitud
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nueva solicitud de compra</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Producto</label>
                <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [(ngModel)]="form.productId" [ngModelOptions]="{ standalone: true }">
                  <option value="">Selecciona producto</option>
                  @for (p of products; track p.id) {
                    <option [value]="p.id">
                      {{ p.name }} (stock actual: {{ p.stock }})
                    </option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm">Cantidad solicitada</label>
                <input type="number" min="1"
                  class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.quantity" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div>
                <label class="text-sm">Justificación</label>
                <textarea rows="3"
                  class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.justification" [ngModelOptions]="{ standalone: true }"
                  placeholder="Ej: Stock bajo, temporada alta, rotura de stock…"></textarea>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.productId || !form.quantity"
                (click)="submit()">
                {{ saving ? 'Enviando…' : 'Enviar solicitud' }}
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
              <th class="px-4 py-3 text-left">Producto</th>
              <th class="px-4 py-3 text-left">Solicitado por</th>
              <th class="px-4 py-3 text-right">Cantidad</th>
              <th class="px-4 py-3 text-left">Justificación</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (!rows.length) {
              <tr>
                <td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
                  Sin solicitudes registradas
                </td>
              </tr>
            } @else {
              @for (r of rows; track r.id) {
                <tr class="border-t border-border/40">
                  <td class="px-4 py-3 text-muted-foreground">{{ r.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-3 font-medium">{{ r.productName }}</td>
                  <td class="px-4 py-3 text-muted-foreground">{{ r.requestedBy }}</td>
                  <td class="px-4 py-3 text-right font-mono">{{ r.quantity }}</td>
                  <td class="px-4 py-3 text-muted-foreground">{{ r.justification || '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs"
                      [class]="{
                        'bg-yellow-500/20 text-yellow-600':   r.status === 'PENDING',
                        'bg-accent/20 text-accent':           r.status === 'APPROVED',
                        'bg-destructive/20 text-destructive': r.status === 'REJECTED'
                      }">
                      {{ statusLabel(r.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      @if (r.status === 'PENDING' && isAdmin) {
                        <button type="button"
                          class="rounded-md bg-accent/20 px-2 py-1 text-xs text-accent hover:bg-accent/30"
                          (click)="approve(r.id)">Aprobar</button>
                        <button type="button"
                          class="rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive hover:bg-destructive/30"
                          (click)="reject(r.id)">Rechazar</button>
                      }
                      @if (r.status === 'APPROVED' && !r.purchaseCreated && isAdmin) {
                        <button type="button"
                          class="rounded-md bg-primary/80 px-2 py-1 text-xs text-primary-foreground hover:bg-primary"
                          (click)="createPurchase(r)">
                          + Crear compra
                        </button>
                      }
                      @if (r.status === 'APPROVED' && r.purchaseCreated) {
                        <span class="text-xs text-accent">✓ Compra creada</span>
                      }
                      @if (r.status === 'REJECTED') {
                        <span class="text-xs text-muted-foreground">—</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
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
    try {
      this.products = await this.api.get<Product[]>('/products');
    } catch {}
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
      state: {
        prefill: {
          productName: r.productName,
          quantity:    r.quantity,
          requestId:   r.id,
        }
      }
    });
    this.toast.success('Abriendo módulo de compras con los datos de la solicitud…');
  }
}