import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ApiService } from '../../core/api.service';

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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
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
    } catch {}
  }
}