import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type AuditLog = {
  id: number;
  action: string;
  description: string;
  performedBy: string;
  performedByEmail: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  VENTA_CREADA: 'Venta creada',
  VENTA_ANULADA: 'Venta anulada',
  COMPRA_CREADA: 'Compra creada',
  COMPRA_SENT: 'Compra enviada',
  COMPRA_CONFIRMED: 'Compra confirmada',
  COMPRA_RECEIVED: 'Compra recibida',
  COMPRA_PAID: 'Compra pagada',
  COMPRA_CANCELLED: 'Compra cancelada',
  CAJA_ABIERTA: 'Caja abierta',
  CAJA_CERRADA: 'Caja cerrada',
  MOVIMIENTO_CREADO: 'Movimiento creado',
  MOVIMIENTO_APPROVED: 'Movimiento aprobado',
  MOVIMIENTO_REJECTED: 'Movimiento rechazado',
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_ACTUALIZADO: 'Usuario actualizado',
  CUENTA_BANCARIA_CREADA: 'Cuenta bancaria creada',
  CUENTA_BANCARIA_ACTUALIZADA: 'Cuenta bancaria actualizada',
  CUENTA_BANCARIA_HABILITADA: 'Cuenta bancaria habilitada',
  CUENTA_BANCARIA_INHABILITADA: 'Cuenta bancaria inhabilitada',
  PRODUCTO_CREADO: 'Producto creado',
  PRODUCTO_ACTUALIZADO: 'Producto actualizado',
  PRODUCTO_HABILITADO: 'Producto habilitado',
  PRODUCTO_INHABILITADO: 'Producto inhabilitado',
  PROVEEDOR_CREADO: 'Proveedor creado',
  PROVEEDOR_HABILITADO: 'Proveedor habilitado',
  PROVEEDOR_INHABILITADO: 'Proveedor inhabilitado',
  CLIENTE_CREADO: 'Cliente creado',
  CLIENTE_ACTUALIZADO: 'Cliente actualizado',
  CLIENTE_HABILITADO: 'Cliente habilitado',
  CLIENTE_INHABILITADO: 'Cliente inhabilitado',
  ALMACEN_CREADO: 'Almacén creado',
  ALMACEN_ACTUALIZADO: 'Almacén actualizado',
  ALMACEN_HABILITADO: 'Almacén habilitado',
  ALMACEN_INHABILITADO: 'Almacén inhabilitado',
  GUIA_CREADA: 'Guía creada',
  GUIA_ACTUALIZADA: 'Guía actualizada',
  GUIA_ELIMINADA: 'Guía eliminada',
  GUIA_PREPARANDO: 'Guía en preparación',
  GUIA_EN_TRANSITO: 'Guía en tránsito',
  GUIA_ENTREGADO: 'Guía entregada',
  GUIA_INCIDENCIA: 'Guía con incidencia',
  GUIA_CANCELADO: 'Guía cancelada',
  SOLICITUD_CREADA: 'Solicitud creada',
  SOLICITUD_APPROVED: 'Solicitud aprobada',
  SOLICITUD_REJECTED: 'Solicitud rechazada',
};

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.css',
})
export class AuditoriaComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  loading = true;

  rows: AuditLog[] = [];
  search = '';
  filterAction = '';
  filterFrom = '';
  filterTo = '';

  readonly actions = Object.keys(ACTION_LABELS);

  get dateRangeInvalid(): boolean {
    return !!this.filterFrom && !!this.filterTo && this.filterTo < this.filterFrom;
  }

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    if (!this.auth.canViewAudit()) {
      await this.router.navigateByUrl('/app/dashboard');
      return;
    }
    await this.load();
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      const params: string[] = [];
      if (this.filterFrom) params.push(`from=${this.filterFrom}`);
      if (this.filterTo) params.push(`to=${this.filterTo}`);
      const query = params.length ? `?${params.join('&')}` : '';
      this.rows = await this.api.get<AuditLog[]>(`/audit-logs${query}`);
    } catch {
      this.rows = [];
    }
  }

  async aplicarFiltroFecha(): Promise<void> {
    if (this.dateRangeInvalid) return;
    this.loading = true;
    await this.load();
    this.loading = false;
  }

  async limpiarFiltros(): Promise<void> {
    this.search = '';
    this.filterAction = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.loading = true;
    await this.load();
    this.loading = false;
  }

  label(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  colorClass(action: string): string {
    if (action.includes('ANULADA') || action.includes('CANCELLED') || action.includes('REJECTED')) {
      return 'bg-destructive/20 text-destructive';
    }
    if (action.includes('CREADA') || action.includes('CREADO') || action.includes('PAID') || action.includes('APPROVED') || action.includes('ABIERTA') || action === 'LOGIN') {
      return 'bg-accent/20 text-accent';
    }
    return 'bg-muted text-muted-foreground';
  }

  get filtered(): AuditLog[] {
    const term = this.search.trim().toLowerCase();
    return this.rows.filter(r => {
      const matchSearch = !term
        || r.description.toLowerCase().includes(term)
        || r.performedBy.toLowerCase().includes(term);
      const matchAction = !this.filterAction || r.action === this.filterAction;
      return matchSearch && matchAction;
    });
  }
}