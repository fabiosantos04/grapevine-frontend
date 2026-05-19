import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { AppRole } from '../core/app-role';
import { AuthService } from '../core/auth.service';
import { SettingsMenuComponent } from './settings-menu.component';

type NavItem = { to: string; label: string; icon: string; roles: AppRole[] };
type NavGroup = { section: string; items: NavItem[] };

const ALL: AppRole[] = ['admin', 'cajero', 'almacenero', 'vendedor', 'contador'];

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
      { to: '/app/cuentas', label: 'Cuentas bancarias', icon: '₿', roles: ['admin', 'contador'] },
      { to: '/app/cajas', label: 'Cajas', icon: '▤', roles: ['admin', 'cajero', 'contador'] },
      { to: '/app/movimientos', label: 'Movimientos', icon: '↔', roles: ['admin', 'cajero', 'contador'] },
      { to: '/app/reportes', label: 'Reportes de saldos', icon: '▥', roles: ['admin', 'cajero', 'contador'] },
    ],
  },
  {
    section: 'Compras',
    items: [
      { to: '/app/solicitudes', label: 'Solicitudes', icon: '☰', roles: ['admin', 'almacenero'] },
      { to: '/app/proveedores', label: 'Proveedores', icon: '⌂', roles: ['admin'] },
      { to: '/app/compras', label: 'Compras y pagos', icon: '◫', roles: ['admin'] },
    ],
  },
  {
    section: 'Logística',
    items: [
      { to: '/app/almacenes', label: 'Almacenes', icon: '▣', roles: ['admin', 'almacenero'] },
      { to: '/app/productos', label: 'Productos', icon: '▪', roles: ['admin', 'almacenero', 'vendedor'] },
      { to: '/app/inventario', label: 'Inventario', icon: '▦', roles: ['admin', 'almacenero'] },
      { to: '/app/guias', label: 'Guías de movimiento', icon: '⛟', roles: ['admin', 'almacenero'] },
    ],
  },
  {
    section: 'Ventas',
    items: [
      { to: '/app/ventas', label: 'Ventas', icon: '▸', roles: ['admin', 'vendedor'] },
      { to: '/app/clientes', label: 'Clientes', icon: '◎', roles: ['admin', 'vendedor'] },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/app/usuarios', label: 'Usuarios', icon: '+', roles: ['admin'] },
      { to: '/app/auditoria', label: 'Auditoría', icon: '≡', roles: ['admin'] },
    ],
  },
];

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SettingsMenuComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly visibleGroups = computed(() => {
    const roles = this.auth.roles();
    const isAdmin = roles.includes('admin');
    return NAV.map((g) => ({
      ...g,
      items: g.items.filter((it) => isAdmin || it.roles.some((r) => roles.includes(r))),
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
