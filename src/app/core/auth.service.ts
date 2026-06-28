import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { AppRole } from './app-role';
import { mapBackendRole } from './app-role';
import type { LoginRequest, LoginResponse, TokenRefreshRequest } from './auth.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY         = 'erp-token';
const REFRESH_TOKEN_KEY = 'erp-refresh-token';
const USER_KEY          = 'erp-user';
const API = `${environment.apiUrl}/api`;

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
        this.http.post<LoginResponse>(`${API}/auth/login`, request)
      );
      this.saveSession(response);
    } finally {
      this._loading.set(false);
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token disponible');

    const body: TokenRefreshRequest = { refreshToken };
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${API}/auth/refresh`, body)
    );
    this.saveSession(response);
    return response;
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
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private saveSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY,         response.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY,          JSON.stringify(response));
    this._user.set(response);
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