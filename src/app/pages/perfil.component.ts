import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { PageHeaderComponent } from '../layout/page-header.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Mi perfil" description="Información de tu cuenta." />
      <div class="max-w-xl rounded-xl border border-border/60 bg-card p-6 space-y-5">
        <div>
          <p class="text-xs uppercase tracking-wider text-muted-foreground">Nombre completo</p>
          <p class="mt-1 font-medium">{{ auth.user()?.fullName }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-muted-foreground">Correo electrónico</p>
          <p class="mt-1 font-mono text-sm">{{ auth.user()?.email }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-muted-foreground">Rol</p>
          <div class="mt-2">
            <span class="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
              {{ auth.user()?.role }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
}