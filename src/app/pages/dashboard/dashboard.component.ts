import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ApiService } from '../../core/api.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type DashboardMetrics = Record<string, number>;

interface CardDef {
  label: string;
  key: string;
  icon: string;
  money?: boolean;
}

const ALL_CARDS: CardDef[] = [
  { label: 'Productos',            key: 'totalProducts',    icon: '▪' },
  { label: 'Órdenes',              key: 'totalOrders',      icon: '▸' },
  { label: 'Compras',              key: 'totalPurchases',   icon: '◫' },
  { label: 'Ventas totales',       key: 'totalSales',       icon: '₿', money: true },
  { label: 'Ventas hoy',           key: 'todaySales',       icon: '▣', money: true },
  { label: 'Productos bajo stock', key: 'lowStockProducts', icon: '⚠' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  loading = true;

  s: DashboardMetrics = {};
  cards: CardDef[] = [];

  async ngOnInit(): Promise<void> {
    try {
      this.s = await this.api.get<DashboardMetrics>('/dashboard');
      this.cards = ALL_CARDS.filter((c) => c.key in this.s);
    } catch {
    } finally {
      this.loading = false;
    }
  }
}