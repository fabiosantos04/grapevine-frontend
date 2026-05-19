import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export type Palette = 'burgundy' | 'malbec' | 'reserva' | 'blanco';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('dark');
  readonly palette = signal<Palette>('burgundy');

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const m = localStorage.getItem('erp-theme-mode') as ThemeMode | null;
      const p = localStorage.getItem('erp-theme-palette') as Palette | null;
      if (m === 'light' || m === 'dark') this.mode.set(m);
      if (p === 'burgundy' || p === 'malbec' || p === 'reserva' || p === 'blanco') this.palette.set(p);
    }
    effect(() => {
      const root = document.documentElement;
      const mode = this.mode();
      const palette = this.palette();
      root.classList.toggle('dark', mode === 'dark');
      root.classList.toggle('light', mode === 'light');
      root.dataset['palette'] = palette;
      localStorage.setItem('erp-theme-mode', mode);
      localStorage.setItem('erp-theme-palette', palette);
    });
  }

  setMode(m: ThemeMode): void {
    this.mode.set(m);
  }

  setPalette(p: Palette): void {
    this.palette.set(p);
  }
}
