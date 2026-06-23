import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly version = environment.version;

  readonly stats = [
    { value: '250 000', label: 'Productos vendidos al año' },
    { value: '150',     label: 'Clientes en cartera' },
    { value: '100+',    label: 'Proveedores activos' },
    { value: 'Multi',   label: 'Almacenes por ubigeo' },
  ];

  readonly modules = [
    {
      icon: '🏦',
      title: 'Administración y Contabilidad',
      description: 'Gestión de cuentas bancarias, apertura de caja, movimientos, rendiciones y reportes de saldos por fecha.',
    },
    {
      icon: '🛒',
      title: 'Ventas y Clientes',
      description: 'Registro de ventas por almacén, emisión de comprobantes, cartera de clientes e historial de compras.',
    },
    {
      icon: '📦',
      title: 'Logística y Almacén',
      description: 'Almacenes por ubigeo, guías de movimiento con seguimiento, control de stock e inventario físico.',
    },
    {
      icon: '🤝',
      title: 'Compras y Proveedores',
      description: 'Solicitudes de compra, gestión de proveedores, órdenes con flujo de estados y registro de pagos.',
    },
  ];

  irAlSistema(): void {
    this.router.navigateByUrl('/auth/login');
  }
}