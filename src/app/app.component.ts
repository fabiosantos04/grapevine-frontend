import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />
    @if (toast.message(); as m) {
      <div
        class="fixed right-4 top-4 z-[100] max-w-sm rounded-md border px-4 py-2 text-sm shadow-lg"
        [ngClass]="m.kind === 'success' ? 'border-accent/40 bg-card text-foreground' : 'border-destructive/40 bg-destructive/10 text-destructive'"
      >
        {{ m.text }}
      </div>
    }
  `,
})
export class AppComponent {
  readonly toast = inject(ToastService);
  private readonly _theme = inject(ThemeService);
}
