import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type TransferType   = 'COMPRA' | 'VENTA' | 'TRASLADO' | 'IMPORTACION';
type GuideStatus    = 'BORRADOR' | 'PREPARANDO' | 'EN_TRANSITO' | 'ENTREGADO' | 'INCIDENCIA' | 'CANCELADO';
type Warehouse      = { id: number; name: string };
type Product        = { id: number; name: string; stock: number };
type GuideItem      = { productId: number; productName: string; quantity: number };

type TransferGuideResponse = {
  id: number;
  type: TransferType;
  status: GuideStatus;
  originWarehouse: string;
  originWarehouseId: number;
  destinationWarehouse: string;
  destinationWarehouseId: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  incidentReason: string | null;
  incidentEvidenceUrl: string | null;
  stockRecoverable: boolean | null;
  items: { productId: number; productName: string; quantity: number }[];
};

const TYPE_LABELS: Record<TransferType, string> = {
  COMPRA: 'Compra', VENTA: 'Venta', TRASLADO: 'Traslado', IMPORTACION: 'Importación',
};

const STATUS_LABELS: Record<GuideStatus, string> = {
  BORRADOR:    'Borrador',
  PREPARANDO:  'Preparando',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO:   'Entregado',
  INCIDENCIA:  'Incidencia',
  CANCELADO:   'Cancelado',
};

const STATUS_COLORS: Record<GuideStatus, string> = {
  BORRADOR:    'bg-muted text-muted-foreground',
  PREPARANDO:  'bg-yellow-500/20 text-yellow-600',
  EN_TRANSITO: 'bg-blue-500/20 text-blue-400',
  ENTREGADO:   'bg-accent/20 text-accent',
  INCIDENCIA:  'bg-destructive/20 text-destructive',
  CANCELADO:   'bg-muted text-muted-foreground',
};

const TIMELINE_STEPS: GuideStatus[] = ['BORRADOR', 'PREPARANDO', 'EN_TRANSITO', 'ENTREGADO'];

@Component({
  selector: 'app-guias',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './guias.component.html',
  styleUrl: './guias.component.css',
})
export class GuiasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  rows: TransferGuideResponse[] = [];
  warehouses: Warehouse[]       = [];
  products: Product[]           = [];
  items: GuideItem[]            = [];

  open              = false;
  saving            = false;
  selectedProductId = '';

  // Modal de detalle/timeline
  selectedGuide: TransferGuideResponse | null = null;

  // Modal de incidencia
  incidentOpen      = false;
  incidentSaving    = false;
  incidentForm      = { reason: '', evidenceUrl: '', stockRecoverable: true };

  form = {
    type: 'TRASLADO' as TransferType,
    originWarehouseId:      '' as number | '',
    destinationWarehouseId: '' as number | '',
    description: '',
  };

  readonly TIMELINE_STEPS = TIMELINE_STEPS;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadWarehouses(), this.loadProducts()]);
  }

  async load(): Promise<void> {
    try {
      this.rows = await this.api.get<TransferGuideResponse[]>('/transfer-guides');
    } catch {
      this.toast.error('Error al cargar guías');
    }
  }

  async loadWarehouses(): Promise<void> {
    try { this.warehouses = await this.api.get<Warehouse[]>('/warehouses'); } catch {}
  }

  async loadProducts(): Promise<void> {
    try { this.products = await this.api.get<Product[]>('/products'); } catch {}
  }

  typeLabel(t: TransferType): string  { return TYPE_LABELS[t] ?? t; }
  statusLabel(s: GuideStatus): string { return STATUS_LABELS[s] ?? s; }
  statusColor(s: GuideStatus): string { return STATUS_COLORS[s] ?? ''; }

  stepIndex(s: GuideStatus): number { return TIMELINE_STEPS.indexOf(s); }

  isStepDone(guide: TransferGuideResponse, step: GuideStatus): boolean {
    if (guide.status === 'CANCELADO' || guide.status === 'INCIDENCIA') {
      return TIMELINE_STEPS.indexOf(step) < TIMELINE_STEPS.indexOf(guide.status as GuideStatus);
    }
    return TIMELINE_STEPS.indexOf(step) <= TIMELINE_STEPS.indexOf(guide.status as GuideStatus);
  }

  addItem(): void {
    const p = this.products.find(x => String(x.id) === this.selectedProductId);
    if (!p) return;
    const existing = this.items.find(i => i.productId === p.id);
    if (existing) { existing.quantity++; }
    else { this.items = [...this.items, { productId: p.id, productName: p.name, quantity: 1 }]; }
    this.selectedProductId = '';
  }

  removeItem(i: number): void {
    this.items = this.items.filter((_, j) => j !== i);
  }

  resetForm(): void {
    this.form = { type: 'TRASLADO', originWarehouseId: '', destinationWarehouseId: '', description: '' };
    this.items = [];
    this.selectedProductId = '';
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/transfer-guides', {
        type:                   this.form.type,
        originWarehouseId:      this.form.originWarehouseId      ? Number(this.form.originWarehouseId)      : null,
        destinationWarehouseId: this.form.destinationWarehouseId ? Number(this.form.destinationWarehouseId) : null,
        description:            this.form.description,
        items:                  this.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      this.toast.success('Guía creada');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear guía');
    } finally {
      this.saving = false;
    }
  }

  async advance(id: number, action: string): Promise<void> {
    try {
      const updated = await this.api.patch<TransferGuideResponse>(`/transfer-guides/${id}/${action}`);
      this.rows = this.rows.map(r => r.id === id ? updated : r);
      if (this.selectedGuide?.id === id) this.selectedGuide = updated;
      this.toast.success('Estado actualizado');
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Error al actualizar estado');
    }
  }

  openIncident(guide: TransferGuideResponse): void {
    this.selectedGuide  = guide;
    this.incidentForm   = { reason: '', evidenceUrl: '', stockRecoverable: true };
    this.incidentOpen   = true;
  }

  async submitIncident(): Promise<void> {
    if (!this.selectedGuide) return;
    this.incidentSaving = true;
    try {
      const updated = await this.api.patch<TransferGuideResponse>(
        `/transfer-guides/${this.selectedGuide.id}/incident`,
        this.incidentForm
      );
      this.rows = this.rows.map(r => r.id === updated.id ? updated : r);
      this.selectedGuide  = updated;
      this.incidentOpen   = false;
      this.toast.success('Incidencia registrada');
    } catch {
      this.toast.error('Error al registrar incidencia');
    } finally {
      this.incidentSaving = false;
    }
  }
}