import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { AuthLayoutComponent } from './layout/auth-layout.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home-redirect.component').then((m) => m.HomeRedirectComponent) },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./pages/auth-login.component').then((m) => m.AuthLoginComponent) },
      { path: 'forgot', loadComponent: () => import('./pages/auth-forgot.component').then((m) => m.AuthForgotComponent) },
      { path: 'reset', loadComponent: () => import('./pages/auth-reset.component').then((m) => m.AuthResetComponent) },
    ],
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil.component').then((m) => m.PerfilComponent) },
      { path: 'cuentas', loadComponent: () => import('./pages/cuentas.component').then((m) => m.CuentasComponent) },
      { path: 'cajas', loadComponent: () => import('./pages/cajas.component').then((m) => m.CajasComponent) },
      { path: 'movimientos', loadComponent: () => import('./pages/movimientos.component').then((m) => m.MovimientosComponent) },
      { path: 'reportes', loadComponent: () => import('./pages/reportes.component').then((m) => m.ReportesComponent) },
      { path: 'solicitudes', loadComponent: () => import('./pages/solicitudes.component').then((m) => m.SolicitudesComponent) },
      { path: 'proveedores', loadComponent: () => import('./pages/proveedores.component').then((m) => m.ProveedoresComponent) },
      { path: 'compras', loadComponent: () => import('./pages/compras.component').then((m) => m.ComprasComponent) },
      { path: 'almacenes', loadComponent: () => import('./pages/almacenes.component').then((m) => m.AlmacenesComponent) },
      { path: 'productos', loadComponent: () => import('./pages/productos.component').then((m) => m.ProductosComponent) },
      { path: 'inventario', loadComponent: () => import('./pages/inventario.component').then((m) => m.InventarioComponent) },
      { path: 'guias', loadComponent: () => import('./pages/guias.component').then((m) => m.GuiasComponent) },
      { path: 'ventas', loadComponent: () => import('./pages/ventas.component').then((m) => m.VentasComponent) },
      { path: 'clientes', loadComponent: () => import('./pages/clientes.component').then((m) => m.ClientesComponent) },
      { path: 'usuarios', loadComponent: () => import('./pages/usuarios.component').then((m) => m.UsuariosComponent) },
      { path: 'auditoria', loadComponent: () => import('./pages/auditoria.component').then((m) => m.AuditoriaComponent) },
    ],
  },
  { path: '**', loadComponent: () => import('./pages/not-found.component').then((m) => m.NotFoundComponent) },
];