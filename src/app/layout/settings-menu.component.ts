import { Component, inject } from '@angular/core';
import { ThemeService, type Palette, type ThemeMode } from '../core/theme.service';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  template: `
    <details class="relative" #details (toggle)="onToggle(details)">
      <summary
        class="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-foreground hover:bg-muted/50 [&::-webkit-details-marker]:hidden"
        aria-label="Configuración"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </summary>
      <div
        class="absolute right-0 z-50 mt-1 w-64 rounded-md border border-border bg-card p-2 text-sm shadow-lg"
      >
        <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Apariencia</div>
        <button type="button" class="flex w-full items-center rounded px-2 py-2 text-left hover:bg-muted/40" (click)="setMode('light'); close(details)">
          <span class="mr-2">☀</span> Modo claro
          @if (theme.mode() === 'light') {
            <span class="ml-auto">✓</span>
          }
        </button>
        <button type="button" class="flex w-full items-center rounded px-2 py-2 text-left hover:bg-muted/40" (click)="setMode('dark'); close(details)">
          <span class="mr-2">☾</span> Modo oscuro
          @if (theme.mode() === 'dark') {
            <span class="ml-auto">✓</span>
          }
        </button>
        <div class="my-2 h-px bg-border"></div>
        <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Paleta de colores</div>
        @for (p of palettes; track p.id) {
          <button type="button" class="flex w-full items-center rounded px-2 py-2 text-left hover:bg-muted/40" (click)="setPalette(p.id); close(details)">
            <span class="mr-2 inline-block h-4 w-4 rounded-full border border-border" [style.background]="p.swatch"></span>
            {{ p.label }}
            @if (theme.palette() === p.id) {
              <span class="ml-auto">✓</span>
            }
          </button>
        }
      </div>
    </details>
  `,
})
export class SettingsMenuComponent {
  readonly theme = inject(ThemeService);

  readonly palettes: { id: Palette; label: string; swatch: string }[] = [
    { id: 'burgundy', label: 'Burgundy (predeterminada)', swatch: 'oklch(0.45 0.18 20)' },
    { id: 'malbec', label: 'Malbec', swatch: 'oklch(0.40 0.17 350)' },
    { id: 'reserva', label: 'Reserva', swatch: 'oklch(0.40 0.10 60)' },
    { id: 'blanco', label: 'Blanco', swatch: 'oklch(0.55 0.12 130)' },
  ];

  setMode(m: ThemeMode): void {
    this.theme.setMode(m);
  }

  setPalette(p: Palette): void {
    this.theme.setPalette(p);
  }

  onToggle(el: HTMLDetailsElement): void {
    if (!el.open) return;
  }

  close(el: HTMLDetailsElement): void {
    el.open = false;
  }
}
