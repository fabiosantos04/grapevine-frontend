import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ApiService } from '../core/api.service';

type SalesReport    = { totalOrders: number; totalSales: number };
type CashReport     = { openedRegisters: number; totalCash: number };
type InventoryReport = { totalProducts: number; lowStockProducts: number };
type PurchaseReport = { totalPurchases: number; totalSpent: number };

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Reportes de saldos" description="Resumen consolidado de ventas, caja, inventario y compras." />

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (c of cards; track c.label) {
          <div class="rounded-xl border border-border/60 bg-card p-6">
            <p class="text-xs uppercase tracking-wider text-muted-foreground">{{ c.label }}</p>
            <p class="mt-3 font-display text-3xl font-bold"
              [class]="c.money ? 'text-accent' : ''">
              @if (c.money) { S/ {{ c.value | number: '1.2-2' }} }
              @else { {{ c.value }} }
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReportesComponent implements OnInit {
  private readonly api = inject(ApiService);

  cards: { label: string; value: number; money?: boolean }[] = [];

  async ngOnInit(): Promise<void> {
    try {
      const [sales, cash, inventory, purchases] = await Promise.all([
        this.api.get<SalesReport>('/reports/sales'),
        this.api.get<CashReport>('/reports/cash'),
        this.api.get<InventoryReport>('/reports/inventory'),
        this.api.get<PurchaseReport>('/reports/purchases'),
      ]);

      this.cards = [
        { label: 'Órdenes totales',      value: sales.totalOrders },
        { label: 'Total en ventas',       value: Number(sales.totalSales),      money: true },
        { label: 'Cajas abiertas',        value: cash.openedRegisters },
        { label: 'Efectivo en caja',      value: Number(cash.totalCash),        money: true },
        { label: 'Productos registrados', value: inventory.totalProducts },
        { label: 'Bajo stock',            value: inventory.lowStockProducts },
        { label: 'Compras registradas',   value: purchases.totalPurchases },
      ];
    } catch {
      // silencioso, las tarjetas quedan vacías
    }
  }
}