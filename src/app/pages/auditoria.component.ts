import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';

type AuditEntry = {
  date: string;
  action: string;
  detail: string;
  user: string;
};

type PurchaseRequest = {
  id: number;
  productName: string;
  requestedBy: string;
  quantity: number;
  status: string;
  createdAt: string;
};

type AdjustmentRow = {
  id: number;
  productName: string;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Logs de auditoría" description="Trazabilidad de acciones del sistema." />

      @if (!auth.roles().includes('admin')) {
        <p class="mb-4 rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Solo los administradores pueden ver el historial completo.
        </p>
      }

      <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table class="w-full text-sm">
          <thead class="bg-card-foreground/5 text-xs uppercase text-muted-foreground">
            <tr>
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Acción</th>
              <th class="px-4 py-3 text-left">Detalle</th>
              <th class="px-4 py-3 text-left">Usuario</th>
            </tr>
          </thead>
          <tbody>
            @if (!rows.length) {
              <tr>
                <td colspan="4" class="px-4 py-12 text-center text-muted-foreground">Sin registros</td>
              </tr>
            } @else {
              @for (r of rows; track $index) {
                <tr class="border-t border-border/40">
                  <td class="px-4 py-3 text-muted-foreground">{{ r.date | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs"
                      [class]="{
                        'bg-accent/20 text-accent':           r.action === 'Solicitud de compra',
                        'bg-yellow-500/20 text-yellow-600':   r.action === 'Ajuste de stock'
                      }">
                      {{ r.action }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{{ r.detail }}</td>
                  <td class="px-4 py-3 font-medium">{{ r.user }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AuditoriaComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  rows: AuditEntry[] = [];

  async ngOnInit(): Promise<void> {
    const [requests, adjustments] = await Promise.all([
      this.api.get<PurchaseRequest[]>('/purchase-requests').catch(() => [] as PurchaseRequest[]),
      this.api.get<AdjustmentRow[]>('/inventory').catch(() => [] as AdjustmentRow[]),
    ]);

    const fromRequests: AuditEntry[] = requests.map((r) => ({
      date: r.createdAt,
      action: 'Solicitud de compra',
      detail: `${r.productName} × ${r.quantity} — ${r.status}`,
      user: r.requestedBy,
    }));

    const fromAdjustments: AuditEntry[] = adjustments.map((a) => ({
      date: a.createdAt,
      action: 'Ajuste de stock',
      detail: `${a.productName}: ${a.previousStock} → ${a.newStock} (${a.reason})`,
      user: '—',
    }));

    this.rows = [...fromRequests, ...fromAdjustments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}