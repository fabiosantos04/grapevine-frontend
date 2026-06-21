import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

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
  imports: [CommonModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.css',
})
export class AuditoriaComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  loading = true;

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

    this.loading = false;
  }
}