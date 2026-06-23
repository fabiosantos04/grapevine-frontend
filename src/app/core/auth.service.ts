import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { AppRole } from './app-role';
import { mapBackendRole } from './app-role';
import type { LoginRequest, LoginResponse } from './auth.model';

const TOKEN_KEY = 'erp-token';
const USER_KEY  = 'erp-user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly _user    = signal<LoginResponse | null>(this.loadUser());
  private readonly _loading = signal(false);

  readonly user            = this._user.asReadonly();
  readonly loading         = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  readonly roles = computed((): AppRole[] => {
    const u = this._user();
    if (!u) return [];
    const mapped = mapBackendRole(u.role);
    return mapped ? [mapped] : [];
  });

  readonly ready: Promise<void> = Promise.resolve();

  isSoftwareEngineer(): boolean {
    return this.roles().includes('ingeniero');
  }

  canManageUsers(): boolean {
    return hasAny(this.roles(), ['admin', 'ingeniero']);
  }

  canViewAudit(): boolean {
    return hasAny(this.roles(), ['admin', 'ingeniero']);
  }

  canApprovePurchases(): boolean {
    return hasAny(this.roles(), ['admin', 'ingeniero']);
  }

  canApproveCashRenditions(): boolean {
    return hasAny(this.roles(), ['admin', 'ingeniero']);
  }

  async login(request: LoginRequest): Promise<void> {
    this._loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>('http://localhost:8080/api/auth/login', request)
      );
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response));
      this._user.set(response);
    } finally {
      this._loading.set(false);
    }
  }

  mustChangePassword(): boolean {
    return this._user()?.mustChangePassword ?? false;
  }

  updateUser(partial: Partial<LoginResponse>): void {
    const current = this._user();
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this._user.set(updated);
  }

  signOut(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}

function hasAny(userRoles: AppRole[], allowed: AppRole[]): boolean {
  return allowed.some((role) => userRoles.includes(role));
}
