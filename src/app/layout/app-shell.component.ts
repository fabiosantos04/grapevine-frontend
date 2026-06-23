import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { AppRole } from '../core/app-role';
import { AuthService } from '../core/auth.service';
import { SettingsMenuComponent } from './settings-menu.component';
import { environment } from '../../environments/environment';

type NavItem = { to: string; label: string; icon: string; roles: AppRole[] };
type NavGroup = { section: string; items: NavItem[] };

const ALL: AppRole[] = ['admin', 'ingeniero', 'cajero', 'almacenero', 'vendedor'];

const NAV: NavGroup[] = [
  {
    section: 'General',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: '▣', roles: ALL },
      { to: '/app/perfil', label: 'Mi perfil', icon: '◉', roles: ALL },
    ],
  },
  {
    section: 'Finanzas',
    items: [
      { to: '/app/cuentas', label: 'Cuentas bancarias', icon: '₿', roles: ['admin', 'ingeniero'] },
      { to: '/app/cajas', label: 'Cajas', icon: '▤', roles: ['admin', 'cajero', 'ingeniero'] },
      { to: '/app/movimientos', label: 'Movimientos', icon: '↔', roles: ['admin', 'cajero', 'ingeniero'] },
      { to: '/app/reportes', label: 'Reportes de saldos', icon: '▥', roles: ['admin', 'cajero', 'ingeniero'] },
    ],
  },
  {
    section: 'Compras',
    items: [
      { to: '/app/solicitudes', label: 'Solicitudes', icon: '☰', roles: ['admin', 'almacenero', 'ingeniero'] },
      { to: '/app/proveedores', label: 'Proveedores', icon: '⌂', roles: ['admin', 'ingeniero'] },
      { to: '/app/compras', label: 'Compras y pagos', icon: '◫', roles: ['admin', 'ingeniero'] },
    ],
  },
  {
    section: 'Logística',
    items: [
      { to: '/app/almacenes', label: 'Almacenes', icon: '▣', roles: ['almacenero', 'ingeniero'] },
      { to: '/app/productos', label: 'Productos', icon: '▪', roles: ['almacenero', 'vendedor', 'ingeniero'] },
      { to: '/app/inventario', label: 'Inventario', icon: '▦', roles: ['almacenero', 'ingeniero'] },
      { to: '/app/guias', label: 'Guías de movimiento', icon: '⛟', roles: ['almacenero', 'ingeniero'] },
    ],
  },
  {
    section: 'Ventas',
    items: [
      { to: '/app/ventas', label: 'Ventas', icon: '▸', roles: ['vendedor', 'ingeniero'] },
      { to: '/app/clientes', label: 'Clientes', icon: '◎', roles: ['vendedor', 'ingeniero'] },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/app/usuarios', label: 'Usuarios', icon: '+', roles: ['admin', 'ingeniero'] },
      { to: '/app/auditoria', label: 'Auditoría', icon: '≡', roles: ['admin', 'ingeniero'] },
    ],
  },
];

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SettingsMenuComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly version = environment.version;

  readonly visibleGroups = computed(() => {
    const roles = this.auth.roles();
    const isSoftwareEngineer = roles.includes('ingeniero');
    return NAV.map((g) => ({
      ...g,
      items: g.items.filter((it) => isSoftwareEngineer || it.roles.some((r) => roles.includes(r))),
    })).filter((g) => g.items.length > 0);
  });

  constructor() {
    effect(() => {
      if (!this.auth.loading() && !this.auth.user()) {
        void this.router.navigateByUrl('/auth/login');
      }
    });
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/auth/login');
  }
}
