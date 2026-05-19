import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ApiService } from '../core/api.service';

type DashboardResponse = {
  totalProducts: number;
  totalOrders: number;
  totalPurchases: number;
  totalSales: number;
  todaySales: number;
  lowStockProducts: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Panel de control" description="Resumen general del ERP Vitivinícolas Perú." />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (c of cards; track c.label) {
          <div class="rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-accent/40">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ c.label }}</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-wine text-sm text-primary-foreground">
                {{ c.icon }}
              </div>
            </div>
            <div class="mt-4 font-display text-4xl font-bold">
              @if (c.money) { S/ {{ s[c.key] | number: '1.2-2' }} }
              @else { {{ s[c.key] }} }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  s: DashboardResponse = {
    totalProducts: 0,
    totalOrders: 0,
    totalPurchases: 0,
    totalSales: 0,
    todaySales: 0,
    lowStockProducts: 0,
  };

  readonly cards: { label: string; key: keyof DashboardResponse; icon: string; money?: boolean }[] = [
    { label: 'Productos',            key: 'totalProducts',    icon: '▪' },
    { label: 'Órdenes',              key: 'totalOrders',      icon: '▸' },
    { label: 'Compras',              key: 'totalPurchases',   icon: '◫' },
    { label: 'Ventas totales',       key: 'totalSales',       icon: '₿', money: true },
    { label: 'Ventas hoy',           key: 'todaySales',       icon: '▣', money: true },
    { label: 'Productos bajo stock', key: 'lowStockProducts', icon: '⚠' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.s = await this.api.get<DashboardResponse>('/dashboard');
    } catch {
      // el interceptor ya maneja errores de auth
    }
  }
}