import { Component, inject } from '@angular/core';
import { ThemeService, type Palette, type ThemeMode } from '../core/theme.service';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  templateUrl: './settings-menu.component.html',
  styleUrl: './settings-menu.component.css',
})
export class SettingsMenuComponent {
  readonly theme = inject(ThemeService);

  readonly palettes: { id: Palette; label: string; swatch: string }[] = [
    { id: 'burgundy', label: 'Burgundy (predeterminada)', swatch: 'oklch(0.45 0.18 20)' },
    { id: 'malbec',   label: 'Malbec',                   swatch: 'oklch(0.40 0.17 350)' },
    { id: 'reserva',  label: 'Reserva',                   swatch: 'oklch(0.40 0.10 60)' },
    { id: 'blanco',   label: 'Blanco',                    swatch: 'oklch(0.55 0.12 130)' },
  ];

  setMode(m: ThemeMode): void { this.theme.setMode(m); }
  setPalette(p: Palette): void { this.theme.setPalette(p); }

  onToggle(el: HTMLDetailsElement): void {
    if (!el.open) return;
  }

  close(el: HTMLDetailsElement): void {
    el.open = false;
  }
}