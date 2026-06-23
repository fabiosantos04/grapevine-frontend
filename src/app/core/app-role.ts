export type AppRole = 'admin' | 'ingeniero' | 'cajero' | 'almacenero' | 'vendedor';

export const BACKEND_ROLES = [
  'SOFTWARE_ENGINEER',
  'ADMIN',
  'CAJERO',
  'LOGISTICA',
  'VENDEDOR',
] as const;

export type BackendRole = typeof BACKEND_ROLES[number];

export const ROLE_LABELS: Record<BackendRole, string> = {
  SOFTWARE_ENGINEER: 'Ingeniero de Software',
  ADMIN: 'Administrador',
  CAJERO: 'Cajero',
  LOGISTICA: 'Almacén',
  VENDEDOR: 'Vendedor',
};

export function mapBackendRole(role: string): AppRole | null {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'SOFTWARE_ENGINEER':
      return 'ingeniero';
    case 'CAJERO':
      return 'cajero';
    case 'LOGISTICA':
      return 'almacenero';
    case 'VENDEDOR':
      return 'vendedor';
    default:
      return null;
  }
}

export function hasAnyAppRole(userRoles: AppRole[], allowed: AppRole[]): boolean {
  return allowed.some((role) => userRoles.includes(role));
}
