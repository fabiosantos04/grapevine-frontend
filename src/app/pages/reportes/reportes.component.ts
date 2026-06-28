import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ApiService } from '../../core/api.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type MonthlyDataPoint = { month: string; sales: number; purchases: number };

type FullReport = {
  totalOrders: number;
  totalSales: number;
  openedRegisters: number;
  totalCash: number;
  totalProducts: number;
  lowStockProducts: number;
  totalPurchases: number;
  totalSpent: number;
  monthly: MonthlyDataPoint[];
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
})
export class ReportesComponent implements OnInit {
  @ViewChild('barChart')  barChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(ApiService);
  loading = true;

  report: FullReport | null = null;
  cards: { label: string; value: number; money?: boolean }[] = [];

  filterFrom = '';
  filterTo = '';
  rangeActive = false;

  private barChartInstance: any = null;
  private lineChartInstance: any = null;

  get dateRangeInvalid(): boolean {
    return !!this.filterFrom && !!this.filterTo && this.filterTo < this.filterFrom;
  }

  get canApplyFilter(): boolean {
    return !!this.filterFrom && !!this.filterTo && !this.dateRangeInvalid;
  }

  async ngOnInit(): Promise<void> {
    await this.loadReport();
    this.loading = false;
  }

  async loadReport(): Promise<void> {
    try {
      const query = this.filterFrom && this.filterTo
        ? `?start=${this.filterFrom}&end=${this.filterTo}`
        : '';
      this.report = await this.api.get<FullReport>(`/reports/full${query}`);
      this.rangeActive = !!query;
      this.cards = [
        { label: 'Órdenes totales',      value: this.report.totalOrders },
        { label: 'Total en ventas',       value: Number(this.report.totalSales),    money: true },
        { label: 'Efectivo en caja',      value: Number(this.report.totalCash),     money: true },
        { label: 'Total en compras',      value: Number(this.report.totalSpent),    money: true },
        { label: 'Productos registrados', value: this.report.totalProducts },
        { label: 'Bajo stock',            value: this.report.lowStockProducts },
        { label: 'Compras registradas',   value: this.report.totalPurchases },
        { label: 'Cajas registradas',     value: this.report.openedRegisters },
      ];
      setTimeout(() => this.renderCharts(), 100);
    } catch {}
  }

  async aplicarFiltro(): Promise<void> {
    if (!this.canApplyFilter) return;
    this.loading = true;
    await this.loadReport();
    this.loading = false;
  }

  async limpiarFiltro(): Promise<void> {
    this.filterFrom = '';
    this.filterTo = '';
    this.loading = true;
    await this.loadReport();
    this.loading = false;
  }

  private renderCharts(): void {
    if (!this.report || !this.barChartRef || !this.lineChartRef) return;

    const monthly = this.report.monthly;
    const labels  = monthly.map(m => m.month);
    const sales   = monthly.map(m => Number(m.sales));
    const purch   = monthly.map(m => Number(m.purchases));

    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.barChartInstance) this.barChartInstance.destroy();
    if (this.lineChartInstance) this.lineChartInstance.destroy();

    const barCtx = this.barChartRef.nativeElement.getContext('2d');
    if (barCtx) {
      this.barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Ingresos', data: sales, backgroundColor: 'rgba(201, 168, 76, 0.8)', borderRadius: 4 },
            { label: 'Egresos',  data: purch, backgroundColor: 'rgba(122, 28, 46, 0.8)',  borderRadius: 4 },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0' } } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    }

    const lineCtx = this.lineChartRef.nativeElement.getContext('2d');
    if (lineCtx) {
      this.lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Ingresos',
            data: sales,
            borderColor: '#c9a84c',
            backgroundColor: 'rgba(201, 168, 76, 0.15)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#c9a84c',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0' } } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    }
  }
}